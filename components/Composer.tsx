"use client";

import { useRef, useState } from "react";

/**
 * 입력창. 고를 게 없다 — 열려 있는 AI 전부에게 간다.
 * 대상 고르기, 독립 답변 같은 스위치는 전부 뺐다. 쓰는 사람이 정할 게 아니다.
 */
export function Composer({
  tabs,
  busy,
  onSend,
  onStop,
}: {
  tabs: string[];
  busy: boolean;
  onSend: (text: string, targets: string[]) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);

  const can = text.trim().length > 0 && tabs.length > 0 && !busy;

  const send = () => {
    if (!can) return;
    onSend(text.trim(), tabs);
    setText("");
    if (ta.current) ta.current.style.height = "auto";
  };

  return (
    <div className="relative glass glass-lit rounded-[16px] focus-within:border-white/20 transition-colors">
      <textarea
        ref={ta}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${Math.min(190, el.scrollHeight)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        rows={1}
        placeholder={
          tabs.length === 0 ? "AI를 먼저 열어주세요" : "열린 AI 전부에게 한 번에 물어봅니다"
        }
        aria-label="질문 입력"
        className="w-full resize-none bg-transparent outline-none px-4 pt-3.5 pb-2 text-[15px] leading-[1.7] text-t1 placeholder:text-t4"
      />

      <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-0.5">
        <span className="flex-1 text-[11.5px] text-t4 pl-1 truncate">
          {tabs.length > 0 && `${tabs.length}개 AI가 함께 답합니다`}
        </span>

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="btn h-[36px] sm:h-[31px] px-3.5 sm:px-3 text-[12.5px] font-medium text-t1"
          >
            중단
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!can}
            className="btn-solid h-[36px] sm:h-[31px] pl-3.5 pr-3 sm:pl-3 sm:pr-2.5 text-[12.5px] font-semibold flex items-center gap-1.5 disabled:cursor-not-allowed"
          >
            보내기
            <span className="text-[10.5px] font-normal opacity-55">⏎</span>
          </button>
        )}
      </div>
    </div>
  );
}
