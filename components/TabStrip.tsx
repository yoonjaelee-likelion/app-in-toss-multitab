"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TABS, MODELS, MODEL_BY_ID } from "@/lib/models";

/**
 * 탭 스트립. 브라우저 창 구조를 그대로 가져왔다 —
 * 활성 탭만 아래 흰 표면과 이어 붙고, 응답 중인 탭 밑으로는 로딩 선이 지나간다.
 */
export function TabStrip({
  tabs,
  active,
  merged,
  loading,
  onSelect,
  onClose,
  onOpen,
}: {
  tabs: string[];
  active: string;
  /** 비교 보기 — 모든 탭이 한 덩어리로 붙는다 */
  merged: boolean;
  loading: Set<string>;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const rest = MODELS.filter((m) => !tabs.includes(m.id));
  const full = tabs.length >= MAX_TABS;

  useEffect(() => {
    if (!menu) return;
    const down = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMenu(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);

  return (
    <div ref={wrap} className="relative bg-chrome border-b border-line">
      <div
        className="flex items-end gap-[2px] px-2 pt-2 overflow-x-auto no-bar"
        role="tablist"
        aria-label="열린 AI 탭"
      >
        {tabs.map((id) => {
          const m = MODEL_BY_ID[id];
          if (!m) return null;
          const on = merged || id === active;
          const busy = loading.has(id);
          return (
            <div
              key={id}
              className={`relative shrink-0 group flex items-center h-[36px] rounded-t-[9px] transition-colors ${
                on ? "tab-active tab-seam" : "hover:bg-black/[.045]"
              }`}
              style={{ maxWidth: 190 }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onSelect(id)}
                className="flex items-center gap-2 h-full pl-3 pr-1.5 min-w-0"
              >
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ background: m.color, opacity: on ? 1 : 0.6 }}
                />
                <span
                  className={`text-[13px] truncate ${
                    on ? "text-t1 font-semibold" : "text-t2 font-medium"
                  }`}
                >
                  {m.short}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onClose(id)}
                aria-label={`${m.name} 탭 닫기`}
                className={`shrink-0 mr-1.5 w-[19px] h-[19px] rounded-[5px] grid place-items-center text-t3 hover:text-t1 hover:bg-black/[.07] transition-all ${
                  on ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                }`}
              >
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
                  <path
                    d="M1 1l8 8M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {busy && (
                <span
                  className="tab-load absolute inset-x-0 bottom-0 h-[2px] overflow-hidden rounded-full"
                  style={{ color: m.color }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          disabled={full}
          aria-label="AI 탭 추가"
          aria-expanded={menu}
          className="shrink-0 mb-[3px] ml-0.5 w-[28px] h-[28px] rounded-[7px] grid place-items-center text-t2 hover:text-t1 hover:bg-black/[.06] disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <span className="shrink-0 w-2" />
      </div>

      {menu && (
        <div className="absolute left-2 top-full mt-1.5 z-40 w-[288px] fade-up">
          <div className="bg-surface border border-line rounded-[11px] shadow-[0_12px_28px_-12px_rgba(22,24,29,.28),0_2px_6px_-2px_rgba(22,24,29,.1)] p-1.5">
            <p className="px-2.5 py-1.5 text-[11.5px] text-t3">
              탭 추가 · {tabs.length}/{MAX_TABS} 열림
            </p>
            {rest.length === 0 ? (
              <p className="px-2.5 py-2.5 text-[13px] text-t2">모든 AI가 이미 열려 있습니다.</p>
            ) : (
              rest.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onOpen(m.id);
                    setMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] hover:bg-black/[.045] text-left transition-colors"
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-t1 truncate">{m.name}</span>
                    <span className="block text-[11.5px] text-t3 truncate">
                      {m.maker} · {m.note}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
