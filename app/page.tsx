"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Comfort } from "@/components/comfort/Comfort";
import { Composer } from "@/components/Composer";
import { Court } from "@/components/court/Court";
import { Inbiz } from "@/components/inbiz/Inbiz";
import { TabStrip } from "@/components/TabStrip";
import { Thread } from "@/components/Thread";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Sidebar } from "@/components/shell/Sidebar";
import { IconPanel, IconSearch } from "@/components/shell/icons";
import { MODE_BY_KEY, type Mode } from "@/components/shell/modes";
import { newId, type Turn } from "@/lib/chat";
import { MODEL_BY_ID } from "@/lib/models";
import type { StoredSession } from "@/lib/sessions";
import { useSessions, type PersistInput } from "@/lib/useSessions";
import { useStoredFlag } from "@/lib/useStoredFlag";
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
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("judge");
  const [collapsed, setRail] = useStoredFlag("multitab.rail");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [restore, setRestore] = useState<StoredSession | null>(null);
  const [seed, setSeed] = useState(0);

  const sessions = useSessions();
  const wide = useWide();

  const fresh = useCallback(
    (m?: Mode) => {
      if (m) setMode(m);
      setRestore(null);
      setActiveId(null);
      setSeed((s) => s + 1);
      setMobileOpen(false);
    },
    [],
  );

  const open = useCallback((s: StoredSession) => {
    setMode(s.mode);
    setRestore(s);
    setActiveId(s.id);
    setSeed((n) => n + 1);
    setMobileOpen(false);
  }, []);

  /* ⌘K 팔레트 · ⌘B 사이드바 */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      } else if (e.key === "b") {
        e.preventDefault();
        setRail(!collapsed);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [collapsed, setRail]);

  /* 넓어지면 서랍은 의미가 없다 — 붙박이 사이드바가 이미 거기 있다 */
  const drawerOpen = mobileOpen && !wide;

  const def = MODE_BY_KEY[mode];
  const mine = restore && restore.mode === mode ? restore : null;

  return (
    <div className="app-shell h-dvh flex overflow-hidden relative">
      <div
        className={`mesh ${mode === "court" ? "court" : mode === "comfort" ? "comfort" : ""}`}
        aria-hidden
      >
        <i />
      </div>
      <div className="grain" aria-hidden />

      <Sidebar
        mode={mode}
        onMode={(m) => fresh(m)}
        /* 서랍으로 열렸을 때는 접힘 상태를 무시한다 — 좁은 화면에서 아이콘만 보여줄 이유가 없다 */
        collapsed={collapsed && !drawerOpen}
        onCollapse={setRail}
        mobileOpen={drawerOpen}
        onMobileClose={() => setMobileOpen(false)}
        sessions={sessions.list}
        activeId={activeId}
        onOpen={open}
        onRemove={sessions.remove}
        onNew={() => fresh()}
      />

      {/* 폰에서는 판이 화면에 꽉 찬다 — 여백보다 본문이 먼저다 */}
      <main className="relative z-10 flex-1 min-w-0 flex flex-col p-0 sm:p-2.5">
        <div className="flex-1 min-h-0 glass glass-lit sm:rounded-[22px] flex flex-col overflow-hidden">
          {/* ── 머리 ─────────────────────────────────────── */}
          <header className="shrink-0 h-[52px] px-2 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b border-line-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
              className="lg:hidden grid w-[38px] h-[38px] place-items-center rounded-[10px] text-t2 hover:text-t1 active:bg-white/[.09] transition-colors shrink-0"
            >
              <IconPanel />
            </button>

            <span
              className="grid place-items-center w-[26px] h-[26px] rounded-[8px] shrink-0 nm"
              style={{ color: def.accent }}
            >
              <def.icon size={15} />
            </span>
            <span className="min-w-0 flex items-baseline gap-2">
              <h1 className="text-[14px] font-bold tracking-[-0.02em] text-t1 shrink-0">
                {def.label}
              </h1>
              <span className="hidden sm:block text-[11.5px] text-t4 truncate">{def.hint}</span>
            </span>

            <span className="flex-1" />

            <button
              type="button"
              onClick={() => setPalette(true)}
              className="hidden sm:flex items-center gap-2 h-[30px] pl-2.5 pr-2 rounded-[10px] btn text-t3 hover:text-t2"
              aria-label="빠른 이동"
            >
              <IconSearch size={14} />
              <kbd className="font-mono text-[10px] leading-none">⌘K</kbd>
            </button>
          </header>

          {/* ── 몸 ───────────────────────────────────────── */}
          <div className="flex-1 min-h-0">
            {mode === "inbiz" ? (
              <Inbiz
                key={`inbiz-${seed}`}
                persist={sessions.persist}
                restore={mine}
                onSession={setActiveId}
              />
            ) : mode === "court" ? (
              <Court
                key={`court-${seed}`}
                persist={sessions.persist}
                restore={mine}
                onSession={setActiveId}
              />
            ) : mode === "comfort" ? (
              <Comfort
                key={`comfort-${seed}`}
                persist={sessions.persist}
                restore={mine}
                onSession={setActiveId}
              />
            ) : (
              <Debate
                key={`${mode}-${seed}`}
                stance={mode}
                wide={wide}
                persist={sessions.persist}
                restore={mine}
                onSession={setActiveId}
              />
            )}
          </div>
        </div>
      </main>

      {/* 열 때마다 새로 마운트한다 — 지난 검색어가 남아 있으면 방해가 된다 */}
      <CommandPalette
        key={palette ? "palette-on" : "palette-off"}
        open={palette}
        onClose={() => setPalette(false)}
        mode={mode}
        onMode={(m) => fresh(m)}
        onNew={() => fresh()}
        onOpen={open}
        sessions={sessions.list}
      />
    </div>
  );
}

/* ── 판정 · 레드팀 — 같은 엔진, 다른 태도 ────────────────── */

interface DebateSnapshot {
  tabs: string[];
  turns: Turn[];
}

function Debate({
  stance,
  wide,
  persist,
  restore,
  onSession,
}: {
  stance: "judge" | "redteam";
  wide: boolean;
  persist: (p: PersistInput) => void;
  restore: StoredSession | null;
  onSession: (id: string) => void;
}) {
  const t = useTabs(stance);
  const [active, setActive] = useState(t.tabs[0] ?? "");
  const scroller = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(restore?.id ?? null);
  const booted = useRef(false);

  const red = stance === "redteam";
  // 넓은 화면에서 AI가 둘 이상이면 그냥 나란히 놓는다
  const compare = wide && t.tabs.length > 1;
  const activeTab = t.tabs.includes(active) ? active : (t.tabs[0] ?? "");

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (restore?.data) t.load(restore.data as DebateSnapshot);
  }, [restore, t]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [t.turns.length]);

  /* 저장은 턴 수와 진행 여부로만 건다 — 델타마다 저장하면 화면이 멎는다.
     최신 값은 따로 담아 두고, 저장 자체는 턴이 늘어날 때만 돈다. */
  const snapRef = useRef<DebateSnapshot>({ tabs: [], turns: [] });
  useEffect(() => {
    snapRef.current = { tabs: t.tabs, turns: t.turns };
  }, [t.tabs, t.turns]);

  useEffect(() => {
    const id = idRef.current;
    const snap = snapRef.current;
    if (!id || !snap.turns.length) return;
    const first = snap.turns.find((x) => x.kind === "user");
    persist({
      id,
      mode: stance,
      title: first && first.kind === "user" ? first.text : "새 대화",
      subtitle: `${snap.tabs.length}개 AI · ${snap.turns.filter((x) => x.kind === "user").length}개 질문`,
      data: snap,
    });
  }, [t.turns.length, t.busy, persist, stance]);

  const ask = useCallback(
    (text: string, targets: string[]) => {
      if (!idRef.current) {
        idRef.current = newId();
        onSession(idRef.current);
      }
      t.ask(text, targets);
    },
    [onSession, t],
  );

  const reset = useCallback(() => {
    idRef.current = null;
    t.reset();
  }, [t]);

  const empty = t.turns.length === 0;
  const cols = t.tabs.length;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 px-3 sm:px-5 pt-2 pb-1.5 sm:pt-2.5 sm:pb-2 flex items-center gap-2">
        <span className="text-[11.5px] text-t3 truncate">
          {red ? "심사역 AI들이 약점만 찾습니다" : "AI들이 각자 답하고 서로 반박합니다"}
        </span>
        <span className="flex-1" />
        {!empty && (
          <button
            type="button"
            onClick={reset}
            className="h-[34px] sm:h-[28px] px-3 sm:px-2.5 rounded-[9px] text-[12.5px] font-medium text-t2 hover:text-t1 active:bg-white/[.09] sm:hover:bg-white/[.07] transition-colors shrink-0"
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
        className="flex-1 min-h-0 overflow-auto scroll-y border-t border-line-2"
      >
        <div style={{ minWidth: compare ? Math.max(0, cols * 250) : undefined }}>
          {empty ? (
            <Empty red={red} tabs={t.tabs} onPick={(q) => ask(q, t.tabs)} />
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

      <div className="shrink-0 px-3 sm:px-5 pt-2.5 pb-3 border-t border-line-2">
        <div className="mx-auto w-full max-w-[900px]">
          {t.hasAnswers && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-bar">
              <button
                type="button"
                onClick={t.debateRound}
                disabled={t.busy || t.tabs.length < 2}
                className="nm-btn shrink-0 h-[36px] sm:h-[30px] px-3.5 sm:px-3 rounded-[11px] sm:rounded-[10px] text-[12.5px] font-semibold text-t1"
              >
                {red ? "교차 검증" : "서로 반박시키기"}
              </button>
              <button
                type="button"
                onClick={() => t.synthesize()}
                disabled={t.busy}
                className="nm-btn shrink-0 h-[36px] sm:h-[30px] px-3.5 sm:px-3 rounded-[11px] sm:rounded-[10px] text-[12.5px] font-semibold text-t1"
              >
                {red ? "사망 진단서" : "정리하기"}
              </button>
            </div>
          )}

          <Composer tabs={t.tabs} busy={t.busy} onSend={ask} onStop={t.stop} />

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
        <h2 className="text-[22px] sm:text-[27px] font-bold tracking-[-0.04em] text-t1 leading-[1.34]">
          {red ? "이 사업이 어디서 죽는지 찾습니다" : "질문 하나, 탭 여러 개"}
        </h2>
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
              className="rise btn sheen w-full text-left px-3.5 py-3 text-[13.5px] leading-[1.55] text-t2 hover:text-t1"
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
