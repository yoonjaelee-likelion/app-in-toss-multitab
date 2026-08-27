"use client";

import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/Composer";
import { Logo } from "@/components/Logo";
import { TabStrip } from "@/components/TabStrip";
import { Thread } from "@/components/Thread";
import { MODEL_BY_ID } from "@/lib/models";
import { useTabs } from "@/lib/useTabs";

const EXAMPLES = [
  "지금 전세 재계약이 나을까, 무리해서 사는 게 나을까",
  "주 4일제가 실제로 생산성에 도움이 될까",
  "30대 중반에 완전히 다른 직무로 옮기는 건 무모한가",
  "아이 스마트폰은 몇 살부터 쥐여줘도 될까",
  "지금 이 사업 아이디어, 그만두는 게 맞을까 더 밀어붙이는 게 맞을까",
  "연봉을 낮춰서라도 워라밸 좋은 회사로 옮겨야 할까",
  "이 정도 증상이면 병원부터 가야 할까, 며칠 지켜봐도 될까",
  "지금 시장에서 예금이 나을까, 투자로 옮기는 게 나을까",
];

const WIDE = "(min-width: 1024px)";

/** 비교 보기는 화면이 넓을 때만. 좁으면 브라우저가 그렇듯 한 번에 한 탭만 본다. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const sync = () => setWide(mq.matches);
    // matchMedia는 구독 시점에 이벤트를 주지 않으므로 첫 값은 직접 읽는다.
    sync();
    mq.addEventListener("change", sync);
    // change 이벤트가 늦거나 누락되는 환경이 있어 resize도 같이 듣는다.
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return wide;
}

export default function Page() {
  const t = useTabs();
  const wide = useWide();
  const [view, setView] = useState<"compare" | "single">("compare");
  const [active, setActive] = useState(t.tabs[0] ?? "");
  const [auto, setAuto] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stage = useRef<"idle" | "debate" | "synth">("idle");
  const wasBusy = useRef(false);

  const compare = wide && view === "compare" && t.tabs.length > 1;
  // 활성 탭이 닫혔으면 첫 탭으로 — 상태를 고치지 않고 렌더에서 정한다
  const activeTab = t.tabs.includes(active) ? active : (t.tabs[0] ?? "");

  // 자동 토론 — 답이 다 오면 토론 한 판, 그다음 종합까지
  useEffect(() => {
    const finished = wasBusy.current && !t.busy;
    wasBusy.current = t.busy;
    if (!finished) return;
    if (stage.current === "debate" && t.tabs.length >= 2) {
      stage.current = "synth";
      t.debateRound();
    } else if (stage.current === "synth") {
      stage.current = "idle";
      t.synthesize();
    }
  }, [t]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [t.turns.length]);

  const send = (text: string, targets: string[]) => {
    stage.current = auto && targets.length >= 2 ? "debate" : "idle";
    t.ask(text, targets);
  };

  const empty = t.turns.length === 0;
  const cols = t.tabs.length;

  return (
    <div className="h-dvh flex flex-col bg-chrome">
      {/* ── 창 상단 ─────────────────────────────────────── */}
      <div className="shrink-0 h-[46px] px-3 sm:px-4 flex items-center gap-2">
        <Logo />
        <span className="flex-1" />

        {t.anyMock && (
          <span
            className="hidden sm:inline-flex items-center h-[24px] px-2 rounded-[6px] text-[11.5px] font-medium text-t3 border border-line"
            title="API 키가 없는 모델은 모의 응답으로 대신합니다"
          >
            모의 응답
          </span>
        )}

        <button
          type="button"
          onClick={() => setAuto((v) => !v)}
          aria-pressed={auto}
          title="답이 모이면 서로 반박하고 종합까지 자동으로 진행합니다"
          className={`h-[28px] px-2.5 rounded-[7px] text-[12.5px] font-medium transition-colors ${
            auto ? "bg-t1 text-white" : "text-t2 hover:text-t1 hover:bg-black/[.05]"
          }`}
        >
          자동 토론
        </button>

        {wide && t.tabs.length > 1 && (
          <div className="flex items-center h-[28px] p-[2px] rounded-[8px] bg-black/[.05]">
            {(["single", "compare"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`h-full px-2.5 rounded-[6px] text-[12.5px] font-medium transition-colors ${
                  view === v ? "bg-surface text-t1 shadow-[0_1px_2px_rgba(22,24,29,.12)]" : "text-t2 hover:text-t1"
                }`}
              >
                {v === "single" ? "탭 보기" : "비교 보기"}
              </button>
            ))}
          </div>
        )}

        {!empty && (
          <button
            type="button"
            onClick={t.reset}
            className="h-[28px] px-2.5 rounded-[7px] text-[12.5px] font-medium text-t2 hover:text-t1 hover:bg-black/[.05] transition-colors"
          >
            새 대화
          </button>
        )}
      </div>

      {/* ── 탭 ──────────────────────────────────────────── */}
      <TabStrip
        tabs={t.tabs}
        active={activeTab}
        merged={compare}
        loading={t.loading}
        onSelect={(id) => {
          setActive(id);
          if (compare) setView("single");
        }}
        onClose={t.closeTab}
        onOpen={(id) => {
          t.openTab(id);
          setActive(id);
        }}
      />

      {/* ── 내용 ────────────────────────────────────────── */}
      <div ref={scroller} className="flex-1 min-h-0 bg-surface overflow-auto scroll-y">
        <div style={{ minWidth: compare ? Math.max(0, cols * 250) : undefined }}>
          {empty ? (
            <Empty tabs={t.tabs} onPick={(q) => send(q, t.tabs)} />
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

      {/* ── 아래 조작부 ─────────────────────────────────── */}
      <div className="shrink-0 bg-surface border-t border-line px-3 sm:px-5 pt-2.5 pb-3">
        <div className="mx-auto w-full max-w-[900px]">
          {t.hasAnswers && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-bar">
              <button
                type="button"
                onClick={t.debateRound}
                disabled={t.busy || t.tabs.length < 2}
                className="shrink-0 h-[28px] px-2.5 rounded-[7px] border border-line text-[12.5px] font-medium text-t1 hover:bg-black/[.04] disabled:text-t4 disabled:hover:bg-transparent transition-colors"
              >
                토론 붙이기
              </button>
              <button
                type="button"
                onClick={() => t.synthesize()}
                disabled={t.busy}
                className="shrink-0 h-[28px] px-2.5 rounded-[7px] border border-line text-[12.5px] font-medium text-t1 hover:bg-black/[.04] disabled:text-t4 disabled:hover:bg-transparent transition-colors"
              >
                종합 보기
              </button>
              <span className="shrink-0 text-[11.5px] text-t3 pl-1">
                {t.tabs.length < 2 ? "토론은 탭이 두 개 이상일 때" : "열린 탭끼리 서로 반박합니다"}
              </span>
            </div>
          )}

          <Composer
            tabs={t.tabs}
            busy={t.busy}
            blind={t.blind}
            onBlind={t.setBlind}
            onSend={send}
            onStop={t.stop}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

function Empty({ tabs, onPick }: { tabs: string[]; onPick: (q: string) => void }) {
  const names = tabs.map((s) => MODEL_BY_ID[s]?.short).filter(Boolean);
  return (
    <div className="px-5 sm:px-7 pt-14 sm:pt-20 pb-10">
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-[21px] sm:text-[24px] font-bold tracking-[-0.03em] text-t1 leading-[1.4]">
          질문 하나, 탭 여러 개
        </h1>
        <p className="mt-2 text-[14.5px] leading-[1.7] text-t2">
          열려 있는 탭 전부가 같은 질문에 각자 답합니다. 대화는 하나라서 맥락을 공유하고, 서로
          반박도 시킬 수 있습니다.
          {names.length > 0 && (
            <>
              {" "}
              지금은 <span className="text-t1 font-medium">{names.join(", ")}</span>
              가 열려 있습니다.
            </>
          )}
        </p>

        <div className="mt-8">
          <p className="text-[11.5px] font-medium text-t3 mb-2">이렇게 물어봅니다</p>
          <div className="border border-line rounded-[10px] overflow-hidden">
            {EXAMPLES.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                disabled={tabs.length === 0}
                className={`w-full text-left px-3.5 py-3 text-[14px] leading-[1.55] text-t2 hover:bg-black/[.03] hover:text-t1 disabled:opacity-50 transition-colors ${
                  i > 0 ? "border-t border-line-2" : ""
                }`}
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
