"use client";

import { useEffect, useRef } from "react";
import { Thinking } from "@/components/Thinking";
import { Meetings, Reports } from "@/components/inbiz/Reports";
import { OrgChart } from "@/components/inbiz/OrgChart";
import { Scorecard } from "@/components/inbiz/Scorecard";
import { newId } from "@/lib/chat";
import { useCopy } from "@/lib/i18n";
import type { Dept, Diagnosis, Meeting, Phase } from "@/lib/inbiz";
import type { StoredSession } from "@/lib/sessions";
import { useInbiz } from "@/lib/useInbiz";
import type { PersistInput } from "@/lib/useSessions";

interface InbizSnapshot {
  idea: string;
  headline: string;
  depts: Dept[];
  meetings: Meeting[];
  diagnosis: Diagnosis | null;
}

const STEPS: { key: Phase; label: string }[] = [
  { key: "staffing", label: "부서 편성" },
  { key: "analyzing", label: "부서 분석" },
  { key: "meeting", label: "부서 회의" },
  { key: "diagnosing", label: "종합 진단" },
];

export function Inbiz({
  engine,
  persist,
  restore,
  onSession,
  onPick,
}: {
  /** 엔진은 바깥(Ask)이 들고 있는다 — 입력창이 바깥에 있기 때문이다 */
  engine: ReturnType<typeof useInbiz>;
  persist: (p: PersistInput) => void;
  restore: StoredSession | null;
  onSession: (id: string) => void;
  /** 예시를 누르면 바깥 입력창에 꽂아 넣고 바로 돌린다 */
  onPick: (q: string) => void;
}) {
  const t = engine;
  const scroller = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(restore?.id ?? null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (restore?.data) t.load(restore.data as InbizSnapshot);
  }, [restore, t]);

  /* 단계가 넘어갈 때만 저장한다 — 스트리밍 중에 저장하면 화면이 멎는다 */
  const snapRef = useRef<InbizSnapshot | null>(null);
  useEffect(() => {
    snapRef.current = {
      idea: t.idea,
      headline: t.headline,
      depts: t.depts,
      meetings: t.meetings,
      diagnosis: t.diagnosis,
    };
  }, [t.idea, t.headline, t.depts, t.meetings, t.diagnosis]);

  useEffect(() => {
    const id = idRef.current;
    const snap = snapRef.current;
    if (!id || !snap?.idea) return;
    persist({
      id,
      mode: "inbiz",
      title: snap.idea,
      subtitle: snap.diagnosis
        ? `진단 완료 · ${snap.depts.length}개 부서`
        : `${snap.depts.length}개 부서 편성`,
      data: snap,
    });
  }, [t.phase, persist]);

  useEffect(() => {
    if (t.phase === "idle") return;
    const el = scroller.current;
    if (!el) return;
    const id = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 260);
    return () => clearTimeout(id);
  }, [t.phase, t.depts.length, t.meetings.length, t.diagnosis?.actions.length]);

  /* 새 진단이 시작되면 기록 id를 새로 딴다 — 바깥에서 run을 부르므로
     phase가 idle에서 넘어가는 순간을 여기서 잡는다 */
  const started = useRef(false);
  useEffect(() => {
    if (t.phase === "idle") {
      started.current = false;
      return;
    }
    if (started.current) return;
    started.current = true;
    idRef.current = newId();
    onSession(idRef.current);
  }, [t.phase, onSession]);

  if (t.phase === "idle") return <Empty onPick={onPick} />;

  return (
    <div ref={scroller} className="h-full overflow-auto scroll-y">
      <div className="mx-auto w-full max-w-[880px] px-4 sm:px-6 py-6 space-y-8">
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

        {t.phase === "meeting" && !t.meetings.length && (
          <Section label="부서 회의">
            <div className="glass-2 rounded-[16px] px-4 py-4">
              <Thinking kind="meet" size="md" />
            </div>
          </Section>
        )}

        {t.meetings.length > 0 && (
          <Section label="부서 회의">
            <Meetings meetings={t.meetings} depts={t.depts} />
          </Section>
        )}

        {t.phase === "diagnosing" && !t.diagnosis && (
          <div className="glass rounded-[20px] px-5 py-5">
            <Thinking kind="diagnose" size="md" />
          </div>
        )}

        {t.diagnosis && (
          <Scorecard
            diagnosis={t.diagnosis}
            headline={t.headline}
            streaming={t.phase === "diagnosing"}
          />
        )}

        {t.error && (
          <p className="glass-2 rounded-[14px] px-4 py-3 text-[13px] text-bad">{t.error}</p>
        )}

        <div className="flex items-center gap-2 pb-2">
          {t.busy ? (
            <button
              type="button"
              onClick={t.stop}
              className="btn h-[38px] px-4 text-[13px] font-medium text-t1"
            >
              중단
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                idRef.current = null;
                t.reset();
              }}
              className="nm-btn h-[38px] px-4 rounded-[12px] text-[13px] font-semibold text-t1"
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
              className={`inline-flex items-center gap-1.5 h-[28px] px-2.5 rounded-[9px] text-[12px] font-medium transition-colors duration-500 ${
                state === "now" ? "glass text-t1" : state === "done" ? "text-t2" : "text-t4"
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
                <i className="dot-step block w-[5px] h-[5px] rounded-full bg-t1" />
              ) : (
                <i className="block w-[5px] h-[5px] rounded-full rule" />
              )}
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`hidden sm:block w-4 h-px transition-colors duration-500 ${
                  i < idx ? "rule" : "track-2"
                }`}
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
      <p className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase mb-3">{label}</p>
      {children}
    </section>
  );
}

/* ── 시작 화면 ────────────────────────────────────────────────
   입력창은 이제 바깥 바닥에 있다. 여기는 무엇을 적으면 되는지 보여주고
   예시를 눌러 바로 굴릴 수 있게만 한다 — 판정·레드팀의 빈 화면과 같은 모양.
   ──────────────────────────────────────────────────────────── */

function Empty({ onPick }: { onPick: (q: string) => void }) {
  const c = useCopy();
  return (
    <div className="min-h-full flex flex-col px-4 sm:px-7">
      <span className="flex-1 min-h-[28px]" aria-hidden />
      <div className="mx-auto w-full max-w-[560px]">
        <div className="rise text-center">
          <span className="inline-flex items-center h-[26px] px-3 rounded-full glass-2 text-[11.5px] font-medium text-t2">
            {c.inbiz.badge}
          </span>
          <h2
            className="rise display whitespace-pre-line mt-5 text-[26px] sm:text-[34px]"
            style={{ animationDelay: "80ms" }}
          >
            {c.inbiz.title}
          </h2>
          <p
            className="rise mt-4 text-[14px] leading-[1.78] text-t2 max-w-[46ch] mx-auto"
            style={{ animationDelay: "140ms" }}
          >
            {c.inbiz.sub}
          </p>
        </div>

        <div className="rise mt-8" style={{ animationDelay: "220ms" }}>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t4 uppercase mb-3 text-center">
            {c.inbiz.samplesHead}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {c.inbiz.samples.map((it, i) => (
              <button
                key={it.q}
                type="button"
                onClick={() => onPick(it.q)}
                className="rise btn sheen px-3.5 py-2.5 rounded-full text-[12.5px] text-t2 hover:text-t1 text-left flex items-center gap-2"
                style={{ animationDelay: `${240 + i * 45}ms` }}
              >
                <span className="text-[10px] text-t4 font-medium shrink-0">{it.tag}</span>
                <span className="w-px h-[11px] rule-2 shrink-0" aria-hidden />
                {it.q}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="flex-1 min-h-[28px]" aria-hidden />
    </div>
  );
}
