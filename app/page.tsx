"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Comfort } from "@/components/comfort/Comfort";
import { Composer } from "@/components/Composer";
import { Court } from "@/components/court/Court";
import { Inbiz } from "@/components/inbiz/Inbiz";
import { TabStrip } from "@/components/TabStrip";
import { Thread } from "@/components/Thread";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Sidebar } from "@/components/shell/Sidebar";
import { IconArrow, IconPanel, IconSearch } from "@/components/shell/icons";
import { useModeMap, type Mode } from "@/components/shell/modes";
import type { Stance } from "@/components/shell/StanceBar";
import { useCopy } from "@/lib/i18n";
import { newId, type Turn } from "@/lib/chat";
import { MODEL_BY_ID } from "@/lib/models";
import type { StoredSession } from "@/lib/sessions";
import { useSessions, type PersistInput } from "@/lib/useSessions";
import { useStoredFlag } from "@/lib/useStoredFlag";
import { useTabs } from "@/lib/useTabs";
import { useInbiz } from "@/lib/useInbiz";

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

  const t = useCopy();
  const MODE_BY_KEY = useModeMap();
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
      {/* 모드 이름이 그대로 배경의 온도가 된다 — 판정만 기본값을 쓴다 */}
      <div className={`mesh ${mode}`} aria-hidden>
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

      {/* 폰에서는 판이 화면에 꽉 찬다 — 여백보다 본문이 먼저다.
          넓어지면 여백을 준다 — 유리가 떠 있으려면 뒤에 빛이 보여야 한다. */}
      <main className="relative z-10 flex-1 min-w-0 flex flex-col p-0 sm:p-3 lg:py-4 lg:pr-4 lg:pl-3">
        <div className="sheet flex-1 min-h-0 glass-lit sm:rounded-[26px] flex flex-col overflow-hidden">
          {/* ── 머리 — 지금 어느 방에 있는지 한 줄. 그 이상은 두지 않는다 ── */}
          <header className="shrink-0 h-[54px] px-2 sm:px-5 flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t.shell.openMenu}
              className="lg:hidden grid w-[38px] h-[38px] place-items-center rounded-[11px] text-t2 press shrink-0"
            >
              <IconPanel />
            </button>

            <span
              className="grid place-items-center w-[7px] h-[7px] rounded-full shrink-0"
              style={{ background: def.accent, boxShadow: `0 0 0 3px ${def.accent}1f` }}
              aria-hidden
            />
            <span className="min-w-0 flex items-baseline gap-2.5">
              <h1 className="text-[14.5px] font-semibold tracking-[-0.025em] text-t1 shrink-0">
                {def.label}
              </h1>
              <span className="hidden sm:block text-[11.5px] text-t4 truncate">{def.hint}</span>
            </span>

            <span className="flex-1" />

            <button
              type="button"
              onClick={() => setPalette(true)}
              className="hidden sm:flex items-center gap-2 h-[31px] pl-3 pr-2.5 rounded-full btn text-t3 hover:text-t2"
              aria-label={t.shell.quickJump}
            >
              <IconSearch size={13.5} />
              <kbd className="font-mono text-[10px] leading-none">⌘K</kbd>
            </button>
          </header>

          {/* ── 몸 ───────────────────────────────────────── */}
          <div className="flex-1 min-h-0">
            {mode === "court" ? (
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
              /* 판정·레드팀·인비즈는 한 껍데기 안에 있다.
                 seed만 키에 넣는다 — 태도를 바꿨다고 하던 걸 버리면 안 된다. */
              <Ask
                key={`ask-${seed}`}
                stance={mode}
                onStance={setMode}
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

/**
 * 질문 — 판정·레드팀·인비즈가 한 껍데기 안에 있다.
 *
 * 셋은 결국 같은 동작이다. 한 줄 적고 AI들한테 던진다. 다른 건 태도뿐이라
 * 방을 옮길 일이 아니라 입력창 아래에서 고를 일이고, 그래서 입력창도 하나다.
 *
 * 엔진은 둘 다 여기서 들고 있는다. 태도를 바꿨다고 하던 걸 버리면
 * 그건 고르개가 아니라 그냥 다른 방이다 — 판정에서 쓰던 대화도,
 * 인비즈에서 돌던 진단도 돌아오면 그대로 있어야 한다.
 */
function Ask({
  stance,
  onStance,
  wide,
  persist,
  restore,
  onSession,
}: {
  stance: Stance;
  onStance: (s: Stance) => void;
  wide: boolean;
  persist: (p: PersistInput) => void;
  restore: StoredSession | null;
  onSession: (id: string) => void;
}) {
  const c = useCopy();
  const isInbiz = stance === "inbiz";
  /* 인비즈일 때도 판정 엔진을 살려 둔다 — 돌아왔을 때 대화가 남아 있어야 한다 */
  const t = useTabs(isInbiz ? "judge" : stance);
  const inbiz = useInbiz();
  /* 초안은 여기가 들고 있는다. 태도를 바꿔도 쓰던 글이 남는다 */
  const [draft, setDraft] = useState("");
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
    if (isInbiz) return;
    persist({
      id,
      mode: stance,
      title: first && first.kind === "user" ? first.text : c.debate.newChat,
      subtitle: c.debate.waiting(snap.tabs.length),
      data: snap,
    });
  }, [t.turns.length, t.busy, persist, stance, c, isInbiz]);

  /** 보내기 — 태도에 따라 어느 엔진으로 갈지만 갈린다 */
  const submit = useCallback(
    (raw?: string) => {
      const body = (raw ?? draft).trim();
      if (!body) return;
      setDraft("");
      if (isInbiz) {
        void inbiz.run(body);
        return;
      }
      if (!idRef.current) {
        idRef.current = newId();
        onSession(idRef.current);
      }
      t.ask(body, t.tabs);
    },
    [draft, inbiz, isInbiz, onSession, t],
  );

  const reset = useCallback(() => {
    idRef.current = null;
    t.reset();
  }, [t]);

  const empty = t.turns.length === 0;
  const cols = t.tabs.length;

  const busy = isInbiz ? inbiz.busy : t.busy;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* 탭은 판정·레드팀에만 있다 — 인비즈는 부서가 탭을 대신한다 */}
      {!isInbiz && (
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
        trailing={
          !empty && (
            <button
              type="button"
              onClick={reset}
              className="shrink-0 h-[38px] sm:h-[30px] px-3.5 sm:px-3 rounded-full text-[12.5px] font-medium text-t3 hover:text-t1 press"
            >
              {c.debate.newChat}
            </button>
          )
        }
      />
      )}

      {isInbiz ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <Inbiz
            engine={inbiz}
            persist={persist}
            restore={restore}
            onSession={onSession}
            onPick={(q) => submit(q)}
          />
        </div>
      ) : (
        <div
          ref={scroller}
          className={`flex-1 min-h-0 overflow-auto scroll-y ${empty ? "" : "border-t border-line-2"}`}
        >
          <div style={{ minWidth: compare ? Math.max(0, cols * 250) : undefined }}>
            {empty ? (
              <Empty red={red} tabs={t.tabs} onPick={(q) => submit(q)} />
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
      )}

      <div className="shrink-0 px-3 sm:px-5 pt-2.5 pb-3 border-t border-line-2">
        <div className="mx-auto w-full max-w-[900px]">
          {!isInbiz && t.hasAnswers && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-bar">
              <button
                type="button"
                onClick={t.debateRound}
                disabled={t.busy || t.tabs.length < 2}
                className="nm-btn shrink-0 h-[36px] sm:h-[30px] px-3.5 sm:px-3 rounded-[11px] sm:rounded-[10px] text-[12.5px] font-semibold text-t1"
              >
                {red ? c.debate.crossCheck : c.debate.rebut}
              </button>
              <button
                type="button"
                onClick={() => t.synthesize()}
                disabled={t.busy}
                className="nm-btn shrink-0 h-[36px] sm:h-[30px] px-3.5 sm:px-3 rounded-[11px] sm:rounded-[10px] text-[12.5px] font-semibold text-t1"
              >
                {red ? c.debate.deathCert : c.debate.synthesize}
              </button>
            </div>
          )}

          {/* 인비즈가 돌고 있을 때는 그만두는 버튼이 여기 하나뿐이다 */}
          <Composer
            stance={stance}
            onStance={onStance}
            tabs={t.tabs}
            busy={busy}
            text={draft}
            onText={setDraft}
            onSend={() => submit()}
            onStop={isInbiz ? inbiz.stop : t.stop}
          />

          {(isInbiz ? inbiz.mock : t.anyMock) && (
            <p className="mt-2 text-[11px] text-t4 text-center">
              {isInbiz ? c.inbiz.mockNote : c.debate.mockNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ red, tabs, onPick }: { red: boolean; tabs: string[]; onPick: (q: string) => void }) {
  const t = useCopy();
  const open = tabs.map((s) => MODEL_BY_ID[s]).filter(Boolean);
  const list = red ? t.debate.samplesRed : t.debate.samplesJudge;

  return (
    /* 가운데에 놓되, 자리가 모자라면 위에서부터 채운다.
       justify-center 하나만 쓰면 넘칠 때 머리가 잘려 나가 스크롤로도 못 올린다. */
    <div className="min-h-full flex flex-col px-5 sm:px-7">
      <span className="flex-1 min-h-[36px]" aria-hidden />
      <div className="mx-auto w-full max-w-[520px]">
        {/* 지금 무엇이 켜져 있는지 — 설명하지 않고 보여준다 */}
        <div className="rise flex justify-center">
          <span className="glass-2 inline-flex items-center gap-2 h-[32px] pl-2.5 pr-3.5 rounded-full">
            <span className="flex items-center -space-x-1">
              {open.map((m) => (
                <i
                  key={m.id}
                  title={m.name}
                  className="block w-[9px] h-[9px] rounded-full ring-[1.5px] ring-[var(--lip)]"
                  style={{ background: m.color }}
                />
              ))}
            </span>
            <span className="text-[11.5px] font-medium text-t2">
              {open.length > 0 ? t.debate.waiting(open.length) : t.debate.needTabs}
            </span>
          </span>
        </div>

        <div className="mt-6 text-center">
          <Greeting />
          <h2
            className="rise display whitespace-pre-line mt-2 text-[30px] sm:text-[38px]"
            style={{ animationDelay: "110ms" }}
          >
            {red ? t.debate.titleRed : t.debate.titleJudge}
          </h2>
          <p
            className="rise mt-3.5 text-[14px] leading-[1.8] text-t2 max-w-[34ch] mx-auto"
            style={{ animationDelay: "160ms" }}
          >
            {red ? t.debate.bodyRed : t.debate.bodyJudge}
          </p>
        </div>

        <div className="mt-8 space-y-2">
          {list.map((q, i) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              disabled={tabs.length === 0}
              className="group rise btn sheen w-full flex items-center gap-3 text-left px-4 py-3 rounded-[14px] text-[13.5px] leading-[1.55] text-t2 hover:text-t1"
              style={{ animationDelay: `${220 + i * 80}ms` }}
            >
              <span className="min-w-0 flex-1">{q}</span>
              {/* 누르면 어떻게 되는지 손을 올렸을 때만 말한다 */}
              <span
                aria-hidden
                className="shrink-0 text-accent opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
              >
                <IconArrow size={15} />
              </span>
            </button>
          ))}
        </div>
      </div>
      <span className="flex-1 min-h-[36px]" aria-hidden />
    </div>
  );
}

/** 시간에 맞춰 한 마디. 이름은 모르니 시간만 안다.
    서버 시간이 아니라 보는 사람의 시간이어야 한다 — 서버에서 미리 정하면
    시차만큼 틀린 인사를 하게 되므로, 서버에서는 비우고 브라우저에서만 읽는다. */
const NO_SUB = () => () => {};
const NO_HOUR = () => -1;
const hourNow = () => new Date().getHours();

function Greeting() {
  const t = useCopy();
  const h = useSyncExternalStore(NO_SUB, hourNow, NO_HOUR);
  const line =
    h < 0
      ? "" /* 서버에서는 아직 모른다 */
      : h < 5
        ? t.greet.night
        : h < 11
          ? t.greet.morning
          : h < 17
            ? t.greet.afternoon
            : h < 22
              ? t.greet.evening
              : t.greet.lateNight;

  // 정해지기 전에도 자리는 잡아 둔다 — 글자가 늦게 튀어나오면 그게 더 거슬린다
  return (
    <p className="rise text-[13px] text-t3 h-[19px]" style={{ animationDelay: "60ms" }}>
      {line}
    </p>
  );
}
