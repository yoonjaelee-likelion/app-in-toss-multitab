"use client";

import { nameOf, type CaseFile, type Verdict as V } from "@/lib/court";
import { useCopy } from "@/lib/i18n";

/**
 * 판결.
 *
 * 앞의 대화 전부가 이 카드 하나를 위해 있다. 그래서 여기만 명조를 쓰고,
 * 과실비율은 숫자보다 길이로 먼저 보이게 했다. 도장은 마지막에 찍힌다.
 */
export function VerdictCard({ verdict, file }: { verdict: V; file: CaseFile }) {
  const t = useCopy();
  const m = nameOf(file.man, "남자");
  const w = nameOf(file.woman, "여자");

  return (
    <div className="rise court-shake relative glass glass-lit rounded-[20px] overflow-hidden">
      <span aria-hidden className="spot" />

      <div className="relative px-4 sm:px-5 pt-4 pb-3.5 flex items-center gap-2">
        <span className="text-[10.5px] font-semibold tracking-[0.2em] text-gold/80 uppercase">
          {t.court.verdictLabel}
        </span>
        <span className="flex-1" />
        <Stamp />
      </div>

      {verdict.order && (
        <p className="serif px-4 sm:px-5 pb-4 text-[16px] sm:text-[18px] leading-[1.7] text-t1">
          {verdict.order}
        </p>
      )}

      <div className="px-4 sm:px-5 pb-4">
        <div className="nm-in rounded-[13px] p-[4px] flex gap-[4px] h-[48px]">
          <Bar name={m} pct={verdict.fault.m} tone="#2F63C4" align="left" />
          <Bar name={w} pct={verdict.fault.w} tone="#C0446E" align="right" />
        </div>
      </div>

      {verdict.sentences.length > 0 && (
        <div className="px-4 sm:px-5 pb-4 space-y-2">
          {verdict.sentences.map((s, i) => {
            const isMan = s.who.includes(m) || s.who.includes("남자");
            const tone = isMan ? "#2F63C4" : "#C0446E";
            return (
              <div
                key={`${s.who}-${i}`}
                className="pop-in flex gap-2.5 items-start"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <span
                  className="shrink-0 inline-flex items-center h-[20px] px-2 mt-[3px] rounded-[6px] text-[11px] font-bold"
                  style={{ color: tone, background: `${tone}1f` }}
                >
                  {s.who}
                </span>
                <p className="serif flex-1 text-[14px] leading-[1.7] text-t1">{s.order}</p>
              </div>
            );
          })}
        </div>
      )}

      {verdict.remark && (
        <div className="px-4 sm:px-5 pb-4">
          <div
            className="rounded-[13px] px-3.5 py-3"
            style={{
              background: "rgba(224,189,125,.06)",
              border: "1px solid rgba(224,189,125,.16)",
            }}
          >
            <p className="serif text-[13.5px] leading-[1.75] text-t1">{verdict.remark}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({
  name,
  pct,
  tone,
  align,
}: {
  name: string;
  pct: number;
  tone: string;
  align: "left" | "right";
}) {
  return (
    <div
      className="min-w-0 rounded-[10px] flex items-center px-3 overflow-hidden"
      style={{
        flexGrow: Math.max(pct, 1),
        flexBasis: 0,
        transition: "flex-grow 1400ms cubic-bezier(.16,1,.3,1)",
        background: `linear-gradient(180deg, ${tone}44, ${tone}1a)`,
        boxShadow: `inset 0 1px 0 ${tone}66, inset 0 0 0 1px ${tone}33`,
        justifyContent: align === "left" ? "flex-start" : "flex-end",
      }}
    >
      <span className="min-w-0 flex items-baseline gap-1.5">
        <span className="font-mono text-[16px] font-bold shrink-0" style={{ color: tone }}>
          {pct}%
        </span>
        <span className="text-[11px] text-t2 truncate">{name}</span>
      </span>
    </div>
  );
}

/** 인주로 찍은 도장. 어두운 판에서는 옅게 눌러야 했지만 종이 위에서는
    진짜 도장처럼 진해야 한다 — 여기가 이 카드에서 제일 붉은 자리다. */
function Stamp() {
  return (
    <span
      aria-hidden
      className="stamp grid place-items-center w-[54px] h-[54px] rounded-full shrink-0"
      style={{
        border: "2.5px solid rgba(178,42,34,.78)",
        boxShadow: "0 0 0 3px rgba(178,42,34,.08), 0 6px 14px -8px rgba(178,42,34,.5)",
        background: "rgba(178,42,34,.05)",
        color: "rgba(168,38,30,.9)",
      }}
    >
      <span className="serif text-[15px] font-bold leading-none">宣告</span>
    </span>
  );
}
