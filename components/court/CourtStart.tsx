"use client";

import { useState } from "react";
import { IconGavel, IconSeal } from "@/components/shell/icons";
import {
  DEMO_CASES,
  DEFAULT_CAST,
  shortOf,
  type Cast,
  type DemoCase,
  type Rating,
} from "@/lib/court";
import { MODELS } from "@/lib/models";

/**
 * 첫 화면.
 *
 * 고를 게 두 개뿐이다 — 어떤 법정이냐, 시작할 거냐.
 * 이름이니 사건명이니 하는 건 안에서 재판장이 물어본다.
 */
export function CourtStart({
  onStart,
  onDemo,
}: {
  onStart: (rating: Rating, cast: Cast) => void;
  onDemo: (demo: DemoCase, cast: Cast) => void;
}) {
  const [rating, setRating] = useState<Rating>("normal");
  const [cast, setCast] = useState<Cast>(DEFAULT_CAST);
  const [gate, setGate] = useState(false);
  const [adultOk, setAdultOk] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const shuffle = () => {
    const pool = [...MODELS].sort(() => Math.random() - 0.5).map((m) => m.id);
    setCast({ judge: pool[0], a: pool[1], b: pool[2], jury: pool[3] });
  };

  const pickDemo = (d: DemoCase) => {
    if (d.rating === "adult" && !adultOk) {
      setPending(d.id);
      setGate(true);
      return;
    }
    onDemo(d, cast);
  };

  return (
    <div className="h-full overflow-auto scroll-y">
      <div className="mx-auto w-full max-w-[520px] px-5 pt-[9vh] pb-14 text-center">
        <span className="rise inline-flex items-center gap-1.5 h-[26px] px-3 rounded-full glass-2 text-[11.5px] font-medium text-t2">
          <IconGavel size={13} className="text-gold" />
          AI관계법원
        </span>

        <h1 className="rise mt-5 text-[32px] sm:text-[44px] font-bold leading-[1.16] tracking-[-0.045em] text-t1">
          싸우셨어요?
        </h1>
        <p
          className="rise mt-3.5 text-[14.5px] sm:text-[15.5px] leading-[1.7] text-t2"
          style={{ animationDelay: "80ms" }}
        >
          앉으세요. 재판장이 한 명씩 부릅니다.
          <br />
          할 말만 적으면 AI 대리인 둘이 알아서 물어뜯습니다.
        </p>

        {/* ── 법정 고르기 ─────────────────────────────── */}
        <div className="rise mt-8 flex justify-center" style={{ animationDelay: "150ms" }}>
          <div className="nm rounded-[13px] p-[3px] flex items-center gap-[3px]">
            <Tab on={rating === "normal"} onClick={() => setRating("normal")}>
              일반 법정
            </Tab>
            <Tab
              on={rating === "adult"}
              danger
              onClick={() => (adultOk ? setRating("adult") : (setPending(null), setGate(true)))}
            >
              <IconSeal size={12} />
              19금 법정
            </Tab>
          </div>
        </div>

        <p
          className="rise mt-2.5 text-[11.5px] leading-[1.6] text-t4 max-w-[38ch] mx-auto"
          style={{ animationDelay: "180ms" }}
        >
          {rating === "adult"
            ? "대리인들이 서로 욕하면서 싸웁니다. 상대 AI 모델까지 걸고 넘어집니다."
            : "말투는 법정, 내용은 코미디. 욕설은 없습니다."}
        </p>

        {/* ── 개정 ───────────────────────────────────── */}
        <button
          type="button"
          onClick={() => onStart(rating, cast)}
          className="rise sheen btn-brass mt-7 h-[50px] w-full max-w-[300px] text-[15px] font-bold inline-flex items-center justify-center gap-2"
          style={{ animationDelay: "220ms" }}
        >
          <IconGavel size={17} />
          시작하기
        </button>

        {/* ── 배역 ───────────────────────────────────── */}
        <div
          className="rise mt-4 flex items-center justify-center gap-2 flex-wrap text-[11px] text-t4"
          style={{ animationDelay: "260ms" }}
        >
          <span>재판장 {shortOf(cast.judge)}</span>
          <Dot />
          <span className="text-[#6AA6FF]/70">남자측 {shortOf(cast.a)}</span>
          <Dot />
          <span className="text-[#FF7A9C]/70">여자측 {shortOf(cast.b)}</span>
          <Dot />
          <span>배심 {shortOf(cast.jury)}</span>
          <button
            type="button"
            onClick={shuffle}
            className="ml-1 h-[30px] sm:h-[22px] px-3 sm:px-2 rounded-[9px] sm:rounded-[7px] text-[11px] sm:text-[10.5px] font-medium text-t3 hover:text-t1 active:bg-white/[.09] sm:hover:bg-white/[.07] transition-colors"
          >
            섞기
          </button>
        </div>

        {/* ── 남의 사건 ──────────────────────────────── */}
        <div className="rise mt-11 text-left" style={{ animationDelay: "320ms" }}>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t4 uppercase mb-2.5 text-center">
            아니면 남의 사건 구경하기
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {DEMO_CASES.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => pickDemo(d)}
                className="rise btn sheen h-[38px] sm:h-[32px] px-3.5 sm:px-3 text-[12.5px] font-medium text-t2 hover:text-t1 flex items-center gap-1.5"
                style={{ animationDelay: `${340 + i * 60}ms` }}
              >
                {d.rating === "adult" && (
                  <span className="text-[9.5px] font-bold text-blood">19</span>
                )}
                {d.tag}
                <span className="text-t4 text-[11px]">
                  {d.man.name} · {d.woman.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {gate && (
        <AgeGate
          onCancel={() => {
            setGate(false);
            setPending(null);
          }}
          onOk={() => {
            setAdultOk(true);
            setGate(false);
            setRating("adult");
            const d = DEMO_CASES.find((x) => x.id === pending);
            setPending(null);
            if (d) onDemo(d, cast);
          }}
        />
      )}
    </div>
  );
}

const Dot = () => <span className="w-[3px] h-[3px] rounded-full bg-white/15" aria-hidden />;

function Tab({
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
      className={`h-[40px] sm:h-[34px] px-4 sm:px-3.5 rounded-[12px] sm:rounded-[11px] text-[12.5px] font-semibold flex items-center gap-1.5 transition-all duration-500 ${
        on ? (danger ? "text-blood nm-in seal-throb" : "text-t1 nm-in") : "text-t3 hover:text-t2"
      }`}
    >
      {children}
    </button>
  );
}

function AgeGate({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-5">
      <button
        type="button"
        aria-label="닫기"
        onClick={onCancel}
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: "blur(5px)" }}
      />
      <div className="relative w-full max-w-[360px] glass-3 glass-lit rounded-[20px] p-6 rise text-center">
        <span
          className="mx-auto grid place-items-center w-[50px] h-[50px] rounded-full seal-throb"
          style={{
            background: "rgba(255,107,107,.12)",
            border: "1px solid rgba(255,107,107,.3)",
            color: "var(--color-blood)",
          }}
        >
          <span className="font-mono text-[15px] font-bold">19</span>
        </span>
        <h2 className="mt-4 text-[17px] font-bold text-t1 tracking-[-0.02em]">19금 법정</h2>
        <p className="mt-2.5 text-[13px] leading-[1.72] text-t2">
          대리인들이 <strong className="text-t1">욕을 하면서</strong> 싸웁니다. 상대 AI 모델까지
          걸고 넘어집니다. 만 19세 이상만 여십시오.
        </p>
        <p className="mt-2 text-[11.5px] leading-[1.6] text-t4">
          혐오 표현과 노골적인 성적 묘사는 여기서도 나오지 않습니다.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="nm-btn flex-1 h-[40px] rounded-[12px] text-[13px] font-semibold text-t2"
          >
            일반 법정으로
          </button>
          <button
            type="button"
            onClick={onOk}
            className="flex-1 h-[40px] rounded-[12px] text-[13px] font-bold text-white transition-transform duration-300 active:scale-[.98]"
            style={{
              background: "linear-gradient(180deg,#ff8080,#d84f4f)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 10px 24px -14px rgba(216,79,79,.9)",
            }}
          >
            19세 이상입니다
          </button>
        </div>
      </div>
    </div>
  );
}
