import type { AskRequest, GroupTurn } from "./chat";
import { MODEL_BY_ID } from "./models";

/**
 * 모의 응답 — API 키 없이 앱 전체를 돌려보기 위한 것.
 * 모델마다 길이와 각도를 다르게 잡아서, 답이 나란히 놓였을 때 비교가 되도록 했다.
 */

const clip = (q: string, n = 26) => (q.length > n ? q.slice(0, n) + "…" : q);

const ASK: Record<string, (q: string) => string> = {
  opus: (q) =>
    `「${clip(q)}」는 사실 두 개의 질문이 붙어 있는 형태다. 하나는 지금 무엇이 맞느냐이고, 다른 하나는 틀렸을 때 얼마나 되돌릴 수 있느냐다.

- 첫 번째만 보면 답이 갈린다. 정보가 부족한 구간에서는 누구 말이든 그럴듯하게 들린다.
- 두 번째를 기준에 넣으면 선택지가 확 줄어든다. 되돌릴 수 있는 쪽을 먼저 하는 게 거의 항상 낫다.

그래서 내 답은, 되돌릴 수 있는 부분은 지금 하고 되돌릴 수 없는 부분만 미루라는 것이다. 판단을 미루는 것 자체에도 비용이 붙는다는 걸 잊기 쉽다.`,
  sonnet: (q) =>
    `정리하면 이렇다.

- 지금 판단하기에 충분한 정보가 있는지부터 확인하는 게 순서다. 「${clip(q, 20)}」 같은 질문은 대체로 정보보다 기준이 없어서 막힌다.
- 기준을 하나만 고른다면 "6개월 뒤에도 같은 선택을 할 것 같은가"가 실용적이다.
- 남들이 어떻게 했는지는 참고만 하는 게 좋다. 조건이 다르면 결과도 다르다.

결론적으로는 진행하는 쪽에 무게를 둔다. 다만 되돌릴 방법을 먼저 확보하고 시작하는 걸 추천한다.`,
  haiku: () =>
    `짧게 답하면 진행하는 쪽이다. 다만 조건이 하나 붙는다. 중간에 멈출 수 있는 구조를 먼저 만들어 두는 것. 그게 없으면 답은 반대로 바뀐다.`,
  gpt4o: (q) =>
    `질문을 살짝 바꿔서 보는 게 도움이 될 것 같다. 「${clip(q, 20)}」가 아니라 "이걸 안 하면 6개월 뒤에 뭐가 달라져 있나"로 물으면 답이 훨씬 빨리 나온다.

내 생각엔 대부분의 경우 안 해도 크게 달라지지 않는다. 그런데 이 질문을 던지는 시점은 보통 이미 마음이 기울어 있을 때다. 그렇다면 진짜 묻고 있는 건 "해도 되나"에 가깝다.

그런 상황이라면 답은 해도 된다는 쪽이다. 대신 규모를 절반으로 줄여서 시작하는 걸 권한다.`,
  gpt4omini: () =>
    `빠르게 한 표. 하는 쪽에 걸겠다.

이유는 하나다. 안 해서 생기는 후회가 해서 생기는 후회보다 오래간다. 다만 최소 규모로 시작할 것.`,
  "gemini-flash": (q) =>
    `핵심만 짚는다.

- 판단 기준: 비용보다 회복 가능성
- 위험 구간: 한 번에 전부 결정하는 경우
- 추천: 절반만 실행하고 나머지는 보류

「${clip(q, 18)}」에 대한 답으로는, 나눠서 시작하는 것이 가장 손실이 적다.`,
  "gemini-pro": (q) =>
    `앞선 맥락까지 같이 보면 이 질문은 단독으로 놓였을 때와 다르게 읽힌다.

「${clip(q, 22)}」에서 중요한 건 선택지 자체가 아니라 그 선택을 유지할 수 있는 기간이다. 6개월을 못 버티는 최선보다 2년을 버티는 차선이 결과적으로 낫다.

그래서 나는 "무엇을 고르느냐"보다 "얼마나 오래 유지할 수 있느냐"를 먼저 계산하라고 말하고 싶다. 그 계산을 해보면 선택지는 대개 하나로 좁혀진다.`,
};

/** 반박은 상대 이름만 부르고, 있지도 않은 문장을 인용하지 않는다 */
const DEBATE: Record<string, (o: string) => string> = {
  opus: (o) =>
    `동의: 최소 규모로 시작하자는 방향에는 이견이 없다.
반박: ${o}은 실행 여부만 놓고 저울질하는데, 실제 변수는 되돌릴 수 있느냐다. 되돌릴 수 없는 구간에서는 같은 논리가 정반대 결론을 낸다.
그래서: 내 답은 그대로다. 다만 최소 규모의 기준을 숫자로 못 박아야 한다는 조건을 붙인다.`,
  sonnet: (o) =>
    `동의: 나눠서 시작하자는 데는 동의한다.
반박: ${o}은 되돌릴 수 있는지를 기준으로 삼는데, 그건 사후에만 확인된다. 사전 기준으로 쓰면 아무것도 걸러내지 못한다.
그래서: 기준을 되돌릴 수 있는가에서 멈출 지점이 정해져 있는가로 바꾸는 게 낫다.`,
  haiku: (o) =>
    `동의: 절반만 시작하자는 데 찬성.
반박: ${o}은 조건을 계속 덧붙인다. 조건이 많은 조언은 실행되지 않는다.
그래서: 나는 여전히 짧게 간다. 멈출 지점 하나만 정하고 시작.`,
  gpt4o: (o) =>
    `동의: 멈출 지점을 먼저 정하자는 건 실용적이다.
반박: ${o}은 질문을 그대로 받아서 답했다. 이 질문은 그대로 받으면 안 되는 종류다. 묻는 쪽은 대개 이미 기울어 있다.
그래서: 판단이 아니라 규모 제한이 붙은 허가 쪽으로 답의 형태를 바꾼다.`,
  gpt4omini: (o) =>
    `동의: 규모를 줄이자는 건 맞다.
반박: ${o}은 조건을 너무 많이 달았다. 그러면 사실상 하지 말라는 말이 된다.
그래서: 조건은 하나만. 그 이상은 실행률을 떨어뜨린다.`,
  "gemini-flash": (o) =>
    `동의: 최소 규모 시작.
반박: ${o}은 손실이 회복 가능한 경우만 상정한다. 회복 불가능한 영역에서는 결론이 뒤집힌다.
그래서: 영역을 나눠서 따로 판단해야 한다는 걸 덧붙인다.`,
  "gemini-pro": (o) =>
    `동의: 멈출 지점을 정하고 시작하자는 데 동의한다.
반박: ${o}은 시작 시점만 보고 유지 기간을 안 본다. 결과를 더 많이 설명하는 건 후자다.
그래서: 기준을 유지 가능 기간으로 두는 쪽을 계속 밀겠다.`,
};

function synthesisText(names: string[]): string {
  const [a, b, c] = names;
  const split =
    names.length >= 2
      ? `판단 기준에서 갈렸다. ${a}는 되돌릴 수 있는지를, ${b}는 멈출 지점이 정해져 있는지를 기준으로 든다.${
          c ? ` ${c}는 질문 자체를 다시 쓰자고 해서 혼자 결이 다르다.` : ""
        }`
      : `${a ?? "답변한 AI"} 하나뿐이라 갈린 지점은 없다.`;
  return [
    '합의: 전부 "한 번에 전부 결정하지 말고 최소 규모로 시작하라"는 데는 같은 말을 하고 있다. 표현만 다르다.',
    `갈림: ${split}`,
    "결론: 지금 시작하되 규모를 절반 이하로 줄이고, 멈출 조건을 시작 전에 한 문장으로 적어 둔다. 그 조건을 못 적겠으면 아직 시작할 준비가 안 된 것이다.",
  ].join("\n");
}

/** 실제로 답을 낸 모델만 종합에 등장시킨다 */
function participants(req: AskRequest): string[] {
  const seen = new Set<string>();
  for (const t of req.turns) {
    if (t.kind !== "group") continue;
    for (const slot of (t as GroupTurn).order) {
      if ((t as GroupTurn).replies[slot]?.text.trim()) seen.add(slot);
    }
  }
  return [...seen].map((s) => MODEL_BY_ID[s]?.name ?? s);
}

export function mockText(req: AskRequest, slot: string): string {
  if (req.mode === "synthesis") return synthesisText(participants(req));
  if (req.mode === "debate") {
    const other = req.targets.find((s) => s !== slot);
    const name = other ? (MODEL_BY_ID[other]?.name ?? other) : "다른 AI";
    return (DEBATE[slot] ?? DEBATE.sonnet)(name);
  }
  return (ASK[slot] ?? ASK.sonnet)(req.question);
}

/** 모델마다 다른 속도로 끝나야 한 화면에 같이 놓였을 때 살아 있는 느낌이 난다 */
export const MOCK_PACE: Record<string, { chunk: number; delay: number; start: number }> = {
  opus: { chunk: 4, delay: 22, start: 320 },
  sonnet: { chunk: 5, delay: 18, start: 200 },
  haiku: { chunk: 7, delay: 12, start: 90 },
  gpt4o: { chunk: 4, delay: 20, start: 420 },
  gpt4omini: { chunk: 6, delay: 14, start: 150 },
  "gemini-flash": { chunk: 8, delay: 11, start: 70 },
  "gemini-pro": { chunk: 4, delay: 24, start: 500 },
};
