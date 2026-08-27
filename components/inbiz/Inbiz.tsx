"use client";

import { useEffect, useRef, useState } from "react";
import { Meetings, Reports } from "@/components/inbiz/Reports";
import { OrgChart } from "@/components/inbiz/OrgChart";
import { Scorecard } from "@/components/inbiz/Scorecard";
import type { Phase } from "@/lib/inbiz";
import { useInbiz } from "@/lib/useInbiz";

const IDEAS = [
  "철산역에 타코 프랜차이즈 1호점을 내고 싶다",
  "대학가에 무인 스터디카페를 열려고 한다",
  "직장인 대상 냉동 도시락 구독 서비스",
  "동네 병원 예약을 대신 잡아주는 앱",
  "제주에서 반려견 동반 숙소를 운영하려 한다",
];

const STEPS: { key: Phase; label: string }[] = [
  { key: "staffing", label: "부서 편성" },
  { key: "analyzing", label: "부서 분석" },
  { key: "meeting", label: "부서 회의" },
  { key: "diagnosing", label: "종합 진단" },
];

export function Inbiz() {
  const t = useInbiz();
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  // 단계가 넘어갈 때마다 새로 생긴 영역으로 따라 내려간다
  useEffect(() => {
    if (t.phase === "idle") return;
    const el = scroller.current;
    if (!el) return;
    const id = setTimeout(
      () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
      120,
    );
    return () => clearTimeout(id);
  }, [t.phase, t.depts.length, t.meetings.length, t.diagnosis?.actions.length]);

  const submit = (v: string) => {
    const q = v.trim();
    if (!q || t.busy) return;
    setText("");
    if (ta.current) ta.current.style.height = "auto";
    void t.run(q);
  };

  if (t.phase === "idle") {
    return (
      <Intake
        text={text}
        setText={setText}
        onSubmit={submit}
        taRef={ta}
      />
    );
  }

  return (
    <div ref={scroller} className="h-full overflow-auto scroll-y">
      <div className="mx-auto w-full max-w-[880px] px-4 sm:px-6 py-6 space-y-7">
        <PhaseRail phase={t.phase} />

        <OrgChart
          depts={t.depts}
          phase={t.phase}
          headline={t.headline}
          activePair={
            t.phase === "meeting" && t.meetings.length
              ? [t.meetings[t.meetings.length - 1].a, t.meetings[t.meetings.length - 1].b]
              : null
          }
        />

        {t.depts.some((d) => d.report || d.status !== "waiting") && (
          <Section label="부서별 분석">
            <Reports depts={t.depts} />
          </Section>
        )}

        {t.meetings.length > 0 && (
          <Section label="부서 회의">
            <Meetings meetings={t.meetings} depts={t.depts} />
          </Section>
        )}

        {t.diagnosis && (
          <Scorecard
            diagnosis={t.diagnosis}
            headline={t.headline}
            streaming={t.phase === "diagnosing"}
          />
        )}

        {t.error && (
          <p className="glass-2 rounded-[13px] px-4 py-3 text-[13px] text-bad">{t.error}</p>
        )}

        <div className="flex items-center gap-2 pb-2">
          {t.busy ? (
            <button
              type="button"
              onClick={t.stop}
              className="h-[38px] px-4 rounded-[11px] glass-2 text-[13px] font-medium text-t1 hover:bg-white/[.07] transition-colors"
            >
              중단
            </button>
          ) : (
            <button
              type="button"
              onClick={t.reset}
              className="h-[38px] px-4 rounded-[11px] glass-2 text-[13px] font-medium text-t1 hover:bg-white/[.07] transition-colors"
            >
              다른 사업 진단하기
            </button>
          )}
          {t.mock && (
            <span className="text-[11.5px] text-t3">
              API 키가 없어 모의 데이터로 돌고 있습니다
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 진행 표시 ────────────────────────────────────────────── */

function PhaseRail({ phase }: { phase: Phase }) {
  const at = STEPS.findIndex((s) => s.key === phase);
  const idx = phase === "done" ? STEPS.length : at;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-bar">
      {STEPS.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "now" : "next";
        return (
          <div key={s.key} className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 h-[28px] px-2.5 rounded-[9px] text-[12px] font-medium transition-colors ${
                state === "now"
                  ? "glass text-t1"
                  : state === "done"
                    ? "text-t2"
                    : "text-t4"
              }`}
            >
              {state === "done" ? (
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden className="text-ok">
                  <path
                    d="M2.5 6.3 4.8 8.6 9.5 3.9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : state === "now" ? (
                <i className="dot-step block w-[5px] h-[5px] rounded-full grad-bg" />
              ) : (
                <i className="block w-[5px] h-[5px] rounded-full bg-white/15" />
              )}
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`hidden sm:block w-4 h-px ${i < idx ? "bg-white/20" : "bg-white/[.07]"}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rise">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase mb-3">
        {label}
      </p>
      {children}
    </section>
  );
}

/* ── 첫 화면 ──────────────────────────────────────────────── */

function Intake({
  text,
  setText,
  onSubmit,
  taRef,
}: {
  text: string;
  setText: (v: string) => void;
  onSubmit: (v: string) => void;
  taRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="h-full overflow-auto scroll-y">
      <div className="mx-auto w-full max-w-[680px] px-5 sm:px-6 pt-[9vh] pb-12">
        <div className="rise text-center">
          <span className="inline-flex items-center h-[26px] px-2.5 rounded-full glass-2 text-[11.5px] font-medium text-t2">
            인비즈 · 인바디 + 비즈니스
          </span>
          <h1 className="mt-5 text-[30px] sm:text-[40px] font-bold leading-[1.24] tracking-[-0.04em]">
            사업을 한 줄 적으면
            <br />
            <span className="grad-text">법인 하나가 통째로</span> 붙습니다
          </h1>
          <p className="mt-4 text-[14.5px] sm:text-[15.5px] leading-[1.72] text-t2 max-w-[46ch] mx-auto">
            대표 AI가 사업을 읽고 필요한 부서를 그 자리에서 만듭니다. 부서들이 각자 분석하고,
            숫자가 어긋나는 곳끼리 회의를 붙이고, 마지막에 검진 결과표 한 장으로 돌려줍니다.
          </p>
        </div>

        <div
          className="rise mt-9 glass glass-lit rounded-[18px] p-2"
          style={{ animationDelay: "80ms" }}
        >
          <textarea
            ref={taRef}
            value={text}
            autoFocus
            onChange={(e) => {
              setText(e.target.value);
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(160, el.scrollHeight)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSubmit(text);
              }
            }}
            rows={2}
            placeholder="어떤 사업을 생각하고 계신가요?  예: 철산역에 타코 프랜차이즈 1호점"
            aria-label="사업 아이디어"
            className="w-full resize-none bg-transparent outline-none px-3.5 pt-3 pb-2 text-[15px] leading-[1.68] text-t1 placeholder:text-t4"
          />
          <div className="flex items-center gap-2 px-2 pb-1 pt-1">
            <span className="flex-1 text-[11.5px] text-t4 pl-1.5 truncate">
              업종·입지·규모를 같이 적으면 진단이 정확해집니다
            </span>
            <button
              type="button"
              onClick={() => onSubmit(text)}
              disabled={!text.trim()}
              className="h-[36px] px-4 rounded-[11px] grad-bg text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all shrink-0"
            >
              법인 세우기
              <span className="text-[10.5px] font-normal opacity-70">⏎</span>
            </button>
          </div>
        </div>

        <div className="rise mt-7" style={{ animationDelay: "160ms" }}>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase mb-3">
            이런 사업으로 시작해보기
          </p>
          <div className="flex flex-wrap gap-2">
            {IDEAS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSubmit(q)}
                className="glass-2 rounded-[11px] px-3 py-2 text-[13px] text-t2 hover:text-t1 hover:bg-white/[.07] transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
