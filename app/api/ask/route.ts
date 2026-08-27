import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamText, type LanguageModel } from "ai";
import { promptFor, systemFor, type AskEvent, type AskRequest } from "@/lib/chat";
import { MOCK_PACE, mockText } from "@/lib/mock";
import { ENV_KEY, MODEL_BY_ID, type ModelDef } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 120;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function resolve(def: ModelDef): LanguageModel {
  switch (def.provider) {
    case "openai":
      return openai(def.modelId);
    case "google":
      return google(def.modelId);
    default:
      return anthropic(def.modelId);
  }
}

const hasKey = (def: ModelDef) => Boolean(process.env[ENV_KEY[def.provider]]);

export async function POST(req: Request) {
  const body = (await req.json()) as AskRequest;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (e: AskEvent) => {
        if (closed) return;
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };

      // 모델마다 따로 실패해도 나머지는 계속 간다 — 하나 끊겼다고 화면이 비면 안 된다
      await Promise.all(body.targets.map((slot) => runOne(body, slot, send, req.signal)));

      closed = true;
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
    },
  });
}

async function runOne(
  body: AskRequest,
  slot: string,
  send: (e: AskEvent) => void,
  signal: AbortSignal,
) {
  const def = MODEL_BY_ID[slot];
  const t0 = Date.now();
  if (!def) {
    send({ t: "error", slot, message: "모르는 모델입니다" });
    return;
  }

  const useMock = body.mock ?? !hasKey(def);
  send({ t: "start", slot, mock: useMock });

  try {
    if (useMock) {
      const text = mockText(body, slot);
      const pace = MOCK_PACE[slot] ?? { chunk: 5, delay: 18, start: 200 };
      await sleep(pace.start);
      for (let i = 0; i < text.length; i += pace.chunk) {
        if (signal.aborted) break;
        send({ t: "delta", slot, d: text.slice(i, i + pace.chunk) });
        await sleep(pace.delay);
      }
    } else {
      const result = streamText({
        model: resolve(def),
        system: systemFor(slot, body.mode),
        prompt: promptFor(body, slot),
        temperature: body.mode === "synthesis" ? 0.3 : 0.75,
        abortSignal: signal,
      });
      for await (const d of result.textStream) send({ t: "delta", slot, d });
    }
    send({ t: "done", slot, ms: Date.now() - t0 });
  } catch (e) {
    send({ t: "error", slot, message: readable(e, def) });
  }
}

function readable(e: unknown, def: ModelDef): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/api key|unauthor|401|403/i.test(raw)) return `${def.maker} 키가 없거나 거절됐습니다`;
  if (/rate|429/i.test(raw)) return "요청이 몰렸습니다. 잠시 뒤 다시";
  if (/abort/i.test(raw)) return "중단됨";
  if (/not found|404|model/i.test(raw)) return `${def.modelId} 를 찾을 수 없습니다`;
  return raw.slice(0, 120);
}
