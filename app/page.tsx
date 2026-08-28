"use client";

import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/Composer";
import { Inbiz } from "@/components/inbiz/Inbiz";
import { Logo } from "@/components/Logo";
import { ModeSwitch, type Mode } from "@/components/ModeSwitch";
import { TabStrip } from "@/components/TabStrip";
import { Thread } from "@/components/Thread";
import { MODEL_BY_ID } from "@/lib/models";
import { useTabs } from "@/lib/useTabs";

const WIDE = "(min-width: 1024px)";

/** 넓으면 나란히, 좁으면 단체 대화방. 토글로 물어보지 않는다. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return wide;
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("inbiz");

  return (
    <div className="h-dvh flex flex-col relative">
      <div className="mesh" aria-hidden>
        <i />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-0">
        <header className="shrink-0 h-[56px] px-3 sm:px-5 flex items-center gap-2 sm:gap-3">
          <Logo />
          <span className="flex-1" />
          <ModeSwitch mode={mode} onChange={setMode} />
        </header>

        <main className="flex-1 min-h-0">
          {mode === "inbiz" ? <Inbiz key="inbiz" /> : <Debate key={mode} stance={mode} />}
        </main>
      </div>
    </div>
  );
}

/* ── 판정 · 레드팀 — 같은 엔진, 다른 태도 ────────────────── */

function Debate({ stance }: { stance: "judge" | "redteam" }) {
  const t = useTabs(stance);
  const wide = useWide();
  const [active, setActive] = useState(t.tabs[0] ?? "");
  const scroller = useRef<HTMLDivElement>(null);

  const red = stance === "redteam";
  // 넓은 화면에서 AI가 둘 이상이면 그냥 나란히 놓는다
  const compare = wide && t.tabs.length > 1;
  const activeTab = t.tabs.includes(active) ? active : (t.tabs[0] ?? "");

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [t.turns.length]);

  const empty = t.turns.length === 0;
  const cols = t.tabs.length;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 px-3 sm:px-5 pb-2.5 flex items-center gap-2">
        <span className="text-[11.5px] text-t3 truncate">
          {red ? "심사역 AI들이 약점만 찾습니다" : "AI들이 각자 답하고 서로 반박합니다"}
        </span>
        <span className="flex-1" />
        {!empty && (
          <button
            type="button"
            onClick={t.reset}
            className="h-[28px] px-2.5 rounded-[9px] text-[12.5px] font-medium text-t2 hover:text-t1 hover:bg-white/[.07] transition-colors shrink-0"
          >
            새 대화
          </button>
        )}
      </div>

      <TabStrip
        tabs={t.tabs}
        active={activeTab}
        merged={compare}
        loading={t.loading}
        onSelect={setActive}
        onClose={t.closeTab}
        onOpen={(id) => {
          t.openTab(id);
          setActive(id);
        }}
      />

      <div
        ref={scroller}
        className="flex-1 min-h-0 overflow-auto scroll-y mx-2 sm:mx-4 glass rounded-[19px]"
      >
        <div style={{ minWidth: compare ? Math.max(0, cols * 250) : undefined }}>
          {empty ? (
            <Empty red={red} tabs={t.tabs} onPick={(q) => t.ask(q, t.tabs)} />
          ) : (
            <Thread
              turns={t.turns}
              compare={compare}
              wide={wide}
              active={activeTab}
              onRetry={t.retry}
            />
          )}
        </div>
      </div>

      <div className="shrink-0 px-3 sm:px-5 pt-2.5 pb-3">
        <div className="mx-auto w-full max-w-[900px]">
          {t.hasAnswers && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-bar">
              <button
                type="button"
                onClick={t.debateRound}
                disabled={t.busy || t.tabs.length < 2}
                className="btn shrink-0 h-[28px] px-2.5 text-[12.5px] font-medium text-t1"
              >
                {red ? "교차 검증" : "서로 반박시키기"}
              </button>
              <button
                type="button"
                onClick={() => t.synthesize()}
                disabled={t.busy}
                className="btn shrink-0 h-[28px] px-2.5 text-[12.5px] font-medium text-t1"
              >
                {red ? "사망 진단서" : "정리하기"}
              </button>
            </div>
          )}

          <Composer tabs={t.tabs} busy={t.busy} onSend={t.ask} onStop={t.stop} />

          {t.anyMock && (
            <p className="mt-2 text-[11px] text-t4 text-center">
              API 키가 없는 모델은 모의 응답으로 대신합니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const JUDGE_Q = [
  "지금 이 사업, 접는 게 맞을까 더 밀어붙이는 게 맞을까",
  "공동창업자에게 지분을 얼마나 줘야 할까",
  "투자를 받는 게 나을까, 매출로 버티는 게 나을까",
  "가격을 올려야 할까, 지금 유지해야 할까",
];

const RED_Q = [
  "철산역 타코 프랜차이즈 1호점 계획을 공격해줘",
  "직장인 냉동 도시락 구독 서비스, 어디서 죽을까",
  "무인 스터디카페 창업 계획의 급소를 찾아줘",
  "우리 앱은 리텐션이 낮은데 마케팅을 늘리려고 한다",
];

function Empty({ red, tabs, onPick }: { red: boolean; tabs: string[]; onPick: (q: string) => void }) {
  const names = tabs.map((s) => MODEL_BY_ID[s]?.short).filter(Boolean);
  const list = red ? RED_Q : JUDGE_Q;

  return (
    <div className="px-5 sm:px-7 pt-12 sm:pt-16 pb-10">
      <div className="mx-auto max-w-[560px] rise">
        <h1 className="text-[22px] sm:text-[27px] font-bold tracking-[-0.04em] text-t1 leading-[1.34]">
          {red ? "이 사업이 어디서 죽는지 찾습니다" : "질문 하나, 탭 여러 개"}
        </h1>
        <p className="mt-3 text-[14.5px] leading-[1.75] text-t2">
          {red
            ? "열려 있는 AI 전부가 투자 심사역이 됩니다. 좋은 점은 말하지 않고 깨질 지점만 찾습니다."
            : "열려 있는 AI 전부가 같은 질문에 각자 답합니다. 대화는 하나라서 맥락을 공유하고, 서로 반박도 시킬 수 있습니다."}
          {names.length > 0 && (
            <>
              {" "}
              지금은 <span className="text-t1 font-medium">{names.join(", ")}</span>가 열려 있습니다.
            </>
          )}
        </p>

        <div className="mt-8 space-y-2">
          {list.map((q, i) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              disabled={tabs.length === 0}
              className="rise btn w-full text-left px-3.5 py-3 text-[13.5px] leading-[1.55] text-t2 hover:text-t1"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
