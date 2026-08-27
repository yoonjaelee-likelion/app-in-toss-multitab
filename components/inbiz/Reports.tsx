"use client";

import { Prose } from "@/components/Prose";
import type { Dept, Meeting } from "@/lib/inbiz";

/** 부서별 분석 — 카드가 각자 다른 속도로 채워진다 */
export function Reports({ depts }: { depts: Dept[] }) {
  if (!depts.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {depts.map((d, i) => (
        <ReportCard key={d.key} dept={d} index={i} />
      ))}
    </div>
  );
}

function ReportCard({ dept, index }: { dept: Dept; index: number }) {
  const working = dept.status === "working";
  const empty = !dept.report.trim();

  return (
    <section
      className={`rise glass rounded-[16px] overflow-hidden relative ${
        working && empty ? "sweep" : ""
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <header className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <span
          className="w-[26px] h-[26px] rounded-[9px] grid place-items-center text-[10.5px] font-bold text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${dept.color}, ${dept.color}99)` }}
        >
          {dept.abbr}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold text-t1 leading-tight truncate">
            {dept.name}
          </span>
          {dept.why && (
            <span className="block text-[11px] text-t3 leading-tight mt-[2px] truncate">
              {dept.why}
            </span>
          )}
        </span>
        {working ? (
          <Dots />
        ) : dept.status === "error" ? (
          <span className="text-[11px] text-bad shrink-0">실패</span>
        ) : (
          <span
            className="shrink-0 w-[5px] h-[5px] rounded-full"
            style={{ background: dept.color }}
            aria-hidden
          />
        )}
      </header>

      <div className="px-4 pb-4">
        {dept.status === "error" ? (
          <p className="text-[13px] text-t3">{dept.error ?? "분석에 실패했습니다"}</p>
        ) : empty ? (
          <p className="text-[13px] text-t4">자료를 보는 중입니다</p>
        ) : (
          <>
            <Prose text={dept.report} color={dept.color} />
            {working && (
              <span className="caret inline-block w-[2px] h-[13px] align-[-2px] ml-[1px] bg-t3" />
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ── 부서 회의 ────────────────────────────────────────────── */

export function Meetings({
  meetings,
  depts,
}: {
  meetings: Meeting[];
  depts: Dept[];
}) {
  if (!meetings.length) return null;
  const colorOf = (name: string) => depts.find((d) => d.name === name)?.color ?? "#8E96A8";
  const abbrOf = (name: string) => depts.find((d) => d.name === name)?.abbr ?? name.slice(0, 2);

  return (
    <div className="space-y-2.5">
      {meetings.map((m, i) => (
        <div
          key={m.id}
          className="rise glass-2 rounded-[15px] px-4 py-3.5"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Chip name={m.a} color={colorOf(m.a)} abbr={abbrOf(m.a)} />
            <span className="text-t4 text-[12px]" aria-hidden>
              ×
            </span>
            <Chip name={m.b} color={colorOf(m.b)} abbr={abbrOf(m.b)} />
          </div>

          {m.issue && (
            <p className="text-[13px] leading-[1.68] text-t2">
              <span className="text-[11px] font-semibold text-warn mr-1.5">쟁점</span>
              {m.issue}
            </p>
          )}
          {m.resolved && (
            <p className="text-[13px] leading-[1.68] text-t2 mt-1.5">
              <span className="text-[11px] font-semibold text-ok mr-1.5">정리</span>
              {m.resolved}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Chip({ name, color, abbr }: { name: string; color: string; abbr: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span
        className="w-[19px] h-[19px] rounded-[6px] grid place-items-center text-[9px] font-bold text-white shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
      >
        {abbr}
      </span>
      <span className="text-[12px] font-medium text-t1 truncate">{name}</span>
    </span>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px] shrink-0" aria-label="분석 중">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="dot-step block w-[3px] h-[3px] rounded-full bg-t3"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}
