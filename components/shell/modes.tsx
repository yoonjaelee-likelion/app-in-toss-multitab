"use client";

import { useMemo, type ComponentType } from "react";
import { IconChat, IconChatMulti, IconGavel, IconPulse, IconTarget } from "./icons";
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
  { key: "judge", icon: IconChatMulti, accent: "#2F5FBE" },
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

/* ── 사이드바 ─────────────────────────────────────────────────
   판정·레드팀·인비즈는 결국 같은 동작이다 — 한 줄 적고 AI들한테 던진다.
   셋을 각각 방으로 두면 방이 다섯이 되고, 그러면 뭐가 다른지 아무도 모른다.
   셋은 「질문」 한 방으로 묶고, 태도는 입력창 아래에서 고른다.
   ──────────────────────────────────────────────────────────── */

export type Family = "ask" | "court" | "comfort";

export interface NavDef {
  key: Family;
  label: string;
  hint: string;
  icon: ModeDef["icon"];
  accent: string;
}

/** 지금 켜져 있는 태도가 「질문」 방의 얼굴이 된다 */
export function useNav(stance: Mode): NavDef[] {
  const t = useCopy();
  const modes = useModes();
  return useMemo(() => {
    const cur = modes.find((m) => m.key === stance) ?? modes[1];
    return [
      { key: "ask", label: t.ask.nav, hint: t.ask.navHint, icon: cur.icon, accent: cur.accent },
      { key: "court", label: t.modes.court.label, hint: t.modes.court.hint, icon: IconGavel, accent: ACCENT_BY_MODE.court },
      { key: "comfort", label: t.modes.comfort.label, hint: t.modes.comfort.hint, icon: IconChat, accent: ACCENT_BY_MODE.comfort },
    ];
  }, [modes, stance, t]);
}

/** 어느 방에 속하는 모드인지 */
export const familyOf = (m: Mode): Family =>
  m === "court" ? "court" : m === "comfort" ? "comfort" : "ask";

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
