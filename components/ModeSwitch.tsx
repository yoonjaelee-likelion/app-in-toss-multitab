"use client";

export type Mode = "inbiz" | "judge" | "redteam";

export const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "inbiz", label: "인비즈", hint: "부서를 꾸려 사업을 진단합니다" },
  { key: "judge", label: "판정", hint: "여러 AI가 토론하고 정리합니다" },
  { key: "redteam", label: "레드팀", hint: "약점만 찾아 공격합니다" },
];

/** 모드 전환 — 밑에 깔린 알약이 미끄러져 따라온다 */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const i = MODES.findIndex((m) => m.key === mode);

  return (
    <div
      className="relative glass-2 rounded-[11px] p-[3px] flex items-center shrink-0"
      role="tablist"
      aria-label="모드"
    >
      <span
        className="absolute top-[3px] bottom-[3px] rounded-[9px] grad-bg transition-transform duration-[420ms]"
        style={{
          width: `calc((100% - 6px) / ${MODES.length})`,
          transform: `translateX(${i * 100}%)`,
          transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
        }}
        aria-hidden
      />
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="tab"
          aria-selected={mode === m.key}
          title={m.hint}
          onClick={() => onChange(m.key)}
          className={`relative z-10 h-[28px] px-2.5 sm:px-3 rounded-[9px] text-[12.5px] font-semibold transition-colors ${
            mode === m.key ? "text-white" : "text-t3 hover:text-t1"
          }`}
          style={{ width: `${100 / MODES.length}%`, minWidth: 62 }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
