"use client";

import type { Dept, Phase } from "@/lib/inbiz";

/**
 * 조직도. 대표 노드에서 줄기가 내려오고, 가로선이 좌우로 펴지고,
 * 각 부서로 한 줄씩 떨어진다. 부서 카드는 대표가 이름을 부르는 순간 올라온다.
 *
 * 선은 퍼센트 좌표로 그린다 — 부서 수가 바뀌어도 다시 계산할 필요가 없다.
 */

const TRUNK = 26; // 대표 아래 줄기 길이
const BUS = 26; // 가로선 y
const DROP = 46; // 부서로 떨어지는 선의 끝 y

export function OrgChart({
  depts,
  phase,
  headline,
  activePair,
}: {
  depts: Dept[];
  phase: Phase;
  headline: string;
  /** 지금 회의 중인 두 부서 — 링이 돈다 */
  activePair?: [string, string] | null;
}) {
  const n = depts.length;
  const at = (i: number) => `${((i + 0.5) / Math.max(1, n)) * 100}%`;
  const headBusy = phase === "staffing" || phase === "meeting" || phase === "diagnosing";

  return (
    <div className="w-full">
      {/* ── 대표 ── */}
      <div className="flex flex-col items-center">
        <div
          className={`relative glass glass-lit rounded-[16px] px-4 py-3 flex items-center gap-3 ${
            headBusy ? "sweep overflow-hidden" : ""
          }`}
        >
          <span className="grad-bg w-[34px] h-[34px] rounded-[11px] grid place-items-center text-[13px] font-bold text-white shrink-0">
            대표
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-t1 leading-tight">
              대표 AI
            </span>
            <span className="block text-[11.5px] text-t3 leading-tight mt-[3px]">
              {phase === "staffing"
                ? "부서를 편성하는 중"
                : phase === "analyzing"
                  ? `${n}개 부서가 분석 중`
                  : phase === "meeting"
                    ? "부서 회의를 붙이는 중"
                    : phase === "diagnosing"
                      ? "진단서를 쓰는 중"
                      : `${n}개 부서 편성 완료`}
            </span>
          </span>
        </div>

        {headline && (
          <p className="mt-3 text-[12.5px] text-t2 text-center max-w-[42ch] leading-[1.6]">
            {headline}
          </p>
        )}
      </div>

      {/* ── 연결선 + 부서 ── */}
      {n > 0 && (
        <div className="mt-3">
          <div className="overflow-x-auto no-bar">
            <div style={{ minWidth: n > 4 ? n * 104 : undefined }}>
              <svg
                width="100%"
                height={DROP}
                className="block"
                aria-hidden
                style={{ overflow: "visible" }}
              >
                {/* 줄기 */}
                <line
                  x1="50%"
                  y1="0"
                  x2="50%"
                  y2={TRUNK}
                  stroke="rgba(255,255,255,.16)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="draw"
                  style={{ strokeDasharray: 400, ["--len" as string]: 400 }}
                />
                {/* 가로선 */}
                {n > 1 && (
                  <line
                    x1={at(0)}
                    y1={BUS}
                    x2={at(n - 1)}
                    y2={BUS}
                    stroke="rgba(255,255,255,.16)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="draw"
                    style={{
                      strokeDasharray: 1200,
                      ["--len" as string]: 1200,
                      animationDelay: "180ms",
                    }}
                  />
                )}
                {/* 부서로 떨어지는 선 */}
                {depts.map((d, i) => (
                  <line
                    key={d.key}
                    x1={at(i)}
                    y1={BUS}
                    x2={at(i)}
                    y2={DROP}
                    stroke={d.status === "working" ? d.color : "rgba(255,255,255,.16)"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="draw"
                    style={{
                      strokeDasharray: 400,
                      ["--len" as string]: 400,
                      animationDelay: `${260 + i * 70}ms`,
                      opacity: d.status === "working" ? 0.85 : 1,
                      transition: "stroke 400ms ease",
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
                    meeting={Boolean(activePair && (activePair[0] === d.name || activePair[1] === d.name))}
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
      className={`pop-in glass-2 rounded-[13px] px-2 py-2.5 flex flex-col items-center gap-1.5 text-center relative overflow-hidden ${
        meeting ? "pulse-ring" : ""
      }`}
      style={{
        animationDelay: `${300 + index * 80}ms`,
        borderColor: working || meeting ? `${dept.color}55` : undefined,
      }}
      title={dept.why}
    >
      <span
        className="w-[30px] h-[30px] rounded-[10px] grid place-items-center text-[11px] font-bold text-white shrink-0"
        style={{
          background: `linear-gradient(135deg, ${dept.color}, ${dept.color}99)`,
          boxShadow: working ? `0 0 14px -2px ${dept.color}88` : undefined,
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
          className="absolute top-1.5 right-1.5 w-[5px] h-[5px] rounded-full"
          style={{ background: dept.color }}
          aria-hidden
        />
      )}
    </div>
  );
}
