import type { ComponentType } from "react";
import { IconChat, IconGavel, IconPulse, IconScales, IconTarget } from "./icons";
import type { SessionMode } from "@/lib/sessions";

export type Mode = SessionMode;

export interface ModeDef {
  key: Mode;
  label: string;
  /** 이 모드가 무엇을 하는지 한 줄 */
  hint: string;
  /** 새로 시작 버튼에 들어갈 말 — 모드마다 시작하는 것이 다르다 */
  newLabel: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

export const MODES: ModeDef[] = [
  {
    key: "inbiz",
    label: "인비즈",
    hint: "AI 법인이 사업을 진단합니다",
    newLabel: "새 진단",
    icon: IconPulse,
    accent: "#6FD8A8",
  },
  {
    key: "judge",
    label: "판정",
    hint: "여러 AI가 답하고 서로 반박합니다",
    newLabel: "새 대화",
    icon: IconScales,
    accent: "#9FC0FF",
  },
  {
    key: "redteam",
    label: "레드팀",
    hint: "심사역 AI가 약점만 찾습니다",
    newLabel: "새 공격",
    icon: IconTarget,
    accent: "#F08A8A",
  },
  {
    key: "court",
    label: "법원",
    hint: "싸움을 재판에 부칩니다",
    newLabel: "새 재판",
    icon: IconGavel,
    accent: "#E0BD7D",
  },
  {
    key: "comfort",
    label: "위로",
    hint: "친구 다섯이 다르게 반응합니다",
    newLabel: "새 방",
    icon: IconChat,
    accent: "#FF9FC2",
  },
];

export const MODE_BY_KEY: Record<Mode, ModeDef> = Object.fromEntries(
  MODES.map((m) => [m.key, m]),
) as Record<Mode, ModeDef>;
