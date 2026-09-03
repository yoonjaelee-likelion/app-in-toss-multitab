"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TABS, MODELS, MODEL_BY_ID } from "@/lib/models";
import { useCopy } from "@/lib/i18n";

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
  trailing,
}: {
  tabs: string[];
  active: string;
  /** 비교 보기 — 전부 활성으로 본다 */
  merged: boolean;
  loading: Set<string>;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onOpen: (id: string) => void;
  /** + 옆에 같이 서는 것 — 줄 하나를 더 쓰지 않으려고 여기에 받는다 */
  trailing?: React.ReactNode;
}) {
  const t = useCopy();
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
    <div ref={wrap} className="relative shrink-0 flex items-center gap-1.5 px-3 sm:px-5 pb-2.5">
      {/* 탭만 흐르고 + 는 자리에 남는다 — 좁은 화면에서 밀려 나가면 못 찾는다 */}
      {/* 오른쪽 끝을 흐린다 — 잘린 게 아니라 더 있다는 뜻이 되어야 한다 */}
      <div
        className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-bar fade-r"
        role="tablist"
        aria-label={t.tabs.openList}
      >
        {tabs.map((id) => {
          const m = MODEL_BY_ID[id];
          if (!m) return null;
          const on = merged || id === active;
          const busy = loading.has(id);
          return (
            <div
              key={id}
              /* 열린 탭은 자기 색을 아주 옅게 머금는다 — 이름을 읽기 전에 색으로 먼저 안다 */
              className={`relative shrink-0 group flex items-center h-[38px] sm:h-[33px] rounded-full overflow-hidden transition-all duration-300 ${
                on ? "glass" : "glass-2 opacity-65 hover:opacity-100"
              }`}
              style={{
                maxWidth: 180,
                borderColor: on ? `${m.color}3d` : undefined,
                boxShadow: on
                  ? `inset 0 1px 0 var(--lip), 0 6px 16px -10px ${m.color}80`
                  : undefined,
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onSelect(id)}
                className="flex items-center gap-2 h-full pl-3 pr-1.5 min-w-0"
              >
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0 transition-shadow duration-300"
                  style={{
                    background: m.color,
                    boxShadow: on ? `0 0 0 3px ${m.color}26` : undefined,
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
                aria-label={t.tabs.close(m.name)}
                className={`shrink-0 mr-1 sm:mr-1.5 w-[26px] h-[26px] sm:w-[18px] sm:h-[18px] rounded-[7px] sm:rounded-[5px] grid place-items-center text-t3 hover:text-t1 press transition-all ${
                  on
                    ? "opacity-100"
                    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
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
        <span className="shrink-0 w-0.5" />
      </div>

      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        disabled={full}
        aria-label={t.tabs.add}
        aria-expanded={menu}
        className="shrink-0 w-[38px] h-[38px] sm:w-[33px] sm:h-[33px] rounded-full grid place-items-center glass-2 text-t2 hover:text-t1 press disabled:opacity-30 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {trailing}

      {menu && (
        <div className="absolute right-3 sm:right-5 top-full z-40 w-[min(290px,calc(100vw-24px))] rise">
          <div className="glass glass-lit rounded-[14px] p-1.5">
            <p className="px-2.5 py-1.5 text-[11.5px] text-t3">
              {t.tabs.openCount(tabs.length, MAX_TABS)}
            </p>
            {rest.length === 0 ? (
              <p className="px-2.5 py-2.5 text-[13px] text-t2">{t.tabs.allOpen}</p>
            ) : (
              rest.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onOpen(m.id);
                    setMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2.5 sm:py-2 rounded-[9px] press text-left transition-colors"
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
