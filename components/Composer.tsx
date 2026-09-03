"use client";

import { useRef } from "react";
import { StanceBar, type Stance } from "@/components/shell/StanceBar";
import { ACCENT_BY_MODE } from "@/components/shell/modes";
import { useCopy } from "@/lib/i18n";

/**
 * 입력창.
 *
 * 판정·레드팀·인비즈는 결국 같은 동작이다 — 한 줄 적고 AI들한테 던진다.
 * 다른 건 태도뿐이라서 방을 옮길 일이 아니라 여기서 고를 일이다.
 * 그리고 고르면 이 상자가 직접 변한다 —
 *
 *   판정   기본. 한 줄 물어보는 자리.
 *   레드팀 크기는 같고 잉걸빛이 붉게 돈다. 공격하러 온 자리라는 뜻.
 *   인비즈 상자가 자란다. 사업을 한 줄로는 못 적기 때문이다. 보내기도
 *          동그라미가 아니라 「법인 세우기」라는 글자가 된다.
 *
 * 모양이 먼저 말하고 글자는 그 다음이다.
 */
export function Composer({
  stance,
  onStance,
  tabs,
  busy,
  text,
  onText,
  onSend,
  onStop,
}: {
  stance: Stance;
  onStance: (s: Stance) => void;
  /** 판정·레드팀에서 열려 있는 AI. 인비즈는 쓰지 않는다 */
  tabs: string[];
  busy: boolean;
  /** 초안은 바깥이 들고 있는다 — 태도를 바꿔도 쓰던 글이 남아야 한다 */
  text: string;
  onText: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
}) {
  const t = useCopy();
  const ta = useRef<HTMLTextAreaElement>(null);

  const inbiz = stance === "inbiz";
  const accent = ACCENT_BY_MODE[stance];
  const can = text.trim().length > 0 && (inbiz || tabs.length > 0) && !busy;

  const placeholder = inbiz
    ? t.inbiz.placeholder
    : stance === "redteam"
      ? t.debate.placeholderRed
      : tabs.length === 0
        ? t.composer.needTab
        : t.composer.placeholder;

  const send = () => {
    if (!can) return;
    onSend();
    if (ta.current) ta.current.style.height = "auto";
  };

  /* 인비즈는 처음부터 두 줄을 벌려 두고 더 높이 자란다 —
     사업 설명을 한 줄에 적으라고 하면 아무도 안 적는다. */
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(inbiz ? 220 : 190, el.scrollHeight)}px`;
  };

  return (
    <div
      className="relative glass glass-lit lit-focus transition-all duration-[420ms]"
      style={{
        /* 태도가 바뀌면 초점 테두리와 보내기 버튼 색이 같이 바뀐다 */
        ["--color-accent" as string]: accent,
        borderRadius: inbiz ? 24 : 22,
        transitionTimingFunction: "cubic-bezier(.16,1,.3,1)",
      }}
    >
      <textarea
        ref={ta}
        value={text}
        onChange={(e) => {
          onText(e.target.value);
          grow(e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        rows={inbiz ? 2 : 1}
        placeholder={placeholder}
        aria-label={inbiz ? t.inbiz.aria : t.composer.aria}
        className="w-full resize-none bg-transparent outline-none px-5 pt-4 pb-1.5 text-[15px] leading-[1.7] text-t1 placeholder:text-t4"
      />

      {/* 이 상자가 지금 무엇을 할지 한 줄. 태도를 바꾸면 이것도 바뀐다 */}
      <p className="px-5 pb-1.5 text-[11px] text-t4 truncate">
        {inbiz
          ? t.inbiz.inputNote
          : tabs.length > 0
            ? t.composer.answering(tabs.length)
            : t.composer.needTab}
      </p>

      {/* 아래 줄 — 왼쪽은 태도, 오른쪽은 보내기 */}
      <div className="flex items-center gap-2 pl-3 pr-2.5 pb-2.5">
        <StanceBar stance={stance} onStance={onStance} disabled={busy} />

        <span className="flex-1" />

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="btn h-[38px] rounded-full px-4 text-[12.5px] font-medium text-t1 shrink-0"
          >
            {t.composer.stop}
          </button>
        ) : inbiz ? (
          /* 한 번 누르면 법인이 통째로 선다 — 동그라미로는 그 무게가 안 산다 */
          <button
            type="button"
            onClick={send}
            disabled={!can}
            className="btn-solid h-[38px] rounded-full px-4 text-[13px] font-semibold flex items-center gap-1.5 shrink-0 disabled:cursor-not-allowed"
          >
            {t.inbiz.submit}
            <span className="text-[10.5px] font-normal opacity-55">⏎</span>
          </button>
        ) : (
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
