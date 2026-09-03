"use client";

import { useCopy } from "@/lib/i18n";
import { useModes, type Mode } from "./modes";

/** 입력창 아래에서 태도를 고르는 세 개. 사이드바를 거치지 않고 여기서 바꾼다 */
export type Stance = "judge" | "redteam" | "inbiz";

export const STANCES: Stance[] = ["judge", "redteam", "inbiz"];

/**
 * 태도 고르개.
 *
 * 판정·레드팀·인비즈는 결국 같은 동작이다 — 한 줄 적고 AI들한테 던진다.
 * 다른 건 태도뿐이라서 사이드바에서 방을 옮길 일이 아니라 입력창 아래에서
 * 고를 일이다. 고르면 입력창 자체가 그 색과 모양으로 바뀐다.
 */
export function StanceBar({
  stance,
  onStance,
  disabled,
}: {
  stance: Stance;
  onStance: (s: Stance) => void;
  disabled?: boolean;
}) {
  const t = useCopy();
  const modes = useModes();

  return (
    <div
      className="flex items-center gap-1 min-w-0 overflow-x-auto no-bar"
      role="radiogroup"
      aria-label={t.ask.stance}
    >
      {STANCES.map((key) => {
        const m = modes.find((x) => x.key === (key as Mode));
        if (!m) return null;
        const on = key === stance;
        const Icon = m.icon;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onStance(key)}
            title={m.hint}
            className={`shrink-0 h-[30px] pl-2 pr-2.5 rounded-full flex items-center gap-1.5 text-[12px] font-medium transition-all duration-300 disabled:opacity-40 ${
              on ? "text-t1" : "text-t3 hover:text-t1 press"
            }`}
            style={
              on
                ? {
                    /* 고른 것만 자기 색을 옅게 머금는다 — 알약이 아니라 잉크로 표시한다 */
                    background: `color-mix(in srgb, ${m.accent} 14%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${m.accent} 34%, transparent)`,
                  }
                : undefined
            }
          >
            <span className="shrink-0 grid place-items-center" style={on ? { color: m.accent } : undefined}>
              <Icon size={13} />
            </span>
            <span className="truncate">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
