/**
 * 인비즈 — 사업 아이디어 하나를 받아서 가상 법인을 세운다.
 *
 * 대표 AI가 사업을 읽고 필요한 부서를 그 자리에서 편성하고,
 * 부서들이 각자 분석한 뒤 필요한 곳끼리 회의를 붙이고,
 * 마지막에 대표가 인바디처럼 생긴 진단표 한 장으로 돌려준다.
 *
 * 스트리밍 도중에 화면이 살아 있어야 해서, 모든 단계의 출력은
 * 「라벨: 값 | 값」 형태의 한 줄짜리 레코드로 뽑게 하고 줄 단위로 파싱한다.
 */

/* ── 부서 카탈로그 ────────────────────────────────────────── */

export interface DeptDef {
  key: string;
  name: string;
  /** 칩에 들어가는 두 글자 */
  abbr: string;
  color: string;
  /** 대표 AI에게 보여줄 설명 — 이 부서가 무엇을 보는지 */
  scope: string;
}

export const DEPTS: DeptDef[] = [
  {
    key: "market",
    name: "상권분석팀",
    abbr: "상권",
    color: "#5B8CFF",
    scope: "입지, 유동인구, 배후수요, 학군·역세권, 경쟁 밀도, 임대 시세",
  },
  {
    key: "customer",
    name: "고객조사팀",
    abbr: "고객",
    color: "#4DA3FF",
    scope: "타겟 정의, 지불 의사, 구매 빈도, 대체재, 실제 수요 검증 방법",
  },
  {
    key: "product",
    name: "제품개발팀",
    abbr: "제품",
    color: "#A56BFF",
    scope: "제품·서비스 구성, 핵심 기능, 최소 실행 범위, 품질 기준",
  },
  {
    key: "food",
    name: "식품개발팀",
    abbr: "식품",
    color: "#FF8A5B",
    scope: "메뉴 구성, 레시피 현지화, 원가율, 조리 동선, 위생·보관",
  },
  {
    key: "finance",
    name: "재무팀",
    abbr: "재무",
    color: "#3DDC97",
    scope: "초기 자본, 고정비·변동비, 손익분기, 현금흐름, 회수 기간",
  },
  {
    key: "marketing",
    name: "마케팅팀",
    abbr: "마케",
    color: "#FF6FA5",
    scope: "포지셔닝, 채널 전략, 획득 단가, 오픈 전략, 재방문 설계",
  },
  {
    key: "brand",
    name: "브랜드팀",
    abbr: "브랜",
    color: "#D46BFF",
    scope: "네이밍, 컨셉 일관성, 시각 언어, 기억되는 한 가지",
  },
  {
    key: "ops",
    name: "운영팀",
    abbr: "운영",
    color: "#FFB454",
    scope: "인력 배치, 회전율, 피크 대응, 재고, 표준화 가능성",
  },
  {
    key: "supply",
    name: "공급망팀",
    abbr: "공급",
    color: "#C4A24A",
    scope: "원재료 조달, 단가 변동, 대체 공급처, 리드타임, 물류",
  },
  {
    key: "legal",
    name: "법무·인허가팀",
    abbr: "법무",
    color: "#8E96A8",
    scope: "인허가 절차, 업종 규제, 계약 리스크, 프랜차이즈 등록 요건",
  },
  {
    key: "hr",
    name: "인사·조직팀",
    abbr: "인사",
    color: "#5BC8D6",
    scope: "필요 인력, 채용 난이도, 인건비, 교육, 이탈률",
  },
  {
    key: "tech",
    name: "기술팀",
    abbr: "기술",
    color: "#6E8BFF",
    scope: "필요 기술 스택, 개발 기간, 외주 여부, 유지보수 부담",
  },
  {
    key: "data",
    name: "데이터분석팀",
    abbr: "데이터",
    color: "#4ED6B8",
    scope: "시장 규모 추정, 단위 경제성 계산, 가정 검증, 민감도 분석",
  },
  {
    key: "growth",
    name: "성장·확장팀",
    abbr: "성장",
    color: "#FF7A7A",
    scope: "확장 조건, 2호점 시점, 체인화 구조, 복제 가능성",
  },
  {
    key: "risk",
    name: "리스크팀",
    abbr: "리스",
    color: "#FF6B6B",
    scope: "실패 시나리오, 최악의 경우 손실, 철수 조건, 회복 가능성",
  },
];

export const DEPT_BY_KEY: Record<string, DeptDef> = Object.fromEntries(
  DEPTS.map((d) => [d.key, d]),
);

export const MAX_DEPTS = 8;

/* ── 상태 타입 ────────────────────────────────────────────── */

export type Phase =
  | "idle"
  | "staffing"
  | "analyzing"
  | "meeting"
  | "diagnosing"
  | "done";

export type WorkStatus = "waiting" | "working" | "done" | "error";

export interface Dept {
  key: string;
  name: string;
  abbr: string;
  color: string;
  /** 대표가 이 부서를 왜 만들었는지 */
  why: string;
  status: WorkStatus;
  report: string;
  error?: string;
  ms?: number;
}

export interface Meeting {
  id: string;
  a: string;
  b: string;
  /** 무엇 때문에 붙었는지 */
  issue: string;
  /** 무엇으로 정리됐는지 */
  resolved: string;
}

export interface Metric {
  key: string;
  label: string;
  score: number;
  note: string;
}

export interface Diagnosis {
  total: number;
  verdict: string;
  metrics: Metric[];
  figures: { label: string; value: string }[];
  weakest: string;
  actions: string[];
}

export interface InbizState {
  phase: Phase;
  idea: string;
  headline: string;
  depts: Dept[];
  meetings: Meeting[];
  diagnosis: Diagnosis | null;
  mock: boolean;
}

export type InbizOp = "staff" | "analyze" | "meet" | "diagnose";

export interface InbizRequest {
  op: InbizOp;
  idea: string;
  /** analyze 단계에서 어떤 부서를 돌릴지 */
  targets?: string[];
  depts?: { key: string; name: string; why: string }[];
  /** meet·diagnose 단계에 넘길 부서별 분석 결과 */
  reports?: { key: string; name: string; text: string }[];
  meetings?: Meeting[];
  mock?: boolean;
}

export type InbizEvent =
  | { t: "start"; slot: string; mock: boolean }
  | { t: "delta"; slot: string; d: string }
  | { t: "done"; slot: string; ms: number }
  | { t: "error"; slot: string; message: string };

/* ── 대표 AI 프롬프트 ─────────────────────────────────────── */

const HEAD_BASE = [
  "너는 사업 검토 법인의 대표다. 컨설턴트 특유의 미사여구를 쓰지 않는다.",
  "한국어로 답한다. 인사말, 자기소개, 사과를 하지 않는다.",
  "모르는 숫자는 지어내지 말고 추정임을 밝히되, 범위로라도 반드시 제시한다.",
  "지시한 출력 형식을 정확히 지킨다. 형식 밖의 문장은 한 줄도 쓰지 않는다.",
].join("\n");

export function staffSystem(): string {
  return `${HEAD_BASE}
지금은 부서를 편성하는 단계다. 사업의 성패를 실제로 가르는 축만 고른다.
관성으로 부서를 늘리지 않는다. 이 사업에서 안 봐도 되는 영역은 만들지 않는다.`;
}

export function staffPrompt(idea: string): string {
  const catalog = DEPTS.map((d) => `${d.key} · ${d.name} — ${d.scope}`).join("\n");
  return [
    `[사업 아이디어]\n${idea}`,
    `[고를 수 있는 부서]\n${catalog}`,
    [
      "[출력 형식]",
      "첫 줄에 사업을 한 문장으로 정의한다:",
      "정의: (업종·입지·컨셉이 드러나는 한 문장, 30자 내외)",
      "",
      `그다음 이 사업에 꼭 필요한 부서만 4~${MAX_DEPTS}개 고른다. 한 줄에 하나씩:`,
      "부서: (key) | (이 사업에서 이 부서가 풀어야 할 질문 한 줄, 25자 내외)",
      "",
      "key는 위 목록의 key를 그대로 쓴다. 목록에 없는 부서는 만들지 않는다.",
      "중요한 부서를 먼저 쓴다. 다른 문장은 쓰지 않는다.",
    ].join("\n"),
  ].join("\n\n");
}

export function analyzeSystem(dept: DeptDef, why: string): string {
  return [
    `너는 사업 검토 법인의 ${dept.name} 책임자다.`,
    `네가 보는 영역은 이것뿐이다: ${dept.scope}`,
    `대표가 너에게 맡긴 질문: ${why}`,
    "",
    "네 영역 밖의 이야기는 하지 않는다. 다른 부서가 할 말을 대신하지 않는다.",
    "일반론을 쓰지 않는다. 이 사업, 이 입지, 이 조건에서만 성립하는 이야기를 쓴다.",
    "숫자를 낸다. 정확하지 않아도 범위와 근거를 같이 쓴다. 근거 없는 단정은 쓰지 않는다.",
    "한국어. 인사말·자기소개 없이 바로 본론. 마크다운 제목(#)은 쓰지 않는다.",
  ].join("\n");
}

export function analyzePrompt(idea: string): string {
  return [
    `[사업 아이디어]\n${idea}`,
    [
      "[출력 형식]",
      "발견: 네 영역에서 가장 중요한 사실 한 줄",
      "",
      "그다음 - 로 시작하는 항목 3~4개. 각 항목은 한 줄이고, 가능하면 숫자를 포함한다.",
      "",
      "우려: 네 영역에서 이 사업이 깨질 수 있는 지점 한 줄",
      "",
      "전체 8줄 이내. 짧게.",
    ].join("\n"),
  ].join("\n");
}

export function meetSystem(): string {
  return `${HEAD_BASE}
지금은 부서 회의를 붙이는 단계다.
서로 숫자나 전제가 어긋나는 부서끼리만 붙인다. 사이좋게 끝나는 회의는 만들지 않는다.`;
}

export function meetPrompt(idea: string, reports: { name: string; text: string }[]): string {
  const body = reports.map((r) => `[${r.name}]\n${r.text.trim()}`).join("\n\n");
  return [
    `[사업 아이디어]\n${idea}`,
    `[부서별 분석]\n${body}`,
    [
      "[출력 형식]",
      "전제가 실제로 충돌하는 조합만 2~3개 고른다. 한 줄에 하나씩:",
      "회의: (부서명A) | (부서명B) | (무엇이 충돌하는지 한 줄) | (그래서 무엇으로 정리했는지 한 줄)",
      "",
      "부서명은 위 분석에 나온 이름을 그대로 쓴다.",
      "충돌이 없으면 억지로 만들지 말고 2개만 쓴다. 다른 문장은 쓰지 않는다.",
    ].join("\n"),
  ].join("\n\n");
}

export function diagnoseSystem(): string {
  return `${HEAD_BASE}
지금은 최종 진단서를 쓰는 단계다. 보고서가 아니라 검진 결과표를 만든다.
읽는 사람은 이 한 장만 보고 할지 말지를 정한다. 그러니 애매하게 쓰지 않는다.
점수는 후하게 주지 않는다. 대부분의 사업은 60점 근처이거나 그 아래다.`;
}

export const METRIC_KEYS: { key: string; label: string }[] = [
  { key: "fit", label: "시장 적합도" },
  { key: "profit", label: "수익 잠재력" },
  { key: "capital", label: "자본 효율" },
  { key: "exec", label: "실행 난이도" },
  { key: "edge", label: "차별화" },
  { key: "survive", label: "생존 확률" },
];

export function diagnosePrompt(
  idea: string,
  reports: { name: string; text: string }[],
  meetings: Meeting[],
): string {
  const body = reports.map((r) => `[${r.name}]\n${r.text.trim()}`).join("\n\n");
  const mtg = meetings.length
    ? meetings.map((m) => `${m.a} × ${m.b}: ${m.issue} → ${m.resolved}`).join("\n")
    : "(회의 없음)";
  return [
    `[사업 아이디어]\n${idea}`,
    `[부서별 분석]\n${body}`,
    `[부서 회의 결과]\n${mtg}`,
    [
      "[출력 형식 — 라벨을 그대로 쓴다. 한 줄에 하나]",
      "종합: (0~100 정수)",
      "판정: (즉시 실행 / 조건부 실행 / 재설계 필요 / 보류 권고 중 하나)",
      "지표: 시장 적합도 | (0~100) | (근거 한 줄, 20자 내외)",
      "지표: 수익 잠재력 | (0~100) | (근거 한 줄)",
      "지표: 자본 효율 | (0~100) | (근거 한 줄)",
      "지표: 실행 난이도 | (0~100, 높을수록 쉬움) | (근거 한 줄)",
      "지표: 차별화 | (0~100) | (근거 한 줄)",
      "지표: 생존 확률 | (0~100) | (근거 한 줄)",
      "수치: 필요 자본 | (범위, 예: 2.4억~3.1억)",
      "수치: 손익분기 | (예: 14~19개월)",
      "수치: 예상 월매출 | (예: 4,200만원)",
      "수치: 예상 월순익 | (예: 620만원 · 14.8%)",
      "수치: 투자 회수 | (예: 약 3.4년)",
      "약한고리: (이 사업이 깨진다면 여기서 깨진다, 한 줄. 어느 부서가 짚었는지 괄호로)",
      "처방: (지금 당장 할 일 한 줄)",
      "처방: (두 번째로 할 일 한 줄)",
      "처방: (세 번째로 할 일 한 줄)",
      "",
      "종합 점수는 지표들의 단순 평균이 아니라 가장 약한 축에 끌려가야 한다.",
      "다른 문장은 쓰지 않는다.",
    ].join("\n"),
  ].join("\n\n");
}

/* ── 파서 — 스트리밍 중에도 줄 단위로 읽는다 ─────────────── */

const pipe = (s: string) => s.split("|").map((x) => x.trim());

/** 편성 단계: 「정의:」 한 줄과 「부서:」 여러 줄 */
export function parseStaff(text: string): {
  headline: string;
  picks: { key: string; why: string }[];
} {
  let headline = "";
  const picks: { key: string; why: string }[] = [];
  const seen = new Set<string>();

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const def = /^정의\s*[:：]\s*(.+)$/.exec(line);
    if (def) {
      headline = def[1].trim();
      continue;
    }
    const m = /^부서\s*[:：]\s*(.+)$/.exec(line);
    if (!m) continue;
    const [rawKey, why = ""] = pipe(m[1]);
    const key = rawKey.replace(/[()]/g, "").trim();
    if (!DEPT_BY_KEY[key] || seen.has(key)) continue;
    seen.add(key);
    picks.push({ key, why });
    if (picks.length >= MAX_DEPTS) break;
  }
  return { headline, picks };
}

/** 회의 단계: 「회의: A | B | 쟁점 | 결론」 */
export function parseMeetings(text: string, names: string[]): Meeting[] {
  const out: Meeting[] = [];
  const match = (raw: string) => {
    const n = raw.trim();
    return names.find((x) => x === n) ?? names.find((x) => x.includes(n) || n.includes(x)) ?? n;
  };

  for (const raw of text.split("\n")) {
    const m = /^회의\s*[:：]\s*(.+)$/.exec(raw.trim());
    if (!m) continue;
    const [a, b, issue = "", resolved = ""] = pipe(m[1]);
    if (!a || !b) continue;
    out.push({
      id: `${out.length}-${a}-${b}`,
      a: match(a),
      b: match(b),
      issue,
      resolved,
    });
  }
  return out;
}

/** 진단 단계 — 스트리밍 중간에도 있는 만큼만 돌려준다 */
export function parseDiagnosis(text: string): Diagnosis | null {
  const metrics: Metric[] = [];
  const figures: { label: string; value: string }[] = [];
  const actions: string[] = [];
  let total = 0;
  let verdict = "";
  let weakest = "";

  const num = (s: string) => {
    const n = Number.parseInt(s.replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    let m = /^종합\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      total = num(m[1]);
      continue;
    }
    m = /^판정\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      verdict = m[1].trim();
      continue;
    }
    m = /^지표\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      const [label, score = "", note = ""] = pipe(m[1]);
      const def = METRIC_KEYS.find((k) => k.label === label || label.includes(k.label));
      if (label) {
        metrics.push({ key: def?.key ?? label, label: def?.label ?? label, score: num(score), note });
      }
      continue;
    }
    m = /^수치\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      const [label, value = ""] = pipe(m[1]);
      if (label) figures.push({ label, value });
      continue;
    }
    m = /^약한고리\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      weakest = m[1].trim();
      continue;
    }
    m = /^처방\s*[:：]\s*(.+)$/.exec(line);
    if (m) {
      actions.push(m[1].trim());
    }
  }

  if (!total && !metrics.length) return null;
  return { total, verdict, metrics, figures, weakest, actions };
}

/* ── 표시용 ──────────────────────────────────────────────── */

export const VERDICT_TONE: Record<string, { color: string; band: string }> = {
  "즉시 실행": { color: "#3DDC97", band: "표준 이상" },
  "조건부 실행": { color: "#7EA6FF", band: "표준" },
  "재설계 필요": { color: "#FFB454", band: "표준 이하" },
  "보류 권고": { color: "#FF6B6B", band: "위험" },
};

export function toneFor(verdict: string) {
  const hit = Object.keys(VERDICT_TONE).find((k) => verdict.includes(k));
  return VERDICT_TONE[hit ?? "조건부 실행"];
}

/** 인바디처럼 점수대를 말로 바꿔 준다 */
export function bandFor(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "표준 이상", color: "#3DDC97" };
  if (score >= 55) return { label: "표준", color: "#7EA6FF" };
  if (score >= 40) return { label: "표준 이하", color: "#FFB454" };
  return { label: "위험", color: "#FF6B6B" };
}

export const newId = () => Math.random().toString(36).slice(2, 10);
