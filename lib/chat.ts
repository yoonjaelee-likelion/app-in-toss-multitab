import { MODEL_BY_ID, type ModelDef } from "./models";

export type ReplyStatus = "pending" | "streaming" | "done" | "error" | "stopped";

export interface Reply {
  slot: string;
  text: string;
  status: ReplyStatus;
  error?: string;
  mock?: boolean;
  ms?: number;
}

export type GroupKind = "ask" | "debate" | "synthesis";

export interface UserTurn {
  kind: "user";
  id: string;
  text: string;
}

export interface GroupTurn {
  kind: "group";
  id: string;
  gkind: GroupKind;
  /** 이 묶음이 답하는 질문 */
  question: string;
  /** 토론 라운드 번호 (ask는 0) */
  round: number;
  /** 다른 AI 답을 가리고 물었는지 */
  blind: boolean;
  order: string[];
  replies: Record<string, Reply>;
}

export type Turn = UserTurn | GroupTurn;

export interface AskRequest {
  mode: GroupKind;
  targets: string[];
  question: string;
  round: number;
  blind: boolean;
  turns: Turn[];
  mock?: boolean;
}

export type AskEvent =
  | { t: "start"; slot: string; mock: boolean }
  | { t: "delta"; slot: string; d: string }
  | { t: "done"; slot: string; ms: number }
  | { t: "error"; slot: string; message: string };

/* ── 프롬프트 ─────────────────────────────────────────────── */

const BASE = (me: ModelDef) =>
  [
    `너는 ${me.name}(${me.maker})이다. 지금 여러 AI가 함께 들어와 있는 하나의 대화창에 있다.`,
    "다른 AI의 답에 맞추려 하지 마라. 동의가 목적이 아니다. 네가 실제로 맞다고 보는 것을 쓴다.",
    "다른 AI가 이미 말한 내용을 그대로 되풀이하지 않는다. 겹치면 각도를 바꾸거나 빠진 것을 짚는다.",
    "한국어로 답한다. 자기소개나 인사말 없이 바로 본론으로 들어간다. 사과하지 않는다.",
    "확실하지 않은 것은 확실하지 않다고 쓴다. 지어내지 않는다.",
    "마크다운 제목(#)은 쓰지 않는다. 필요하면 짧은 문단과 - 목록만 쓴다.",
  ].join("\n");

export function systemFor(slot: string, mode: GroupKind): string {
  const me = MODEL_BY_ID[slot];
  if (!me) return "";
  const extra =
    mode === "debate"
      ? "이번 차례는 토론이다. 다른 AI의 답에서 틀렸거나 약한 지점을 하나 이상 이름을 대며 지적한다. 동의하는 부분이 있으면 동의한다고 먼저 밝히고 넘어간다."
      : mode === "synthesis"
        ? "이번 차례는 종합이다. 너는 심판이 아니라 정리자다. 어디서 의견이 갈렸는지, 무엇이 합의됐는지, 그래서 결론이 무엇인지를 쓴다."
        : "질문에 곧장 답한다. 길이는 필요한 만큼만.";
  return `${BASE(me)}\n${extra}`;
}

function transcript(turns: Turn[], slot: string, blind: boolean): string {
  const lines: string[] = [];
  for (const t of turns) {
    if (t.kind === "user") {
      lines.push(`나: ${t.text}`);
      continue;
    }
    for (const id of t.order) {
      const r = t.replies[id];
      if (!r || !r.text.trim()) continue;
      if (blind && id !== slot) continue;
      const m = MODEL_BY_ID[id];
      const who = id === slot ? `${m?.name ?? id} (너)` : (m?.name ?? id);
      const round = t.round > 0 ? ` · ${t.round}라운드` : "";
      lines.push(`${who}${round}: ${r.text.trim()}`);
    }
  }
  return lines.join("\n\n");
}

export function promptFor(req: AskRequest, slot: string): string {
  const past = transcript(req.turns, slot, req.blind);
  const parts: string[] = [];

  if (past) parts.push(`[지금까지의 대화]\n${past}`);

  if (req.mode === "debate") {
    parts.push(`[원래 질문]\n${req.question}`);
    parts.push(
      [
        `[${req.round}라운드 지시]`,
        "위에서 다른 AI들이 낸 답을 읽고,",
        "1) 네가 동의하는 지점을 한 줄로 밝히고,",
        "2) 가장 문제라고 보는 주장 하나를 「누가 그렇게 말했는지」 이름을 대며 반박하고,",
        "3) 그래서 네 답이 어떻게 바뀌는지 또는 왜 그대로인지 쓴다.",
        "전체 6문장 이내로 짧게.",
      ].join("\n"),
    );
  } else if (req.mode === "synthesis") {
    parts.push(`[원래 질문]\n${req.question}`);
    parts.push(
      [
        "[종합 지시]",
        "위 대화를 종합해서 아래 순서로 쓴다. 각 항목 앞에 라벨을 그대로 붙인다.",
        "합의: 모두가 사실상 같은 말을 한 부분 (1~2문장)",
        "갈림: 의견이 갈린 지점과 누가 어느 쪽인지 (1~3문장)",
        "결론: 질문에 대한 최종 답 (2~3문장, 조건이 있으면 조건까지)",
      ].join("\n"),
    );
  } else {
    parts.push(`[질문]\n${req.question}`);
    if (req.blind) {
      parts.push("[참고] 다른 AI의 답은 일부러 가렸다. 네 판단만으로 답한다.");
    }
  }

  return parts.join("\n\n");
}

/* ── 유틸 ─────────────────────────────────────────────────── */

export const newId = () => Math.random().toString(36).slice(2, 10);

export function emptyReplies(targets: string[]): Record<string, Reply> {
  return Object.fromEntries(
    targets.map((s) => [s, { slot: s, text: "", status: "pending" as ReplyStatus }]),
  );
}

/** 종합 카드의 합의/갈림/결론 세 토막 */
export function splitSynthesis(text: string) {
  const grab = (label: string, next: string[]) => {
    const re = new RegExp(`${label}\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${next.join("|")})\\s*[:：]|$)`);
    return re.exec(text)?.[1]?.trim() ?? "";
  };
  return {
    agree: grab("합의", ["갈림", "결론"]),
    split: grab("갈림", ["결론"]),
    answer: grab("결론", []),
  };
}
