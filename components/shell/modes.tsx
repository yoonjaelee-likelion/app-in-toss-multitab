"use client";

import { useMemo, type ComponentType } from "react";
import { IconChat, IconGavel, IconPulse, IconScales, IconTarget } from "./icons";
import { useCopy } from "@/lib/i18n";
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

/** 말은 사전에서, 아이콘과 색은 여기서. 순서도 여기가 정한다 */
const SHAPE: { key: Mode; icon: ModeDef["icon"]; accent: string }[] = [
  { key: "inbiz", icon: IconPulse, accent: "#16805C" },
  { key: "judge", icon: IconScales, accent: "#2F5FBE" },
  { key: "redteam", icon: IconTarget, accent: "#B5352D" },
  { key: "court", icon: IconGavel, accent: "#8E5F18" },
  { key: "comfort", icon: IconChat, accent: "#B03A63" },
];

export function useModes(): ModeDef[] {
  const t = useCopy();
  return useMemo(
    () => SHAPE.map((s) => ({ ...s, ...t.modes[s.key] })),
    [t],
  );
}

export function useModeMap(): Record<Mode, ModeDef> {
  const modes = useModes();
  return useMemo(
    () => Object.fromEntries(modes.map((m) => [m.key, m])) as Record<Mode, ModeDef>,
    [modes],
  );
}

/** 색만 필요한 곳 — 사전을 거치지 않는다 */
export const ACCENT_BY_MODE: Record<Mode, string> = Object.fromEntries(
  SHAPE.map((s) => [s.key, s.accent]),
) as Record<Mode, string>;
