import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamText, type LanguageModel } from "ai";
import {
  courtPrompt,
  courtSystem,
  type CourtEvent,
  type CourtRequest,
  type RoleKey,
} from "@/lib/court";
import { MOCK_PACE, mockCourt } from "@/lib/courtMock";
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

/** 선고와 평의는 형식을 지켜야 해서 낮게, 변론은 세게 나가야 해서 높게 */
const TEMP: Record<CourtRequest["op"], number> = {
  open: 0.7,
  callWoman: 0.7,
  argue: 0.95,
  wrap: 0.7,
  jury: 0.9,
  verdict: 0.4,
};

/** 한 요청에 한 사람만 말한다 — 그래야 대화가 된다 */
function speakerOf(body: CourtRequest): RoleKey {
  if (body.op === "argue") return body.speaker === "b" ? "b" : "a";
  if (body.op === "jury") return "jury";
  return "judge";
}

export async function POST(req: Request) {
  const body = (await req.json()) as CourtRequest;
  const enc = new TextEncoder();
  const role = speakerOf(body);
  const def = MODEL_BY_ID[body.cast?.[role] ?? ""];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (e: CourtEvent) => {
        if (closed) return;
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };

      if (!def) {
        send({ t: "error", message: "배역에 배정된 모델이 없습니다" });
        controller.close();
        return;
      }

      const t0 = Date.now();
      const useMock = body.mock ?? !hasKey(def);
      send({ t: "start", mock: useMock });

      try {
        if (useMock) {
          const text = mockCourt(body);
          const pace = MOCK_PACE[role] ?? { chunk: 4, delay: 16, start: 400 };
          await sleep(pace.start);
          for (let i = 0; i < text.length; i += pace.chunk) {
            if (req.signal.aborted) break;
            send({ t: "delta", d: text.slice(i, i + pace.chunk) });
            await sleep(pace.delay);
          }
        } else {
          const result = streamText({
            model: resolve(def),
            system: courtSystem(body),
            prompt: courtPrompt(body),
            temperature: TEMP[body.op] ?? 0.8,
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
