"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TABS, MODELS, MODEL_BY_ID } from "@/lib/models";

/**
 * 열려 있는 AI 목록. 유리 알약으로 놓고, 활성 탭만 빛이 걸린다.
 * 응답 중인 탭 밑으로는 그 모델 색의 선이 지나간다.
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
  /** 비교 보기 — 전부 활성으로 본다 */
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
    <div ref={wrap} className="relative shrink-0">
      <div
        className="flex items-center gap-1.5 px-3 sm:px-5 pb-2.5 overflow-x-auto no-bar"
        role="tablist"
        aria-label="열린 AI"
      >
        {tabs.map((id) => {
          const m = MODEL_BY_ID[id];
          if (!m) return null;
          const on = merged || id === active;
          const busy = loading.has(id);
          return (
            <div
              key={id}
              className={`relative shrink-0 group flex items-center h-[32px] rounded-[10px] overflow-hidden transition-colors ${
                on ? "glass" : "glass-2 opacity-70 hover:opacity-100"
              }`}
              style={{ maxWidth: 180, borderColor: on ? `${m.color}44` : undefined }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onSelect(id)}
                className="flex items-center gap-2 h-full pl-2.5 pr-1.5 min-w-0"
              >
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{
                    background: m.color,
                    boxShadow: on ? `0 0 8px ${m.color}` : undefined,
                  }}
                />
                <span
                  className={`text-[12.5px] truncate ${
                    on ? "text-t1 font-semibold" : "text-t2 font-medium"
                  }`}
                >
                  {m.short}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onClose(id)}
                aria-label={`${m.name} 닫기`}
                className={`shrink-0 mr-1.5 w-[18px] h-[18px] rounded-[5px] grid place-items-center text-t3 hover:text-t1 hover:bg-white/10 transition-all ${
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
                  className="tab-load absolute inset-x-0 bottom-0 h-[2px] overflow-hidden"
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
          aria-label="AI 추가"
          aria-expanded={menu}
          className="shrink-0 w-[30px] h-[30px] rounded-[9px] grid place-items-center glass-2 text-t2 hover:text-t1 hover:bg-white/[.07] disabled:opacity-30 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M7 1.5v11M1.5 7h11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <span className="shrink-0 w-1" />
      </div>

      {menu && (
        <div className="absolute left-3 sm:left-5 top-full z-40 w-[290px] rise">
          <div className="glass glass-lit rounded-[14px] p-1.5">
            <p className="px-2.5 py-1.5 text-[11.5px] text-t3">
              AI 추가 · {tabs.length}/{MAX_TABS} 열림
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
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-white/[.07] text-left transition-colors"
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
