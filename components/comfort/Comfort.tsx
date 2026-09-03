"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { newId } from "@/lib/chat";
import { IconSeal } from "@/components/shell/icons";
import { useCopy } from "@/lib/i18n";
import {
  FRIENDS,
  FRIEND_BY_KEY,
  modelShort,
  shuffleCast,
  type ChatMsg,
  type ComfortCast,
  type ComfortRating,
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
  const t = useCopy();
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
      title: first?.text ?? t.modes.comfort.label,
      subtitle: `친구 5명 · ${snap.msgs.filter((m) => m.who === "me").length}번 털어놓음`,
      data: snap,
    });
  }, [c.busy, c.msgs.length, persist, t]);

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
          <Intro
            cast={c.cast}
            rating={c.rating}
            onRating={c.setRating}
            onShuffle={() => c.reshuffle(shuffleCast())}
            onPick={send}
          />
        ) : (
          <div className="mx-auto w-full max-w-[640px] px-4 sm:px-5 py-5 space-y-3">
            {c.msgs.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
            {c.typing && <TypingRow who={c.typing} cast={c.cast} />}
            {c.error && <p className="text-[12.5px] text-bad text-center">{c.error}</p>}
            {c.mock && !c.busy && (
              <p className="text-[11px] text-t4 text-center pt-1">
                {t.comfort.mockNote}
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
              placeholder={empty ? t.comfort.placeholderFirst : t.comfort.placeholderMore}
              aria-label={t.comfort.aria}
              className="w-full resize-none bg-transparent outline-none px-4 pt-3.5 pb-2 text-[15px] leading-[1.7] text-t1 placeholder:text-t4"
            />
            <div className="flex items-center gap-2 px-2.5 pb-2.5">
              <span className="flex-1 text-[11px] text-t4 pl-1 truncate">
                {c.busy ? t.comfort.answering : t.comfort.reading}
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
                  {t.comfort.newRoom}
                </button>
              )}
              {c.busy ? (
                <button
                  type="button"
                  onClick={c.stop}
                  className="nm-btn h-[36px] sm:h-[31px] px-3.5 sm:px-3 rounded-[11px] sm:rounded-[10px] text-[12.5px] font-semibold text-t1 shrink-0"
                >
                  {t.comfort.stop}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => send(text)}
                  disabled={!text.trim()}
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
        </div>
      </div>
    </div>
  );
}

/* ── 첫 화면 ──────────────────────────────────────────────── */

function Intro({
  cast,
  rating,
  onRating,
  onShuffle,
  onPick,
}: {
  cast: ComfortCast;
  rating: ComfortRating;
  onRating: (r: ComfortRating) => void;
  onShuffle: () => void;
  onPick: (q: string) => void;
}) {
  const t = useCopy();
  const [gate, setGate] = useState(false);
  const [adultOk, setAdultOk] = useState(false);
  const adult = rating === "adult";

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 sm:px-5 pt-5 sm:pt-[6vh] pb-10">
      <div className="rise text-center">
        <h1 className="display text-[28px] sm:text-[36px]">{t.comfort.title}</h1>
        <p className="mt-3 whitespace-pre-line text-[14px] sm:text-[15px] leading-[1.7] text-t2">
          {t.comfort.sub}
        </p>
      </div>

      {/* ── 방의 온도 — 같은 사연도 여기서 완전히 달라진다 ──── */}
      <div className="rise mt-6 flex justify-center" style={{ animationDelay: "90ms" }}>
        <div className="nm-in rounded-[14px] p-[3px] flex items-center gap-[3px]">
          <RoomTab on={!adult} onClick={() => onRating("normal")}>
            {t.comfort.normal}
          </RoomTab>
          <RoomTab
            on={adult}
            danger
            onClick={() => (adultOk ? onRating("adult") : setGate(true))}
          >
            <IconSeal size={12} />
            {t.comfort.adult}
          </RoomTab>
        </div>
      </div>
      <p
        className="rise mt-2.5 text-center text-[11.5px] leading-[1.6] text-t4 max-w-[38ch] mx-auto"
        style={{ animationDelay: "120ms" }}
      >
        {adult ? t.comfort.adultNote : t.comfort.normalNote}
      </p>

      <div className="rise mt-6 space-y-1.5" style={{ animationDelay: "150ms" }}>
        {FRIENDS.map((f, i) => (
          <div
            key={f.key}
            className="pop-in glass-2 rounded-[14px] px-3 py-2.5 flex items-center gap-2.5"
            style={{
              animationDelay: `${170 + i * 70}ms`,
              borderColor: adult ? `${f.color}3a` : undefined,
            }}
          >
            <Avatar who={f.key} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold text-t1">
                {t.comfort.friends[f.key].name}
              </span>
              <span className="block text-[11px] text-t4 truncate">
                {t.comfort.friends[f.key].trait}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-t4">{modelShort(cast[f.key])}</span>
          </div>
        ))}
        <div className="pt-1 text-right">
          <button
            type="button"
            onClick={onShuffle}
            className="press h-[34px] sm:h-[28px] px-3 rounded-full text-[11.5px] font-medium text-t3 hover:text-t1"
          >
            {t.comfort.shuffle}
          </button>
        </div>
      </div>

      <div className="rise mt-7" style={{ animationDelay: "340ms" }}>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-t4 uppercase mb-2.5">
          {t.comfort.samplesHead}
        </p>
        <div className="space-y-1.5">
          {t.comfort.samples.map((q, i) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="rise btn sheen w-full text-left px-4 py-3 rounded-[14px] text-[13px] leading-[1.5] text-t2 hover:text-t1"
              style={{ animationDelay: `${360 + i * 70}ms` }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {gate && (
        <ComfortGate
          onCancel={() => setGate(false)}
          onOk={() => {
            setAdultOk(true);
            setGate(false);
            onRating("adult");
          }}
        />
      )}
    </div>
  );
}

function RoomTab({
  on,
  danger,
  onClick,
  children,
}: {
  on: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-[38px] px-4 rounded-[12px] text-[12.5px] font-semibold flex items-center gap-1.5 transition-all duration-500 ${
        on ? (danger ? "text-blood nm seal-throb" : "text-t1 nm") : "text-t3 hover:text-t2"
      }`}
    >
      {children}
    </button>
  );
}

/** 찐친방도 한 번은 확인을 받는다 — 법정과 같은 규칙이다 */
function ComfortGate({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  const t = useCopy();
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-5">
      <button
        type="button"
        aria-label={t.shell.close}
        onClick={onCancel}
        className="absolute inset-0 scrim"
        style={{ backdropFilter: "blur(5px)" }}
      />
      <div className="relative w-full max-w-[360px] glass-modal glass-lit rounded-[22px] p-6 rise text-center">
        <span
          className="mx-auto grid place-items-center w-[50px] h-[50px] rounded-full seal-throb"
          style={{
            background: "color-mix(in srgb, var(--color-blood) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-blood) 34%, transparent)",
            color: "var(--color-blood)",
          }}
        >
          <span className="font-mono text-[15px] font-bold">19</span>
        </span>
        <h2 className="mt-4 text-[17px] font-bold text-t1 tracking-[-0.02em]">{t.comfort.adult}</h2>
        <p className="mt-2.5 text-[13px] leading-[1.72] text-t2">{t.comfort.adultNote}</p>
        <p className="mt-2 text-[11.5px] leading-[1.6] text-t4">{t.court.gateNote}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="nm-btn flex-1 h-[42px] rounded-[12px] text-[13px] font-semibold text-t2"
          >
            {t.comfort.normal}
          </button>
          <button
            type="button"
            onClick={onOk}
            className="flex-1 h-[42px] rounded-[12px] text-[13px] font-bold text-white transition-transform duration-300 active:scale-[.98]"
            style={{
              background: "linear-gradient(180deg,#c8493f,#a32b24)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.28), 0 10px 24px -12px rgba(163,43,36,.55)",
            }}
          >
            {t.court.gateYes}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 말풍선 ───────────────────────────────────────────────── */

function Bubble({ msg }: { msg: ChatMsg }) {
  const t = useCopy();
  if (msg.who === "me") {
    return (
      <div className="flex justify-end slide-in-r">
        <div className="max-w-[90%] sm:max-w-[84%] nm rounded-[15px] rounded-tr-[5px] px-3.5 py-2.5">
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
      <div className="min-w-0 max-w-[90%] sm:max-w-[84%]">
        <p className="mb-1 flex items-center gap-1.5 text-[10.5px]">
          <span style={{ color: f.color }}>{t.comfort.friends[msg.who].name}</span>
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
  const t = useCopy();
  const f = FRIEND_BY_KEY[who];
  return (
    <div className="flex gap-2.5 items-center slide-in-l">
      <Avatar who={who} size={30} />
      <div className="flex items-center gap-2 px-3 h-[34px] glass-2 rounded-[13px]">
        <span className="text-[11px]" style={{ color: f.color }}>
          {t.comfort.friends[who].name}
        </span>
        <span className="text-[10.5px] text-t4">{modelShort(cast[who])}</span>
        <span className="inline-flex items-center gap-[3px]" aria-label={t.court.typing}>
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
