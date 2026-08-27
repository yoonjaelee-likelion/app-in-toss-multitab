"use client";

import { useEffect, useRef, useState } from "react";
import { MODEL_BY_ID } from "@/lib/models";

export function Composer({
  tabs,
  busy,
  blind,
  onBlind,
  onSend,
  onStop,
  autoFocus,
}: {
  tabs: string[];
  busy: boolean;
  blind: boolean;
  onBlind: (v: boolean) => void;
  onSend: (text: string, targets: string[]) => void;
  onStop: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState("all");
  const [menu, setMenu] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const down = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [menu]);

  // 고른 탭이 닫혔으면 전체로 돌아간다 — 상태를 고치지 않고 렌더에서 정한다
  const pick = target !== "all" && tabs.includes(target) ? target : "all";
  const targets = pick === "all" ? tabs : [pick];
  const can = text.trim().length > 0 && targets.length > 0 && !busy;

  const send = () => {
    if (!can) return;
    onSend(text.trim(), targets);
    setText("");
    if (ta.current) ta.current.style.height = "auto";
  };

  const targetLabel =
    pick === "all"
      ? `열린 탭 ${tabs.length}개`
      : (MODEL_BY_ID[pick]?.short ?? "탭 하나");

  return (
    <div
      ref={wrap}
      className="relative glass glass-lit rounded-[15px] focus-within:border-white/20 transition-colors"
    >
      <textarea
        ref={ta}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${Math.min(200, el.scrollHeight)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        rows={1}
        placeholder={
          tabs.length === 0 ? "탭을 먼저 열어주세요" : "열린 탭 전부에게 한 번에 물어봅니다"
        }
        aria-label="질문 입력"
        className="w-full resize-none bg-transparent outline-none px-3.5 pt-3 pb-2 text-[15px] leading-[1.65] text-t1 placeholder:text-t4"
      />

      <div className="flex items-center gap-1.5 px-2.5 pb-2.5 pt-0.5">
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          aria-expanded={menu}
          className="h-[28px] pl-2 pr-1.5 rounded-[8px] flex items-center gap-1.5 text-[12.5px] font-medium text-t2 hover:text-t1 hover:bg-white/[.07] transition-colors"
        >
          {pick !== "all" && (
            <span
              className="w-[6px] h-[6px] rounded-full"
              style={{ background: MODEL_BY_ID[pick]?.color }}
            />
          )}
          {targetLabel}
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className="text-t3">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onBlind(!blind)}
          aria-pressed={blind}
          title="다른 탭의 답을 가린 채로 각자 답하게 합니다"
          className={`h-[28px] px-2.5 rounded-[8px] text-[12.5px] font-medium transition-colors ${
            blind ? "grad-bg text-white" : "text-t2 hover:text-t1 hover:bg-white/[.07]"
          }`}
        >
          독립 답변
        </button>

        <span className="flex-1" />

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="h-[31px] px-3 rounded-[9px] glass-2 text-[12.5px] font-medium text-t1 hover:bg-white/[.09] transition-colors"
          >
            중단
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!can}
            className="h-[31px] pl-3 pr-2.5 rounded-[9px] grad-bg text-white text-[12.5px] font-semibold flex items-center gap-1.5 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            보내기
            <span className="text-[10.5px] font-normal opacity-65">⏎</span>
          </button>
        )}
      </div>

      {menu && (
        <div className="absolute left-2 bottom-full mb-1.5 z-40 w-[236px] rise">
          <div className="glass glass-lit rounded-[14px] p-1.5">
            <button
              type="button"
              onClick={() => {
                setTarget("all");
                setMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-[9px] text-[13px] font-medium text-t1 hover:bg-white/[.07] transition-colors"
            >
              열린 탭 전부 ({tabs.length}개)
            </button>
            <div className="my-1 h-px bg-white/[.07]" />
            {tabs.map((id) => {
              const m = MODEL_BY_ID[id];
              if (!m) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTarget(id);
                    setMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[9px] hover:bg-white/[.07] text-left transition-colors"
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  <span className="text-[13px] text-t1 truncate">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
