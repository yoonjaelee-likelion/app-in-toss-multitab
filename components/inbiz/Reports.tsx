"use client";

import { Prose } from "@/components/Prose";
import { Thinking } from "@/components/Thinking";
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
      className={`rise glass rounded-[17px] overflow-hidden relative ${
        working && empty ? "sweep" : ""
      }`}
      style={{ animationDelay: `${index * 130}ms` }}
    >
      <header className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <span
          className="w-[26px] h-[26px] rounded-[9px] grid place-items-center text-[10px] font-bold shrink-0"
          style={{
            background: `${dept.color}26`,
            border: `1px solid ${dept.color}55`,
            color: dept.color,
          }}
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
        {dept.status === "error" ? (
          <span className="text-[11px] text-bad shrink-0">실패</span>
        ) : dept.status === "done" ? (
          <span
            className="shrink-0 w-[5px] h-[5px] rounded-full"
            style={{ background: dept.color }}
            aria-hidden
          />
        ) : null}
      </header>

      <div className="px-4 pb-4">
        {dept.status === "error" ? (
          <p className="text-[13px] text-t3">{dept.error ?? "분석에 실패했습니다"}</p>
        ) : empty ? (
          <div className="py-1.5">
            <Thinking kind="dept" />
          </div>
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

export function Meetings({ meetings, depts }: { meetings: Meeting[]; depts: Dept[] }) {
  if (!meetings.length) return null;
  const colorOf = (name: string) => depts.find((d) => d.name === name)?.color ?? "#5C6478";
  const abbrOf = (name: string) => depts.find((d) => d.name === name)?.abbr ?? name.slice(0, 2);

  return (
    <div className="space-y-2.5">
      {meetings.map((m, i) => (
        <div
          key={m.id}
          className="rise glass-2 rounded-[16px] px-4 py-3.5"
          style={{ animationDelay: `${i * 180}ms` }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Chip name={m.a} color={colorOf(m.a)} abbr={abbrOf(m.a)} />
            <span className="text-t4 text-[12px]" aria-hidden>
              ×
            </span>
            <Chip name={m.b} color={colorOf(m.b)} abbr={abbrOf(m.b)} />
          </div>

          {m.issue && (
            <p className="text-[13px] leading-[1.7] text-t2">
              <span className="text-[11px] font-semibold text-warn mr-1.5">쟁점</span>
              {m.issue}
            </p>
          )}
          {m.resolved && (
            <p className="text-[13px] leading-[1.7] text-t2 mt-1.5">
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
        className="w-[19px] h-[19px] rounded-[6px] grid place-items-center text-[8.5px] font-bold shrink-0"
        style={{ background: `${color}26`, border: `1px solid ${color}55`, color }}
      >
        {abbr}
      </span>
      <span className="text-[12px] font-medium text-t1 truncate">{name}</span>
    </span>
  );
}
