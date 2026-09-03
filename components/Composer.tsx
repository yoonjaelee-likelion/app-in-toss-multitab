"use client";

import { useRef, useState } from "react";
import { useCopy } from "@/lib/i18n";

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
  const t = useCopy();
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
    /* 화면에서 가장 자주 손이 닿는 자리다. 다른 유리보다 두껍게 놓고
       테두리를 크게 굴린다 — 여기가 말 거는 곳이라는 걸 모양이 먼저 말한다. */
    <div className="relative glass glass-lit lit-focus rounded-[22px]">
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
          tabs.length === 0 ? t.composer.needTab : t.composer.placeholder
        }
        aria-label={t.composer.aria}
        className="w-full resize-none bg-transparent outline-none px-5 pt-4 pb-2 text-[15px] leading-[1.7] text-t1 placeholder:text-t4"
      />

      <div className="flex items-center gap-2 pl-5 pr-2.5 pb-2.5 pt-0.5">
        <span className="flex-1 text-[11.5px] text-t4 truncate">
          {tabs.length > 0 && t.composer.answering(tabs.length)}
        </span>

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="btn h-[38px] rounded-full px-4 text-[12.5px] font-medium text-t1"
          >
            {t.composer.stop}
          </button>
        ) : (
          /* 둥근 잉걸 하나. 글자를 지우고 방향만 남긴다 */
          <button
            type="button"
            onClick={send}
            disabled={!can}
            aria-label={t.composer.send}
            title={`${t.composer.send} ⏎`}
            className="btn-solid !rounded-full w-[38px] h-[38px] grid place-items-center shrink-0 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M8 13V3.4M3.8 7.6 8 3.2l4.2 4.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
