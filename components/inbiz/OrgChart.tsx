"use client";

import { Thinking } from "@/components/Thinking";
import type { Dept, Phase } from "@/lib/inbiz";

/**
 * 조직도. 대표에서 줄기가 내려오고, 가로선이 펴지고, 부서마다 한 줄씩 떨어진다.
 * 부서 카드는 대표가 이름을 부르는 순간 하나씩 올라온다.
 *
 * 선은 퍼센트 좌표로 그린다 — 부서 수가 바뀌어도 다시 계산할 필요가 없다.
 */

const TRUNK = 28;
const BUS = 28;
const DROP = 50;

/** 부서가 하나씩 올라오는 간격 — 느려야 생기는 게 보인다 */
const STEP = 190;

export function OrgChart({
  depts,
  phase,
  headline,
  activePair,
}: {
  depts: Dept[];
  phase: Phase;
  headline: string;
  /** 지금 회의 중인 두 부서 */
  activePair?: [string, string] | null;
}) {
  const n = depts.length;
  const at = (i: number) => `${((i + 0.5) / Math.max(1, n)) * 100}%`;

  const headKind =
    phase === "staffing"
      ? "head"
      : phase === "meeting"
        ? "meet"
        : phase === "diagnosing"
          ? "diagnose"
          : null;

  return (
    <div className="w-full">
      {/* ── 대표 ── */}
      <div className="flex flex-col items-center">
        <div
          className={`relative glass glass-lit rounded-[17px] px-4 py-3 flex items-center gap-3 overflow-hidden ${
            headKind ? "sweep" : ""
          }`}
        >
          <span className="shrink-0 w-[34px] h-[34px] rounded-[11px] grid place-items-center text-[12px] font-bold text-t1 bg-white/[.1] border border-white/[.14]">
            대표
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-t1 leading-tight">대표 AI</span>
            <span className="block leading-tight mt-[4px]">
              {headKind ? (
                <Thinking kind={headKind} />
              ) : (
                <span className="text-[11.5px] text-t3">
                  {phase === "analyzing" ? `${n}개 부서가 분석 중` : `${n}개 부서 편성 완료`}
                </span>
              )}
            </span>
          </span>
        </div>

        {headline && (
          <p className="mt-3.5 text-[12.5px] text-t2 text-center max-w-[42ch] leading-[1.65] rise">
            {headline}
          </p>
        )}
      </div>

      {/* ── 연결선 + 부서 ── */}
      {n > 0 && (
        <div className="mt-3.5">
          <div className="overflow-x-auto no-bar">
            <div style={{ minWidth: n > 4 ? n * 106 : undefined }}>
              <svg width="100%" height={DROP} className="block" aria-hidden style={{ overflow: "visible" }}>
                <line
                  x1="50%"
                  y1="0"
                  x2="50%"
                  y2={TRUNK}
                  stroke="rgba(255,255,255,.15)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="draw"
                  style={{ strokeDasharray: 400, ["--len" as string]: 400 }}
                />
                {n > 1 && (
                  <line
                    x1={at(0)}
                    y1={BUS}
                    x2={at(n - 1)}
                    y2={BUS}
                    stroke="rgba(255,255,255,.15)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="draw"
                    style={{
                      strokeDasharray: 1400,
                      ["--len" as string]: 1400,
                      animationDelay: "420ms",
                    }}
                  />
                )}
                {depts.map((d, i) => (
                  <line
                    key={d.key}
                    x1={at(i)}
                    y1={BUS}
                    x2={at(i)}
                    y2={DROP}
                    stroke={d.status === "working" ? `${d.color}cc` : "rgba(255,255,255,.15)"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="draw"
                    style={{
                      strokeDasharray: 400,
                      ["--len" as string]: 400,
                      animationDelay: `${640 + i * STEP}ms`,
                      transition: "stroke 900ms ease",
                    }}
                  />
                ))}
              </svg>

              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              >
                {depts.map((d, i) => (
                  <DeptChip
                    key={d.key}
                    dept={d}
                    index={i}
                    meeting={Boolean(
                      activePair && (activePair[0] === d.name || activePair[1] === d.name),
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeptChip({ dept, index, meeting }: { dept: Dept; index: number; meeting: boolean }) {
  const working = dept.status === "working";
  return (
    <div
      className={`pop-in glass-2 rounded-[14px] px-2 py-2.5 flex flex-col items-center gap-1.5 text-center relative overflow-hidden ${
        meeting ? "pulse-ring" : ""
      }`}
      style={{
        animationDelay: `${700 + index * STEP}ms`,
        borderColor: working || meeting ? `${dept.color}44` : undefined,
      }}
      title={dept.why}
    >
      <span
        className="w-[30px] h-[30px] rounded-[10px] grid place-items-center text-[10.5px] font-bold shrink-0 transition-all duration-700"
        style={{
          background: working ? `${dept.color}2E` : "rgba(255,255,255,.07)",
          border: `1px solid ${working ? `${dept.color}66` : "rgba(255,255,255,.1)"}`,
          color: working ? dept.color : "var(--color-t2)",
        }}
      >
        {dept.abbr}
      </span>
      <span className="text-[11px] font-medium text-t2 leading-tight truncate w-full">
        {dept.name.replace(/팀$/, "")}
      </span>

      {working && (
        <span
          className="absolute inset-x-0 bottom-0 h-[2px] tab-load overflow-hidden"
          style={{ color: dept.color }}
          aria-hidden
        />
      )}
      {dept.status === "done" && (
        <span
          className="absolute top-2 right-2 w-[4px] h-[4px] rounded-full"
          style={{ background: dept.color }}
          aria-hidden
        />
      )}
    </div>
  );
}
