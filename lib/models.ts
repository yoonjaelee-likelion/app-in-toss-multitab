export type Provider = "anthropic" | "openai" | "google";

export interface ModelDef {
  id: string;
  /** 전체 이름 */
  name: string;
  /** 탭에 들어가는 짧은 이름 */
  short: string;
  maker: string;
  provider: Provider;
  /** 실제 호출용 모델 id — 여기만 고치면 된다 */
  modelId: string;
  /** 탭 식별색. 채도를 낮춰 본문을 방해하지 않는 선에서 구분만 한다 */
  color: string;
  note: string;
}

export const MODELS: ModelDef[] = [
  {
    id: "opus",
    name: "Claude Opus 5",
    short: "Opus 5",
    maker: "Anthropic",
    provider: "anthropic",
    modelId: "claude-opus-5",
    color: "#2F5FBE",
    note: "가장 깊게 파고듭니다",
  },
  {
    id: "sonnet",
    name: "Claude Sonnet 5",
    short: "Sonnet 5",
    maker: "Anthropic",
    provider: "anthropic",
    modelId: "claude-sonnet-5",
    color: "#6A48C4",
    note: "빠르고 균형 잡힌 답",
  },
  {
    id: "haiku",
    name: "Claude Haiku 4.5",
    short: "Haiku 4.5",
    maker: "Anthropic",
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
    color: "#1B7A54",
    note: "짧고 즉각적",
  },
  {
    id: "gpt4o",
    name: "GPT-4o",
    short: "GPT-4o",
    maker: "OpenAI",
    provider: "openai",
    modelId: "gpt-4o",
    color: "#AF3560",
    note: "다른 각도를 잘 냅니다",
  },
  {
    id: "gpt4omini",
    name: "GPT-4o mini",
    short: "4o mini",
    maker: "OpenAI",
    provider: "openai",
    modelId: "gpt-4o-mini",
    color: "#8F5C0C",
    note: "가볍게 한 표 더",
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    short: "Gemini Flash",
    maker: "Google",
    provider: "google",
    modelId: "gemini-2.0-flash",
    color: "#0E6B77",
    note: "속도가 무기",
  },
  {
    id: "gemini-pro",
    name: "Gemini 1.5 Pro",
    short: "Gemini Pro",
    maker: "Google",
    provider: "google",
    modelId: "gemini-1.5-pro",
    color: "#A93E2C",
    note: "긴 맥락에 강합니다",
  },
];

/** 한 창에 열 수 있는 탭 수 */
export const MAX_TABS = 7;

export const MODEL_BY_ID: Record<string, ModelDef> = Object.fromEntries(
  MODELS.map((m) => [m.id, m]),
);

export const DEFAULT_TABS = ["opus", "gpt4o", "gemini-flash"];

export const ENV_KEY: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
};
