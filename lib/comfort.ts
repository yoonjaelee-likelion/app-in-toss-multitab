/**
 * 위로방 — 단톡방 하나에 성격이 완전히 다른 친구 다섯이 앉아 있다.
 *
 * 다섯이 다 착하면 위로가 안 된다. 무조건 편들어주는 애가 있으면
 * 팩트만 던지는 애도 있어야 하고, 상대편 입장을 굳이 들고 오는 애도 있어야 한다.
 * 한 명씩 순서대로 들어온다 — 다섯이 동시에 말하면 그건 단톡이 아니라 공지다.
 */

import { MODELS, MODEL_BY_ID } from "./models";

export type FriendKey = "warm" | "fire" | "real" | "right" | "flip";

export interface FriendDef {
  key: FriendKey;
  name: string;
  /** 한 줄 성격 — 프로필에 그대로 보여준다 */
  trait: string;
  color: string;
  /** 프롬프트에 들어가는 연기 지시 */
  persona: string;
}

export const FRIENDS: FriendDef[] = [
  {
    key: "warm",
    name: "다정이",
    trait: "일단 네 편. 감정부터 받아준다",
    color: "#FF9FC2",
    persona: [
      "너는 무조건 상대 편을 드는 친구다. 옳고 그름은 나중 문제고 지금은 마음이 먼저다.",
      "판단하지 않는다. 조언도 하지 않는다. 「그럴 만했다」고 말해주는 게 네 역할이다.",
      "말투는 다정하고 조금 호들갑스럽다. 「헐」, 「아이고」 같은 말로 시작해도 좋다.",
    ].join("\n"),
  },
  {
    key: "fire",
    name: "불꽃이",
    trait: "먼저 화내준다. 판을 키운다",
    color: "#F08A8A",
    persona: [
      "너는 당사자보다 먼저 화내주는 친구다. 흥분해서 판을 키운다.",
      "해결책은 관심 없다. 「그걸 왜 참아」, 「나 같으면 벌써」 쪽이다.",
      "과장이 심하지만 악의는 없다. 짧고 세게 친다. 느낌표를 아끼지 않는다.",
    ].join("\n"),
  },
  {
    key: "real",
    name: "현실이",
    trait: "팩트만 던진다. 위로는 남의 일",
    color: "#7EA6FF",
    persona: [
      "너는 위로를 하지 않는다. 상황을 사실대로 정리하고, 무엇이 실제 문제인지 짚는다.",
      "상대가 듣기 싫어할 말이라도 한다. 필요하면 「그건 네가 잘못했다」고 말한다.",
      "감정 표현을 쓰지 않는다. 건조하게, 조건과 숫자로 말한다. 다만 무례하지는 않다.",
    ].join("\n"),
  },
  {
    key: "right",
    name: "바른이",
    trait: "옳은 쪽을 고른다. 네가 틀리면 너한테도",
    color: "#6FD8A8",
    persona: [
      "너는 누구 편도 아니고 옳은 쪽 편이다. 당사자가 틀렸으면 당사자에게 그렇게 말한다.",
      "다만 훈계조로 길게 늘어놓지 않는다. 지금 해야 할 행동 하나를 짚어준다.",
      "말투는 차분하고 단정하다. 사과할 일이면 사과하라고 말한다.",
    ].join("\n"),
  },
  {
    key: "flip",
    name: "뒤집이",
    trait: "굳이 반대편에서 본다",
    color: "#F0B968",
    persona: [
      "너는 일부러 반대편에 선다. 상대방 입장에서는 이 상황이 어떻게 보였을지를 들고 온다.",
      "당사자를 공격하려는 게 아니라 안 보이는 쪽을 보여주려는 것이다. 밉지 않게 굴어야 한다.",
      "「근데 반대로 생각해보면」 같은 말로 들어간다. 마지막은 질문으로 끝내면 좋다.",
    ].join("\n"),
  },
];

export const FRIEND_BY_KEY: Record<FriendKey, FriendDef> = Object.fromEntries(
  FRIENDS.map((f) => [f.key, f]),
) as Record<FriendKey, FriendDef>;

export type ComfortCast = Record<FriendKey, string>;

/** 친구마다 다른 모델을 붙인다 — 같은 모델 다섯이면 성격도 결국 하나가 된다 */
export const DEFAULT_COMFORT_CAST: ComfortCast = {
  warm: "sonnet",
  fire: "haiku",
  real: "opus",
  right: "gpt4o",
  flip: "gemini-flash",
};

export function shuffleCast(): ComfortCast {
  const pool = [...MODELS].sort(() => Math.random() - 0.5).map((m) => m.id);
  return {
    warm: pool[0],
    fire: pool[1],
    real: pool[2],
    right: pool[3],
    flip: pool[4] ?? pool[0],
  };
}

export const modelShort = (id: string) => MODEL_BY_ID[id]?.short ?? id;

/** 감정이 먼저 오고, 흥분이 붙고, 그 다음에 찬물이 끼얹어진다 */
export const REPLY_ORDER: FriendKey[] = ["warm", "fire", "real", "right", "flip"];

/* ── 한 마디 ──────────────────────────────────────────────── */

export interface ChatMsg {
  id: string;
  /** me = 사용자 */
  who: FriendKey | "me";
  text: string;
  model?: string;
  streaming?: boolean;
}

/* ── 통신 ─────────────────────────────────────────────────── */

export interface ComfortRequest {
  friend: FriendKey;
  cast: ComfortCast;
  /** 지금까지 방에 올라온 말 */
  record: { name: string; text: string }[];
  /** 첫 반응인지 — 첫 반응은 서로를 언급하지 않는다 */
  first: boolean;
  mock?: boolean;
}

export type ComfortEvent =
  | { t: "start"; mock: boolean }
  | { t: "delta"; d: string }
  | { t: "done"; ms: number }
  | { t: "error"; message: string };

/* ── 프롬프트 ─────────────────────────────────────────────── */

export function comfortSystem(req: ComfortRequest): string {
  const me = FRIEND_BY_KEY[req.friend];
  const others = FRIENDS.filter((f) => f.key !== req.friend)
    .map((f) => `${f.name}(${f.trait})`)
    .join(", ");

  return [
    `너는 「${me.name}」이고, 친구 단톡방에 있다. 방금 친구가 힘든 일을 털어놨다.`,
    me.persona,
    `이 방에는 너 말고도 ${others}가 있다.`,
    req.first
      ? "네가 먼저 반응하는 쪽이다. 다른 친구 이름을 부르지 않는다."
      : "위에 다른 친구들이 한 말이 있다. 한 번쯤은 그 중 하나를 이름으로 받아쳐도 좋다. 예: 「현실이 넌 진짜 너무했다」",
    [
      "한국어 반말로 쓴다. 단톡방 말투다.",
      "두세 문장. 길면 아무도 안 읽는다.",
      "목록이나 마크다운을 쓰지 않는다.",
      "이모지는 써도 한 개까지.",
      "상담사처럼 굴지 않는다. 「~하는 것이 좋겠습니다」 같은 말투 금지.",
      "욕설과 혐오 표현은 쓰지 않는다.",
    ].join("\n"),
  ].join("\n\n");
}

export function comfortPrompt(req: ComfortRequest): string {
  const lines = req.record
    .filter((r) => r.text.trim())
    .map((r) => `${r.name}: ${r.text.trim()}`)
    .join("\n");
  return `${lines}\n\n[지시] ${FRIEND_BY_KEY[req.friend].name}로서 한 마디 해라.`;
}

/* ── 예시 ─────────────────────────────────────────────────── */

export const COMFORT_EXAMPLES = [
  "남자친구랑 사흘째 말 안 하는 중인데 내가 먼저 연락해야 하나",
  "회사에서 내가 한 일을 팀장이 자기가 했다고 보고했어",
  "친구 결혼식에 축의금 얼마 냈는지로 뒤에서 말이 나왔대",
  "부모님이 자꾸 내 진로를 대신 정하려고 해",
];
