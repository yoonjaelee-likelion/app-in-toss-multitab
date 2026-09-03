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
import { useCopy } from "@/lib/i18n";
import { MODELS } from "@/lib/models";

/**
 * 첫 화면.
 *
 * 고를 게 두 개뿐이다 — 어떤 법정이냐, 시작할 거냐.
 * 이름이니 사건명이니 하는 건 안에서 재판장이 물어본다.
 *
 * 등급 토글이 화면 전체를 지배한다. 아래 데모 사건도 전부 이 토글을 따라간다 —
 * 같은 사건을 일반으로 한 번, 19금으로 한 번 열어보면 차이가 바로 보인다.
 */
export function CourtStart({
  onStart,
  onDemo,
}: {
  onStart: (rating: Rating, cast: Cast) => void;
  onDemo: (demo: DemoCase, rating: Rating, cast: Cast) => void;
}) {
  const t = useCopy();
  const [rating, setRating] = useState<Rating>("normal");
  const [cast, setCast] = useState<Cast>(DEFAULT_CAST);
  const [gate, setGate] = useState(false);
  const [adultOk, setAdultOk] = useState(false);
  /** 나이 확인을 통과하면 눌렀던 사건을 그대로 이어서 연다 */
  const [pending, setPending] = useState<string | null>(null);
  const adult = rating === "adult";

  const shuffle = () => {
    const pool = [...MODELS].sort(() => Math.random() - 0.5).map((m) => m.id);
    setCast({ judge: pool[0], a: pool[1], b: pool[2], jury: pool[3] });
  };

  /** 19금으로 가려면 한 번은 확인을 받는다. 이미 받았으면 다시 묻지 않는다 */
  const wantAdult = (then: string | null) => {
    if (adultOk) {
      setRating("adult");
      if (then) {
        const d = DEMO_CASES.find((x) => x.id === then);
        if (d) onDemo(d, "adult", cast);
      }
      return;
    }
    setPending(then);
    setGate(true);
  };

  return (
    <div className="h-full overflow-auto scroll-y">
      <div className="mx-auto w-full max-w-[520px] px-4 sm:px-5 pt-6 sm:pt-[7vh] pb-14 text-center">
        <span className="rise inline-flex items-center gap-1.5 h-[26px] px-3 rounded-full glass-2 text-[11.5px] font-medium text-t2">
          <IconGavel size={13} className="text-gold" />
          {t.court.badge}
        </span>

        <h1 className="rise display mt-5 text-[32px] sm:text-[42px]">{t.court.title}</h1>
        <p
          className="rise mt-3.5 whitespace-pre-line text-[14.5px] sm:text-[15.5px] leading-[1.72] text-t2"
          style={{ animationDelay: "80ms" }}
        >
          {t.court.sub}
        </p>

        {/* ── 법정 고르기 — 이 토글이 아래 전부를 바꾼다 ───────── */}
        <div className="rise mt-8 flex justify-center" style={{ animationDelay: "150ms" }}>
          <div className="nm-in rounded-[14px] p-[3px] flex items-center gap-[3px]">
            <Tab on={!adult} onClick={() => setRating("normal")}>
              {t.court.normal}
            </Tab>
            <Tab on={adult} danger onClick={() => wantAdult(null)}>
              <IconSeal size={12} />
              {t.court.adult}
            </Tab>
          </div>
        </div>

        <p
          className="rise mt-2.5 text-[11.5px] leading-[1.6] text-t4 max-w-[40ch] mx-auto"
          style={{ animationDelay: "180ms" }}
        >
          {adult ? t.court.adultNote : t.court.normalNote}
        </p>

        {/* ── 개정 ───────────────────────────────────── */}
        <button
          type="button"
          onClick={() => onStart(rating, cast)}
          className={`rise sheen mt-7 h-[52px] w-full max-w-[300px] text-[15px] font-bold inline-flex items-center justify-center gap-2 ${
            adult ? "btn-brass" : "btn-solid"
          }`}
          style={{ animationDelay: "220ms" }}
        >
          <IconGavel size={17} />
          {t.court.start}
        </button>

        {/* ── 배역 — 한 줄로 접어 둔다. 대부분은 안 건드린다 ──── */}
        <div
          className="rise mt-4 flex items-center justify-center gap-x-2 gap-y-1 flex-wrap text-[10.5px] sm:text-[11px] text-t4"
          style={{ animationDelay: "260ms" }}
        >
          <span>{t.court.castJudge(shortOf(cast.judge))}</span>
          <Dot />
          <span className="text-[#2F63C4]">{t.court.castMan(shortOf(cast.a))}</span>
          <Dot />
          <span className="text-[#C0446E]">{t.court.castWoman(shortOf(cast.b))}</span>
          <Dot />
          <span>{t.court.castJury(shortOf(cast.jury))}</span>
          <button
            type="button"
            onClick={shuffle}
            className="press ml-1 h-[30px] sm:h-[24px] px-3 sm:px-2.5 rounded-full text-[11px] font-medium text-t3 hover:text-t1"
          >
            {t.court.shuffle}
          </button>
        </div>

        {/* ── 남의 사건 — 등급은 위 토글을 따라간다 ──────────── */}
        <div className="rise mt-11 text-left" style={{ animationDelay: "320ms" }}>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t4 uppercase mb-1.5 text-center">
            {t.court.demoHead}
          </p>
          <p className="text-[11.5px] leading-[1.6] text-t4 mb-3 text-center max-w-[36ch] mx-auto">
            {t.court.demoNote}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {DEMO_CASES.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => (adult && !adultOk ? wantAdult(d.id) : onDemo(d, rating, cast))}
                className="rise btn sheen h-[38px] sm:h-[34px] px-3.5 rounded-full text-[12.5px] font-medium text-t2 hover:text-t1 flex items-center gap-1.5"
                style={{ animationDelay: `${340 + i * 60}ms` }}
              >
                {adult && <span className="text-[9.5px] font-bold text-blood">19</span>}
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
            if (d) onDemo(d, "adult", cast);
          }}
        />
      )}
    </div>
  );
}

const Dot = () => <span className="w-[3px] h-[3px] rounded-full rule" aria-hidden />;

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
      className={`h-[40px] sm:h-[36px] px-4 rounded-[12px] text-[12.5px] font-semibold flex items-center gap-1.5 transition-all duration-500 ${
        on
          ? danger
            ? "text-blood nm seal-throb"
            : "text-t1 nm"
          : "text-t3 hover:text-t2"
      }`}
    >
      {children}
    </button>
  );
}

function AgeGate({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
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
        <h2 className="mt-4 text-[17px] font-bold text-t1 tracking-[-0.02em]">{t.court.gateTitle}</h2>
        <p className="mt-2.5 text-[13px] leading-[1.72] text-t2">
          <Bold text={t.court.gateBody} />
        </p>
        <p className="mt-2 text-[11.5px] leading-[1.6] text-t4">{t.court.gateNote}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="nm-btn flex-1 h-[42px] rounded-[12px] text-[13px] font-semibold text-t2"
          >
            {t.court.gateNo}
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

/** 사전 문장 안의 **강조**만 살린다 — 이거 하나 때문에 마크다운을 들일 이유는 없다 */
function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-t1 font-semibold">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
