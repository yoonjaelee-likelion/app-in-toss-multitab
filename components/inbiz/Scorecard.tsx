"use client";

import { bandFor, toneFor, type Diagnosis } from "@/lib/inbiz";

/**
 * 사업 체성분 분석표.
 *
 * 인바디를 그대로 가져왔다 — 큰 숫자 하나, 항목별 막대와 표준 구간,
 * 핵심 수치 표, 가장 약한 부위, 그리고 처방. 보고서를 읽게 하지 않는다.
 */
export function Scorecard({
  diagnosis,
  headline,
  streaming,
}: {
  diagnosis: Diagnosis;
  headline: string;
  streaming: boolean;
}) {
  const tone = toneFor(diagnosis.verdict);

  return (
    <div className="rise glass glass-lit rounded-[22px] overflow-hidden">
      {/* ── 머리 ── */}
      <div className="px-5 sm:px-7 pt-6 pb-5 border-b border-line-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase">
            사업 체성분 분석
          </span>
          {streaming && <Dots />}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <Gauge score={diagnosis.total} color={tone.color} />

          <div className="min-w-0 flex-1">
            {headline && (
              <p className="text-[15px] sm:text-[16px] font-semibold text-t1 leading-[1.5] tracking-[-0.02em]">
                {headline}
              </p>
            )}
            {diagnosis.verdict && (
              <span
                className="inline-flex items-center h-[30px] mt-3 px-3 rounded-[9px] text-[13px] font-bold"
                style={{ color: tone.color, background: `${tone.color}1F` }}
              >
                {diagnosis.verdict}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 항목별 ── */}
      {diagnosis.metrics.length > 0 && (
        <div className="px-5 sm:px-7 py-5 border-b border-line-2">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase mb-4">
            항목별 진단
          </p>
          <div className="space-y-3.5">
            {diagnosis.metrics.map((m, i) => (
              <MetricRow key={m.key} metric={m} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── 핵심 수치 ── */}
      {diagnosis.figures.length > 0 && (
        <div className="px-5 sm:px-7 py-5 border-b border-line-2">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase mb-4">
            핵심 수치
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
            {diagnosis.figures.map((f) => (
              <div key={f.label} className="min-w-0">
                <p className="text-[11.5px] text-t3 mb-1">{f.label}</p>
                <p className="text-[15px] sm:text-[16px] font-bold text-t1 font-mono tracking-[-0.02em] truncate">
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 약한 고리 ── */}
      {diagnosis.weakest && (
        <div className="px-5 sm:px-7 py-5 border-b border-line-2">
          <div
            className="rounded-[13px] px-4 py-3.5 flex gap-3"
            style={{ background: "rgba(255,107,107,.09)", border: "1px solid rgba(255,107,107,.2)" }}
          >
            <span className="shrink-0 mt-[3px] text-bad" aria-hidden>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.6 15 14H1L8 1.6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.6" r=".85" fill="currentColor" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold text-bad mb-1">가장 약한 고리</p>
              <p className="text-[13.5px] leading-[1.65] text-t2">{diagnosis.weakest}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 처방 ── */}
      {diagnosis.actions.length > 0 && (
        <div className="px-5 sm:px-7 py-5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-t3 uppercase mb-4">
            지금 할 일
          </p>
          <ol className="space-y-2.5">
            {diagnosis.actions.map((a, i) => (
              <li key={i} className="flex gap-3 rise" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="shrink-0 mt-[1px] w-[22px] h-[22px] rounded-[7px] grid place-items-center text-[11.5px] font-bold text-t1 track-2 border border-line-2">
                  {i + 1}
                </span>
                <span className="prose-ko flex-1 !text-[14px]">{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ── 종합 점수 게이지 ─────────────────────────────────────── */

function Gauge({ score, color }: { score: number; color: string }) {
  const R = 46;
  const CIRC = 2 * Math.PI * R;
  // 위쪽이 트인 3/4 링 — 인바디 계기판 느낌
  const ARC = CIRC * 0.75;
  const filled = ARC * (Math.max(0, Math.min(100, score)) / 100);

  return (
    <div className="relative w-[124px] h-[124px] shrink-0">
      <svg width="124" height="124" viewBox="0 0 124 124" className="-rotate-[225deg]">
        <circle
          cx="62"
          cy="62"
          r={R}
          fill="none"
          stroke="var(--color-line-2)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRC}`}
        />
        <circle
          cx="62"
          cy="62"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRC}`}
          className="gauge"
          style={{
            ["--circ" as string]: ARC,
            filter: `drop-shadow(0 0 8px ${color}66)`,
            transition: "stroke-dasharray 700ms cubic-bezier(.22,1,.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p
            className="text-[34px] font-bold leading-none tracking-[-0.04em] font-mono"
            style={{ color }}
          >
            {score}
          </p>
          <p className="text-[10.5px] text-t3 mt-1">／ 100</p>
        </div>
      </div>
    </div>
  );
}

/* ── 항목 막대 ────────────────────────────────────────────── */

function MetricRow({
  metric,
  index,
}: {
  metric: { label: string; score: number; note: string };
  index: number;
}) {
  const band = bandFor(metric.score);
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[12.5px] font-medium text-t1 w-[74px] shrink-0">{metric.label}</span>
        <span className="text-[12.5px] font-bold font-mono tabular-nums" style={{ color: band.color }}>
          {metric.score}
        </span>
        <span className="text-[11px]" style={{ color: band.color }}>
          {band.label}
        </span>
        {metric.note && (
          <span className="ml-auto text-[11.5px] text-t3 truncate hidden sm:block max-w-[46%]">
            {metric.note}
          </span>
        )}
      </div>

      <div className="relative h-[7px] rounded-full track overflow-hidden">
        {/* 표준 구간 — 인바디의 회색 띠 */}
        <span
          className="absolute inset-y-0 track-2"
          style={{ left: "55%", right: "25%" }}
          aria-hidden
        />
        <span
          className="absolute inset-y-0 left-0 rounded-full bar-fill"
          style={{
            width: `${Math.max(2, metric.score)}%`,
            background: `linear-gradient(90deg, ${band.color}88, ${band.color})`,
            animationDelay: `${index * 80}ms`,
            boxShadow: `0 0 10px -2px ${band.color}`,
          }}
        />
      </div>

      {metric.note && <p className="mt-1.5 text-[11.5px] text-t3 sm:hidden">{metric.note}</p>}
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label="작성 중">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="dot-step block w-[3px] h-[3px] rounded-full bg-t2"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}
