/**
 * 법원 — 싸운 두 사람을 앉혀 놓고 AI들이 대신 싸워준다.
 *
 * 한 번에 다 쏟아내지 않는다. 재판장이 남자를 부르면 남자가 적고,
 * 여자를 부르면 여자가 적는다. 그 다음부터는 양측 대리인이 한 마디씩
 * 주고받는다. 채팅이지 문서가 아니다 — 그래서 전부 짧다.
 */

import { ANSWER_IN } from "./i18n";
import type { Lang } from "./settings";
import { MODEL_BY_ID } from "./models";

/** 대리인들이 주고받는 라운드 수. 둘로는 짧고 넷이면 늘어진다 */
export const ARGUE_ROUNDS = 3;

/* ── 등급 ─────────────────────────────────────────────────── */

export type Rating = "normal" | "adult";

/* ── 배역 ─────────────────────────────────────────────────── */

/** a = 남자 대리인, b = 여자 대리인 */
export type RoleKey = "judge" | "a" | "b" | "jury";

export type Cast = Record<RoleKey, string>;

/** 배역이 겹치면 재판이 아니라 혼잣말이다 — 기본값은 전부 다른 회사 */
export const DEFAULT_CAST: Cast = {
  judge: "opus",
  a: "gpt4o",
  b: "gemini-flash",
  jury: "sonnet",
};

export const shortOf = (id: string) => MODEL_BY_ID[id]?.short ?? id;
export const makerOf = (id: string) => MODEL_BY_ID[id]?.maker ?? "";

/* ── 사건 ─────────────────────────────────────────────────── */

export interface Party {
  name: string;
  claim: string;
}

export interface CaseFile {
  rating: Rating;
  man: Party;
  woman: Party;
}

export const nameOf = (p: Party, fallback: string) => p.name.trim() || fallback;

export const emptyCase = (rating: Rating): CaseFile => ({
  rating,
  man: { name: "", claim: "" },
  woman: { name: "", claim: "" },
});

export function caseNo(file: CaseFile): string {
  let h = 0;
  for (const ch of `${file.man.claim}|${file.woman.claim}|${file.rating}`) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return `2026${file.rating === "adult" ? "드단" : "가합"}${String((h % 9000) + 1000)}`;
}

/* ── 진행 ─────────────────────────────────────────────────── */

export type Step =
  | "idle"
  | "askMan" /* 남자 진술 대기 */
  | "askWoman" /* 여자 진술 대기 */
  | "arguing" /* 대리인들이 주고받는 중 */
  | "jury"
  | "verdict"
  | "done";

/* ── 한 마디 ──────────────────────────────────────────────── */

export type Who = "judge" | "man" | "woman" | "a" | "b" | "jury" | "verdict";

export interface Msg {
  id: string;
  who: Who;
  text: string;
  /** AI가 말한 경우 어떤 모델이었는지 */
  model?: string;
  streaming?: boolean;
  mock?: boolean;
}

/* ── 결과물 ───────────────────────────────────────────────── */

export interface Juror {
  name: string;
  /** 이 배심원이 본 남자 과실 (0~100) */
  m: number;
  note: string;
}

export interface Sentence {
  who: string;
  order: string;
}

export interface Verdict {
  order: string;
  fault: { m: number; w: number };
  sentences: Sentence[];
  remark: string;
}

/* ── 통신 ─────────────────────────────────────────────────── */

export type CourtOp = "open" | "callWoman" | "argue" | "wrap" | "jury" | "verdict";

export interface CourtRequest {
  op: CourtOp;
  /** 어느 말로 재판할지 */
  lang?: Lang;
  caseFile: CaseFile;
  cast: Cast;
  /** argue일 때 누가 말할 차례인지 */
  speaker?: RoleKey;
  round?: number;
  /** 지금까지 법정에서 나온 말 */
  record?: { who: Who; name: string; text: string }[];
  mock?: boolean;
}

export type CourtEvent =
  | { t: "start"; mock: boolean }
  | { t: "delta"; d: string }
  | { t: "done"; ms: number }
  | { t: "error"; message: string };

/* ── 프롬프트 ─────────────────────────────────────────────── */

const TONE: Record<Rating, string> = {
  normal: [
    "말투는 법정인데 내용은 웃겨야 한다. 이 어긋남이 전부다.",
    "욕설은 쓰지 않는다. 성적인 내용도 넣지 않는다.",
  ].join("\n"),
  adult: [
    "말투는 법정인데 내용은 웃겨야 한다. 이 어긋남이 전부다.",
    "19금 법정이다. 욕을 써도 된다 — 지랄, 개소리, 병신 같은 소리, 씨발 같은 말이 법정 문장에 그대로 박히는 게 웃음 포인트다.",
    "욕은 상황과 상대 논리에 대고 한다. 외모·가족·성별·출신은 건드리지 않는다. 혐오 표현과 노골적인 성 묘사는 하지 않는다.",
  ].join("\n"),
};

/** 말투 지시. 「한국어로 쓴다」를 박아 두면 영어로 갈 수가 없으므로 언어를 받는다 */
const SHORT = (lang: Lang) =>
  [
    ANSWER_IN[lang],
    "인사말·자기소개·사과 없이 바로 본론.",
    "목록(-)이나 마크다운을 쓰지 않는다. 그냥 말하듯이 쓴다.",
    "여기는 채팅이다. 길게 쓰면 아무도 안 읽는다.",
  ].join("\n");

function brief(file: CaseFile): string {
  const m = nameOf(file.man, "남자");
  const w = nameOf(file.woman, "여자");
  return [
    `[남자] ${m}`,
    `${m}의 진술: ${file.man.claim.trim() || "(아직 없음)"}`,
    `[여자] ${w}`,
    `${w}의 진술: ${file.woman.claim.trim() || "(아직 없음)"}`,
  ].join("\n");
}

function transcript(record: CourtRequest["record"] = []): string {
  const lines = record.filter((r) => r.text.trim()).map((r) => `${r.name}: ${r.text.trim()}`);
  return lines.length ? `[지금까지 나온 말]\n${lines.join("\n")}` : "";
}

/** 상대 대리인을 이름으로 깐다 — 이게 이 모드에서 제일 웃긴 지점이다 */
function rivalLine(req: CourtRequest, me: RoleKey): string {
  const rival = me === "a" ? req.cast.b : req.cast.a;
  const name = shortOf(rival);
  const maker = makerOf(rival);
  if (req.caseFile.rating === "adult") {
    return [
      `상대는 ${name}(${maker})이 맡고 있다. 반박할 때 상대를 「${name}」 또는 「${maker} 모델」이라고 이름을 대고 깐다.`,
      `예: 「지랄하고 있네. ${name}야, 네 의뢰인이 그랬으면 너는 가만있었겠냐」`,
      `예: 「병신 같은 소리 하고 앉아 있네. ${maker} 모델 따위가 사람 마음을 알겠냐」`,
      "매번 같은 문장을 쓰지 말고 그때그때 새로 만든다. 두 번 중 한 번은 이렇게 상대 모델을 걸고 넘어간다.",
    ].join("\n");
  }
  return [
    `상대는 ${name}(${maker})이 맡고 있다. 반박할 때 「${name} 대리인」이라고 이름을 대고 짚는다.`,
    `가끔은 모델을 걸고 가볍게 비꼬아도 된다. 예: 「${maker} 모델다운 답변이군요」`,
  ].join("\n");
}

export function courtSystem(req: CourtRequest): string {
  const file = req.caseFile;
  const m = nameOf(file.man, "남자");
  const w = nameOf(file.woman, "여자");
  const tone = `${TONE[file.rating]}\n${SHORT(req.lang ?? "ko")}`;

  if (req.op === "jury") {
    return [
      `너는 ${shortOf(req.cast.jury)}이고, 배심원 다섯 명을 전부 연기한다.`,
      "다섯은 성격이 완전히 달라야 한다. 연애 15년차 유부남, 모태솔로, 이혼 경험자, 극단적 여자편, 만사 귀찮은 사람 같은 식으로.",
      "아래 형식으로 정확히 다섯 줄만 쓴다. 다른 말은 한 글자도 붙이지 않는다.",
      "배심: <별명> | <남자 과실 숫자 0~100> | <한 줄 평 20자 안팎>",
      "다섯 명의 숫자는 서로 달라야 한다.",
      tone,
    ].join("\n\n");
  }

  if (req.op === "verdict") {
    return [
      `너는 ${shortOf(req.cast.judge)}이고 이 재판의 재판장이다. 어느 편도 들지 않는다.`,
      "지금은 선고다. 아래 형식을 그대로 채운다. 라벨과 순서를 지킨다.",
      [
        "주문: 결론 한 문장. 법정 주문투로.",
        "과실: 남자 <숫자> | 여자 <숫자>   (합이 반드시 100)",
        `형: ${m} | <선고할 벌 한 줄>`,
        `형: ${w} | <선고할 벌 한 줄>`,
        "훈시: 재판장의 마지막 한마디. 한 문장.",
      ].join("\n"),
      "벌은 징역이 아니라 관계에서 집행 가능한 것이다. 설거지 2주, 답장 10분 내 의무, 주말 코스 결정권 박탈 같은 것. 기한이 있어야 한다.",
      "50:50으로 도망치지 않는다. 어느 쪽이든 기울여서 낸다.",
      tone,
    ].join("\n\n");
  }

  if (req.op === "open" || req.op === "callWoman" || req.op === "wrap") {
    const job =
      req.op === "open"
        ? `개정을 선언하고, ${m}에게 무슨 일이 있었는지 진술하라고 명한다. 두 문장.`
        : req.op === "callWoman"
          ? `${m}의 진술을 한 줄로 받아넘기고, ${w}에게 반박하라고 명한다. 두 문장.`
          : "양측 대리인의 말을 끊고 배심원단에게 평의를 명한다. 한 문장. 짜증이 살짝 묻어 있으면 좋다.";
    return [
      `너는 ${shortOf(req.cast.judge)}이고 이 재판의 재판장이다.`,
      job,
      "명령형으로 끝낸다. 판사가 말이 많으면 재판이 늘어진다.",
      tone,
    ].join("\n\n");
  }

  // argue
  const me = req.speaker === "b" ? "b" : "a";
  const mine = me === "a" ? m : w;
  const other = me === "a" ? w : m;
  const round = req.round ?? 1;

  return [
    `너는 ${shortOf(req.cast[me])}이고, 이 재판에서 ${mine}의 대리인이다. 너는 ${mine} 편이고 그것만이 네 일이다.`,
    round === 1
      ? `${mine}가 왜 잘못이 없는지 세우고, ${other}의 진술에서 제일 약한 곳 하나를 찌른다.`
      : `방금 상대 대리인이 한 말을 정면으로 받아친다. 상대가 실제로 한 말만 가지고 친다.`,
    rivalLine(req, me),
    "세 문장 이내. 짧고 세게. 중립적으로 굴면 해고당한다.",
    tone,
  ].join("\n\n");
}

export function courtPrompt(req: CourtRequest): string {
  const parts = [brief(req.caseFile)];
  const past = transcript(req.record);
  if (past) parts.push(past);

  const label: Record<CourtOp, string> = {
    open: "[지시] 개정을 선언하고 남자를 부르라.",
    callWoman: "[지시] 여자를 부르라.",
    argue: `[지시] ${req.round ?? 1}차 변론을 하라.`,
    wrap: "[지시] 변론을 끊고 배심원단을 부르라.",
    jury: "[지시] 배심원 다섯 명의 평결을 형식대로 내라.",
    verdict: "[지시] 선고하라. 형식을 그대로 지킨다.",
  };
  parts.push(label[req.op]);
  return parts.join("\n\n");
}

/* ── 파싱 ─────────────────────────────────────────────────── */

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function parseJury(text: string): Juror[] {
  const out: Juror[] = [];
  for (const raw of text.split("\n")) {
    const hit = /^\s*배심\s*[:：]\s*(.+)$/.exec(raw);
    if (!hit) continue;
    const [name, num, ...rest] = hit[1].split("|").map((s) => s.trim());
    if (!name || num === undefined) continue;
    const m = Number.parseInt(num.replace(/[^\d]/g, ""), 10);
    if (Number.isNaN(m)) continue;
    out.push({ name, m: clamp(m), note: rest.join(" | ").trim() });
  }
  return out;
}

export function parseVerdict(text: string): Verdict | null {
  const grab = (label: string) =>
    new RegExp(`^\\s*${label}\\s*[:：]\\s*(.+)$`, "m").exec(text)?.[1]?.trim() ?? "";

  const order = grab("주문");
  const faultLine = grab("과실");
  const remark = grab("훈시");

  const sentences: Sentence[] = [];
  for (const raw of text.split("\n")) {
    const hit = /^\s*형\s*[:：]\s*(.+)$/.exec(raw);
    if (!hit) continue;
    const [who, ...rest] = hit[1].split("|").map((s) => s.trim());
    const ord = rest.join(" | ").trim();
    if (!who || !ord) continue;
    sentences.push({ who, order: ord });
  }

  let fault: Verdict["fault"] | null = null;
  const nums = faultLine.match(/\d+/g);
  if (nums && nums.length >= 2) {
    const a = clamp(Number(nums[0]));
    const b = clamp(Number(nums[1]));
    const sum = a + b;
    const m = sum === 0 ? 50 : Math.round((a / sum) * 100);
    fault = { m, w: 100 - m };
  }

  if (!order && !fault && !sentences.length) return null;
  return { order, fault: fault ?? { m: 50, w: 50 }, sentences, remark };
}

/* ── 데모 사건 ────────────────────────────────────────────── */

export interface DemoCase {
  id: string;
  tag: string;
  rating: Rating;
  man: Party;
  woman: Party;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: "katok",
    tag: "읽씹",
    rating: "normal",
    man: {
      name: "태현",
      claim:
        "회의 중이라 답장을 못 했다. 스토리는 회의 끝나고 화장실에서 3초 만에 올린 거다. 성의 있게 쓰려고 미룬 게 죄냐",
    },
    woman: {
      name: "지민",
      claim:
        "읽고 3시간을 씹었다. 그 사이에 인스타 스토리는 두 개나 올라왔다. 스토리 올릴 시간에 답장 한 줄이 안 되나",
    },
  },
  {
    id: "anniv",
    tag: "기념일",
    rating: "normal",
    man: {
      name: "준영",
      claim:
        "100일 200일 300일을 다 세는 건 무리다. 나는 1주년을 크게 하려고 돈을 모으고 있었다. 편의점 케이크는 자정에 문 연 데가 거기밖에 없어서다",
    },
    woman: {
      name: "수아",
      claim:
        "300일인데 아무 말이 없었다. 저녁 9시에 내가 물어보니까 그제서야 아 맞다고 했다. 선물은 다음 날 편의점 케이크였다",
    },
  },
  {
    id: "ex",
    tag: "전 애인",
    rating: "normal",
    man: {
      name: "도윤",
      claim:
        "알고리즘이 띄워줘서 누른 거고 바로 취소했다. 취소한 게 증거다. 그리고 그 사진 단체사진이라 내 친구도 있었다",
    },
    woman: {
      name: "하늘",
      claim: "전 여친 게시물에 좋아요를 눌렀다. 그것도 3년 전 사진에. 계정을 뒤졌다는 뜻이다",
    },
  },
  {
    id: "night",
    tag: "19금 · 술",
    rating: "adult",
    man: {
      name: "성민",
      claim:
        "회사 사람들이랑 마신 거고 폰은 진짜 꺼졌다. 좋아요는 주머니에서 눌린 거다. 나 혼자 빠지면 다음 날 회사에서 어떻게 되는지 알기나 하냐",
    },
    woman: {
      name: "예린",
      claim:
        "새벽 3시까지 연락이 없었다. 전화 열두 번, 카톡 스무 개. 폰이 꺼졌다더니 그 시간에 걔 계정으로 릴스 좋아요가 찍혀 있었다",
    },
  },
  {
    id: "money",
    tag: "19금 · 돈",
    rating: "adult",
    man: {
      name: "우진",
      claim:
        "그 게임 계정 팔면 60만 원이라 오히려 투자다. 저번에 걔가 그 통장으로 친구 생일선물 산 건 왜 아무도 얘기 안 하냐",
    },
    woman: {
      name: "민서",
      claim:
        "반씩 넣기로 한 데이트 통장에서 40만 원이 빠졌다. 내역에 게임 결제가 세 번. 물어보니까 나중에 채워 넣으려 했단다",
    },
  },
];
