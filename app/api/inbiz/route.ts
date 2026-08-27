import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import {
  analyzePrompt,
  analyzeSystem,
  diagnosePrompt,
  diagnoseSystem,
  meetPrompt,
  meetSystem,
  staffPrompt,
  staffSystem,
  DEPT_BY_KEY,
  type InbizEvent,
  type InbizRequest,
} from "@/lib/inbiz";
import { MOCK_PACE, mockInbiz } from "@/lib/inbizMock";

export const runtime = "nodejs";
export const maxDuration = 180;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 대표는 깊게, 부서는 빠르게 — 단계마다 다른 체급을 쓴다 */
const HEAD_MODEL = "claude-opus-5";
const DEPT_MODEL = "claude-sonnet-5";

const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function POST(req: Request) {
  const body = (await req.json()) as InbizRequest;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (e: InbizEvent) => {
        if (closed) return;
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };

      if (body.op === "analyze") {
        // 부서는 동시에 돈다. 하나가 실패해도 나머지 조직은 계속 일한다.
        const targets = body.targets ?? [];
        await Promise.all(targets.map((slot) => runOne(body, slot, send, req.signal)));
      } else {
        await runOne(body, "head", send, req.signal);
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

function configFor(body: InbizRequest, slot: string) {
  const reports = (body.reports ?? []).map((r) => ({ name: r.name, text: r.text }));

  switch (body.op) {
    case "staff":
      return {
        model: HEAD_MODEL,
        system: staffSystem(),
        prompt: staffPrompt(body.idea),
        temperature: 0.4,
      };
    case "meet":
      return {
        model: HEAD_MODEL,
        system: meetSystem(),
        prompt: meetPrompt(body.idea, reports),
        temperature: 0.6,
      };
    case "diagnose":
      return {
        model: HEAD_MODEL,
        system: diagnoseSystem(),
        prompt: diagnosePrompt(body.idea, reports, body.meetings ?? []),
        temperature: 0.3,
      };
    default: {
      const def = DEPT_BY_KEY[slot];
      const why = body.depts?.find((d) => d.key === slot)?.why ?? "";
      if (!def) return null;
      return {
        model: DEPT_MODEL,
        system: analyzeSystem(def, why),
        prompt: analyzePrompt(body.idea),
        temperature: 0.7,
      };
    }
  }
}

async function runOne(
  body: InbizRequest,
  slot: string,
  send: (e: InbizEvent) => void,
  signal: AbortSignal,
) {
  const t0 = Date.now();
  const conf = configFor(body, slot);
  if (!conf) {
    send({ t: "error", slot, message: "모르는 부서입니다" });
    return;
  }

  const useMock = body.mock ?? !hasKey();
  send({ t: "start", slot, mock: useMock });

  try {
    if (useMock) {
      const text = mockInbiz(body, slot);
      const pace = MOCK_PACE[slot] ?? { chunk: 5, delay: 16, start: 240 };
      await sleep(pace.start);
      for (let i = 0; i < text.length; i += pace.chunk) {
        if (signal.aborted) break;
        send({ t: "delta", slot, d: text.slice(i, i + pace.chunk) });
        await sleep(pace.delay);
      }
    } else {
      const result = streamText({
        model: anthropic(conf.model),
        system: conf.system,
        prompt: conf.prompt,
        temperature: conf.temperature,
        abortSignal: signal,
      });
      for await (const d of result.textStream) send({ t: "delta", slot, d });
    }
    send({ t: "done", slot, ms: Date.now() - t0 });
  } catch (e) {
    send({ t: "error", slot, message: readable(e) });
  }
}

function readable(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/api key|unauthor|401|403/i.test(raw)) return "Anthropic 키가 없거나 거절됐습니다";
  if (/rate|429/i.test(raw)) return "요청이 몰렸습니다. 잠시 뒤 다시";
  if (/abort/i.test(raw)) return "중단됨";
  if (/not found|404|model/i.test(raw)) return "모델을 찾을 수 없습니다";
  return raw.slice(0, 120);
}
