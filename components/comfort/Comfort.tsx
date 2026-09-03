"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { newId } from "@/lib/chat";
import {
  COMFORT_EXAMPLES,
  FRIENDS,
  FRIEND_BY_KEY,
  modelShort,
  shuffleCast,
  type ChatMsg,
  type ComfortCast,
  type FriendKey,
} from "@/lib/comfort";
import type { StoredSession } from "@/lib/sessions";
import { useComfort, type ComfortSnapshot } from "@/lib/useComfort";
import type { PersistInput } from "@/lib/useSessions";

/**
 * 위로방.
 *
 * 다섯이 동시에 답하지 않는다. 한 명씩 들어와서 앞사람 말을 받는다.
 * 그래서 화면도 단톡방 그대로다 — 아바타, 말풍선, 입력 중 표시.
 */
export function Comfort({
  persist,
  restore,
  onSession,
}: {
  persist: (p: PersistInput) => void;
  restore: StoredSession | null;
  onSession: (id: string) => void;
}) {
  const c = useComfort();
  const [text, setText] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(restore?.id ?? null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (restore?.data) c.load(restore.data as ComfortSnapshot);
  }, [c, restore]);

  /* 바닥에 붙어 있을 때만 따라 내려간다. 위로 올려 읽는 중이면 끌어내리지 않는다.
     첫 화면(사연 입력 전)에서는 아예 건드리지 않는다 — 제목이 위로 잘려 나간다. */
  const stick = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !c.msgs.length || !stick.current) return;
    const jump = () => el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    const t1 = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 100);
    const t2 = setTimeout(jump, 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // busy가 풀리면 아래에 안내 한 줄이 붙는다 — 그만큼 다시 내려가야 한다
  }, [c.msgs.length, c.typing, c.busy]);

  /* 말풍선이 자라는 동안에도 붙어 있는다 — 폰에서는 세 줄만 되도 아래로 넘어간다 */
  const lastLen = c.msgs[c.msgs.length - 1]?.text.length ?? 0;
  useEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [lastLen]);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }, []);

  const snapRef = useRef<ComfortSnapshot | null>(null);
  useEffect(() => {
    snapRef.current = c.snapshot;
  }, [c.snapshot]);

  useEffect(() => {
    const id = idRef.current;
    const snap = snapRef.current;
    if (!id || !snap || !snap.msgs.length) return;
    const first = snap.msgs.find((m) => m.who === "me");
    persist({
      id,
      mode: "comfort",
      title: first?.text ?? "위로방",
      subtitle: `친구 5명 · ${snap.msgs.filter((m) => m.who === "me").length}번 털어놓음`,
      data: snap,
    });
  }, [c.busy, c.msgs.length, persist]);

  const send = useCallback(
    (v: string) => {
      const body = v.trim();
      if (!body || c.busy) return;
      if (!idRef.current) {
        idRef.current = newId();
        onSession(idRef.current);
      }
      setText("");
      if (ta.current) ta.current.style.height = "auto";
      void c.send(body);
    },
    [c, onSession],
  );

  const empty = c.msgs.length === 0;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div ref={scroller} onScroll={onScroll} className="flex-1 min-h-0 overflow-auto scroll-y">
        {empty ? (
          <Intro cast={c.cast} onShuffle={() => c.reshuffle(shuffleCast())} onPick={send} />
        ) : (
          <div className="mx-auto w-full max-w-[640px] px-4 sm:px-5 py-5 space-y-3">
            {c.msgs.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
            {c.typing && <TypingRow who={c.typing} cast={c.cast} />}
            {c.error && <p className="text-[12.5px] text-bad text-center">{c.error}</p>}
            {c.mock && !c.busy && (
              <p className="text-[11px] text-t4 text-center pt-1">
                API 키가 없어 모의 응답으로 대화하고 있습니다
              </p>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line-2 px-3 sm:px-5 py-3">
        <div className="mx-auto w-full max-w-[640px]">
          <div className="glass glass-lit lit-focus rounded-[20px]">
            <textarea
              ref={ta}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(160, el.scrollHeight)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(text);
                }
              }}
              rows={1}
              placeholder={empty ? "무슨 일 있었어?" : "더 얘기해도 돼"}
              aria-label="사연 입력"
              className="w-full resize-none bg-transparent outline-none px-4 pt-3.5 pb-2 text-[15px] leading-[1.7] text-t1 placeholder:text-t4"
            />
            <div className="flex items-center gap-2 px-2.5 pb-2.5">
              <span className="flex-1 text-[11px] text-t4 pl-1 truncate">
                {c.busy ? "친구들이 답하는 중" : "친구 5명이 읽고 있습니다"}
              </span>
              {!empty && !c.busy && (
                <button
                  type="button"
                  onClick={() => {
                    idRef.current = null;
                    c.reset();
                  }}
                  className="h-[36px] sm:h-[31px] px-3 sm:px-2.5 rounded-[10px] sm:rounded-[9px] text-[12px] font-medium text-t3 hover:text-t1 press shrink-0"
                >
                  새 방
                </button>
              )}
              {c.busy ? (
                <button
                  type="button"
                  onClick={c.stop}
                  className="nm-btn h-[36px] sm:h-[31px] px-3.5 sm:px-3 rounded-[11px] sm:rounded-[10px] text-[12.5px] font-semibold text-t1 shrink-0"
                >
                  그만
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => send(text)}
                  disabled={!text.trim()}
                  aria-label="보내기"
                  title="보내기 ⏎"
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
        </div>
      </div>
    </div>
  );
}

/* ── 첫 화면 ──────────────────────────────────────────────── */

function Intro({
  cast,
  onShuffle,
  onPick,
}: {
  cast: ComfortCast;
  onShuffle: () => void;
  onPick: (q: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pt-[7vh] pb-10">
      <div className="rise text-center">
        <h1 className="text-[28px] sm:text-[36px] font-bold leading-[1.2] tracking-[-0.045em] text-t1">
          무슨 일 있었어?
        </h1>
        <p className="mt-3 text-[14px] sm:text-[15px] leading-[1.7] text-t2">
          다섯 명이 다 다르게 반응합니다.
          <br />
          편들어주는 애, 화내주는 애, 팩트 던지는 애, 굳이 반대편 드는 애.
        </p>
      </div>

      <div className="rise mt-7 space-y-1.5" style={{ animationDelay: "120ms" }}>
        {FRIENDS.map((f, i) => (
          <div
            key={f.key}
            className="pop-in glass-2 rounded-[13px] px-3 py-2.5 flex items-center gap-2.5"
            style={{ animationDelay: `${140 + i * 70}ms` }}
          >
            <Avatar who={f.key} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold text-t1">{f.name}</span>
              <span className="block text-[11px] text-t4 truncate">{f.trait}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-t4">{modelShort(cast[f.key])}</span>
          </div>
        ))}
        <div className="pt-1 text-right">
          <button
            type="button"
            onClick={onShuffle}
            className="h-[34px] sm:h-[26px] px-3 sm:px-2.5 rounded-[10px] sm:rounded-[8px] text-[11.5px] font-medium text-t3 hover:text-t1 press"
          >
            친구 섞기
          </button>
        </div>
      </div>

      <div className="rise mt-7" style={{ animationDelay: "320ms" }}>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-t4 uppercase mb-2.5">
          이런 것도 됩니다
        </p>
        <div className="space-y-1.5">
          {COMFORT_EXAMPLES.map((q, i) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="rise btn sheen w-full text-left px-3.5 py-2.5 text-[13px] leading-[1.5] text-t2 hover:text-t1"
              style={{ animationDelay: `${340 + i * 70}ms` }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 말풍선 ───────────────────────────────────────────────── */

function Bubble({ msg }: { msg: ChatMsg }) {
  if (msg.who === "me") {
    return (
      <div className="flex justify-end slide-in-r">
        <div className="max-w-[84%] nm rounded-[15px] rounded-tr-[5px] px-3.5 py-2.5">
          <p className="text-[14px] leading-[1.72] text-t1 break-keep whitespace-pre-wrap">
            {msg.text}
          </p>
        </div>
      </div>
    );
  }

  const f = FRIEND_BY_KEY[msg.who];
  return (
    <div className="flex gap-2.5 slide-in-l">
      <Avatar who={msg.who} size={30} />
      <div className="min-w-0 max-w-[84%]">
        <p className="mb-1 flex items-center gap-1.5 text-[10.5px]">
          <span style={{ color: f.color }}>{f.name}</span>
          <span className="text-t4">{modelShort(msg.model ?? "")}</span>
        </p>
        {/* 친구마다 자기 색을 아주 옅게 머금는다 — 다섯이 줄줄이 들어오는 방이라
            이름을 읽기 전에 누가 말하는지 보여야 한다 */}
        <div
          className="glass-2 rounded-[16px] rounded-tl-[6px] px-3.5 py-2.5"
          style={{
            background: `linear-gradient(150deg, ${f.color}16, ${f.color}0a)`,
            borderColor: `${f.color}33`,
            boxShadow: `inset 0 1px 0 var(--lip-soft), inset 2.5px 0 0 ${f.color}80`,
          }}
        >
          <p className="text-[14px] leading-[1.72] text-t1 break-keep whitespace-pre-wrap">
            {msg.text}
            {msg.streaming && (
              <span
                className="caret inline-block w-[2px] h-[14px] align-[-2px] ml-[1px]"
                style={{ background: f.color }}
              />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function TypingRow({ who, cast }: { who: FriendKey; cast: ComfortCast }) {
  const f = FRIEND_BY_KEY[who];
  return (
    <div className="flex gap-2.5 items-center slide-in-l">
      <Avatar who={who} size={30} />
      <div className="flex items-center gap-2 px-3 h-[34px] glass-2 rounded-[13px]">
        <span className="text-[11px]" style={{ color: f.color }}>
          {f.name}
        </span>
        <span className="text-[10.5px] text-t4">{modelShort(cast[who])}</span>
        <span className="inline-flex items-center gap-[3px]" aria-label="입력 중">
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              className="dot-step block w-[3px] h-[3px] rounded-full bg-t3"
              style={{ animationDelay: `${i * 170}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function Avatar({ who, size }: { who: FriendKey; size: number }) {
  const f = FRIEND_BY_KEY[who];
  return (
    <span
      className="shrink-0 grid place-items-center rounded-full font-bold nm"
      style={{
        width: size,
        height: size,
        color: f.color,
        fontSize: size * 0.42,
        boxShadow: `inset 0 0 0 1px ${f.color}33, 0 4px 12px -6px ${f.color}66`,
      }}
      aria-hidden
    >
      {f.name.slice(0, 1)}
    </span>
  );
}
