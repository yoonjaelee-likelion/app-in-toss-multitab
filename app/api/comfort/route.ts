import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamText, type LanguageModel } from "ai";
import {
  comfortPrompt,
  comfortSystem,
  type ComfortEvent,
  type ComfortRequest,
} from "@/lib/comfort";
import { COMFORT_PACE, mockComfort } from "@/lib/comfortMock";
import { ENV_KEY, MODEL_BY_ID, type ModelDef } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const body = (await req.json()) as ComfortRequest;
  const enc = new TextEncoder();
  const def = MODEL_BY_ID[body.cast?.[body.friend] ?? ""];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (e: ComfortEvent) => {
        if (closed) return;
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };

      if (!def) {
        send({ t: "error", message: "친구에게 배정된 모델이 없습니다" });
        controller.close();
        return;
      }

      const t0 = Date.now();
      const useMock = body.mock ?? !hasKey(def);
      send({ t: "start", mock: useMock });

      try {
        if (useMock) {
          const text = mockComfort(body);
          const pace = COMFORT_PACE[body.friend] ?? { chunk: 4, delay: 22, start: 400 };
          await sleep(pace.start);
          for (let i = 0; i < text.length; i += pace.chunk) {
            if (req.signal.aborted) break;
            send({ t: "delta", d: text.slice(i, i + pace.chunk) });
            await sleep(pace.delay);
          }
        } else {
          const result = streamText({
            model: resolve(def),
            system: comfortSystem(body),
            prompt: comfortPrompt(body),
            temperature: 0.95,
            abortSignal: req.signal,
          });
          for await (const d of result.textStream) send({ t: "delta", d });
        }
        send({ t: "done", ms: Date.now() - t0 });
      } catch (e) {
        send({ t: "error", message: readable(e, def) });
      }

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

function readable(e: unknown, def: ModelDef): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/api key|unauthor|401|403/i.test(raw)) return `${def.maker} 키가 없거나 거절됐습니다`;
  if (/rate|429/i.test(raw)) return "요청이 몰렸습니다. 잠시 뒤 다시";
  if (/abort/i.test(raw)) return "중단됨";
  if (/not found|404|model/i.test(raw)) return `${def.modelId} 를 찾을 수 없습니다`;
  return raw.slice(0, 120);
}
