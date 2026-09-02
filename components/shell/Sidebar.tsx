"use client";

import Image from "next/image";
import { useMemo } from "react";
import { IconClose, IconPanel, IconPlus, IconTrash } from "./icons";
import { MODES, type Mode } from "./modes";
import { GROUP_ORDER, groupOf, whenLabel, type StoredSession } from "@/lib/sessions";

const NAV_STRIDE = 44; /* 항목 40 + 간격 4 — 표시등이 이 보폭으로 미끄러진다 */

export function Sidebar({
  mode,
  onMode,
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
  sessions,
  activeId,
  onOpen,
  onRemove,
  onNew,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  sessions: StoredSession[];
  activeId: string | null;
  onOpen: (s: StoredSession) => void;
  onRemove: (id: string) => void;
  onNew: () => void;
}) {
  const at = Math.max(0, MODES.findIndex((m) => m.key === mode));
  const accent = MODES[at]?.accent ?? "#9FC0FF";

  const groups = useMemo(() => {
    const by = new Map<string, StoredSession[]>();
    for (const s of sessions) {
      const g = groupOf(s.at);
      by.set(g, [...(by.get(g) ?? []), s]);
    }
    return GROUP_ORDER.filter((g) => by.has(g)).map((g) => [g, by.get(g) as StoredSession[]] as const);
  }, [sessions]);

  return (
    <>
      {/* 좁은 화면에서 뒤를 덮는 판 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onMobileClose}
        className={`lg:hidden fixed inset-0 z-40 bg-black/55 transition-opacity duration-500 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backdropFilter: "blur(3px)" }}
      />

      <aside
        aria-label="사이드바"
        className={`
          safe-drawer z-50 shrink-0 flex flex-col
          fixed inset-y-0 left-0 w-[278px] p-2.5 transition-transform duration-[520ms]
          lg:static lg:w-auto lg:translate-x-0 lg:p-0 lg:py-2.5 lg:pl-2.5
          ${mobileOpen ? "translate-x-0" : "-translate-x-[102%]"}
        `}
        style={{ transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
      >
        {/* 서랍일 때는 폭을 화면이 정하고, 붙박이일 때만 접힘 폭을 쓴다 */}
        <div
          className="glass-3 glass-lit rounded-[20px] h-full flex flex-col overflow-hidden w-full lg:w-[var(--rail-w)] transition-[width] duration-[520ms]"
          style={
            {
              "--rail-w": collapsed ? "66px" : "262px",
              transitionTimingFunction: "cubic-bezier(.16,1,.3,1)",
            } as React.CSSProperties
          }
        >
          {/* ── 상단 — 상표와 접기 ─────────────────────────── */}
          <div className={`shrink-0 flex items-center h-[52px] ${collapsed ? "justify-center" : "pl-3 pr-2"}`}>
            <span className="inline-flex items-center gap-2.5 min-w-0 select-none">
              <span
                className="grid place-items-center rounded-[9px] overflow-hidden shrink-0"
                style={{
                  width: 26,
                  height: 26,
                  boxShadow: "0 1px 0 rgba(255,255,255,.5) inset, 0 6px 14px -8px rgba(0,0,0,.6)",
                }}
              >
                <Image src="/logo.png" alt="" width={26} height={26} priority className="block" />
              </span>
              {!collapsed && (
                <span className="min-w-0 flex items-baseline gap-1.5">
                  <span className="text-[14.5px] font-bold tracking-[-0.03em] text-t1">멀티탭</span>
                  <span className="text-[9.5px] font-semibold tracking-[0.1em] text-t4 uppercase">
                    beta
                  </span>
                </span>
              )}
            </span>

            {!collapsed && (
              <>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => onCollapse(true)}
                  aria-label="사이드바 접기"
                  className="hidden lg:grid w-[28px] h-[28px] place-items-center rounded-[8px] text-t3 hover:text-t1 hover:bg-white/[.07] transition-colors"
                >
                  <IconPanel />
                </button>
                <button
                  type="button"
                  onClick={onMobileClose}
                  aria-label="메뉴 닫기"
                  className="lg:hidden grid w-[38px] h-[38px] place-items-center rounded-[10px] text-t3 hover:text-t1 active:bg-white/[.09] transition-colors"
                >
                  <IconClose />
                </button>
              </>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={() => onCollapse(false)}
              aria-label="사이드바 펼치기"
              className="hidden lg:grid mx-auto mb-1 w-[30px] h-[30px] place-items-center rounded-[9px] text-t3 hover:text-t1 hover:bg-white/[.07] transition-colors"
            >
              <IconPanel />
            </button>
          )}

          {/* ── 새로 시작 ──────────────────────────────────── */}
          <div className={`shrink-0 ${collapsed ? "px-2" : "px-2.5"} pb-2.5`}>
            <button
              type="button"
              onClick={onNew}
              className={`sheen btn-solid w-full flex items-center justify-center gap-1.5 font-semibold ${
                collapsed ? "h-[38px] px-0" : "h-[38px] px-3 text-[13px]"
              }`}
              title="새로 시작"
            >
              <IconPlus size={collapsed ? 17 : 15} />
              {!collapsed && <span>새로 시작</span>}
            </button>
          </div>

          {/* ── 모드 ───────────────────────────────────────── */}
          <nav className={`shrink-0 relative ${collapsed ? "px-2" : "px-2.5"}`} aria-label="모드">
            <span
              aria-hidden
              className="absolute left-2.5 right-2.5 h-[40px] rounded-[11px] transition-transform duration-[560ms] nm-in"
              style={{
                transform: `translateY(${at * NAV_STRIDE}px)`,
                transitionTimingFunction: "cubic-bezier(.16,1,.3,1)",
                left: collapsed ? 8 : 10,
                right: collapsed ? 8 : 10,
              }}
            />
            <span
              aria-hidden
              className="absolute w-[3px] h-[16px] rounded-full transition-all duration-[560ms]"
              style={{
                left: collapsed ? 3 : 4,
                top: 12,
                transform: `translateY(${at * NAV_STRIDE}px)`,
                background: accent,
                boxShadow: `0 0 10px ${accent}`,
                transitionTimingFunction: "cubic-bezier(.16,1,.3,1)",
              }}
            />
            {MODES.map((m) => {
              const on = m.key === mode;
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onMode(m.key)}
                  aria-current={on ? "page" : undefined}
                  title={collapsed ? `${m.label} — ${m.hint}` : m.hint}
                  className={`relative z-10 w-full h-[40px] mb-1 rounded-[11px] flex items-center transition-colors duration-300 ${
                    collapsed ? "justify-center" : "px-2.5 gap-2.5"
                  } ${on ? "text-t1" : "text-t3 hover:text-t2"}`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && (
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[13px] font-semibold leading-[1.2] truncate">
                        {m.label}
                      </span>
                      <span
                        className={`block text-[10.5px] leading-[1.35] truncate transition-colors duration-300 ${
                          on ? "text-t3" : "text-t4"
                        }`}
                      >
                        {m.hint}
                      </span>
                    </span>
                  )}
                  {on && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-[11px] pointer-events-none"
                      style={{ boxShadow: `inset 0 0 0 1px ${accent}22` }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── 기록 ───────────────────────────────────────── */}
          {!collapsed && (
            <div className="flex-1 min-h-0 mt-2 flex flex-col">
              <div className="shrink-0 px-4 pb-1.5 flex items-center">
                <span className="text-[10.5px] font-semibold tracking-[0.12em] text-t4 uppercase">
                  기록
                </span>
                <span className="flex-1" />
                {sessions.length > 0 && (
                  <span className="font-mono text-[10px] text-t4">{sessions.length}</span>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scroll-y px-2 pb-2">
                {sessions.length === 0 ? (
                  <p className="px-2 py-3 text-[11.5px] leading-[1.6] text-t4">
                    아직 없습니다. 무엇이든 한 번 돌리면 여기 쌓이고, 눌러서 그대로 다시 엽니다.
                  </p>
                ) : (
                  groups.map(([label, items]) => (
                    <div key={label} className="mb-2">
                      <p className="px-2 py-1 text-[10px] font-medium text-t4">{label}</p>
                      {items.map((s) => (
                        <SessionRow
                          key={s.id}
                          s={s}
                          active={s.id === activeId}
                          onOpen={() => onOpen(s)}
                          onRemove={() => onRemove(s.id)}
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {collapsed && <div className="flex-1" />}

          {/* ── 바닥 ───────────────────────────────────────── */}
          <div className={`shrink-0 border-t border-line-2 ${collapsed ? "p-2" : "p-2.5"}`}>
            {collapsed ? (
              <div className="grid place-items-center h-[26px]">
                <span className="w-[6px] h-[6px] rounded-full bg-ok/70" title="모의 응답으로도 전부 동작합니다" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-1">
                <span className="w-[6px] h-[6px] rounded-full bg-ok/70 shrink-0" />
                <span className="text-[10.5px] text-t4 leading-[1.4] min-w-0 flex-1">
                  키가 없어도 전부 동작합니다
                </span>
                <kbd className="font-mono text-[9.5px] text-t4 border border-line-2 rounded-[5px] px-1.5 py-0.5">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function SessionRow({
  s,
  active,
  onOpen,
  onRemove,
}: {
  s: StoredSession;
  active: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const m = MODES.find((x) => x.key === s.mode);
  return (
    <div
      className={`group relative rounded-[10px] transition-colors duration-300 ${
        active ? "bg-white/[.07]" : "hover:bg-white/[.045]"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${s.title} — ${m?.label ?? s.mode} 기록 열기`}
        title={s.title}
        className="w-full text-left pl-2.5 pr-10 lg:pr-8 py-2 lg:py-[7px] min-w-0 block"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-[5px] h-[5px] rounded-full shrink-0"
            style={{ background: m?.accent ?? "#9FC0FF", opacity: active ? 1 : 0.65 }}
          />
          <span
            className={`text-[12.5px] leading-[1.35] truncate ${
              active ? "text-t1 font-medium" : "text-t2"
            }`}
          >
            {s.title || "제목 없음"}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 pl-[11px] min-w-0">
          <span className="text-[10.5px] text-t4 truncate">{s.subtitle}</span>
          <span className="ml-auto shrink-0 font-mono text-[9.5px] text-t4">
            {whenLabel(s.at)}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label="기록 지우기"
        className="absolute right-1 top-1/2 -translate-y-1/2 w-[32px] h-[32px] lg:w-[22px] lg:h-[22px] grid place-items-center rounded-[8px] lg:rounded-[6px] text-t4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 hover:text-bad active:bg-white/[.1] lg:hover:bg-white/[.08] transition-all"
      >
        <IconTrash size={13} />
      </button>
    </div>
  );
}
