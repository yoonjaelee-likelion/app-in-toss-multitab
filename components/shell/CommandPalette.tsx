"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconPlus, IconSearch } from "./icons";
import { MODES, MODE_BY_KEY, type Mode } from "./modes";
import { whenLabel, type StoredSession } from "@/lib/sessions";

interface Item {
  id: string;
  group: string;
  label: string;
  hint: string;
  accent: string;
  run: () => void;
}

/** ⌘K — 모드로 가거나, 지난 기록을 열거나, 새로 시작하거나. 셋뿐이다. */
export function CommandPalette({
  open,
  onClose,
  onMode,
  onNew,
  onOpen,
  sessions,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onMode: (m: Mode) => void;
  onNew: () => void;
  onOpen: (s: StoredSession) => void;
  sessions: StoredSession[];
  mode: Mode;
}) {
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [
      {
        id: "new",
        group: "동작",
        label: `${MODE_BY_KEY[mode].newLabel} 시작`,
        hint: "지금 화면을 비우고 처음부터",
        accent: MODE_BY_KEY[mode].accent,
        run: onNew,
      },
      ...MODES.map((m) => ({
        id: `mode-${m.key}`,
        group: "이동",
        label: m.label,
        hint: m.hint,
        accent: m.accent,
        run: () => onMode(m.key),
      })),
      ...sessions.map((s) => ({
        id: `s-${s.id}`,
        group: "기록",
        label: s.title || "제목 없음",
        hint: `${MODE_BY_KEY[s.mode]?.label ?? s.mode} · ${s.subtitle} · ${whenLabel(s.at)}`,
        accent: MODE_BY_KEY[s.mode]?.accent ?? "#9FC0FF",
        run: () => onOpen(s),
      })),
    ];
    const k = q.trim().toLowerCase();
    if (!k) return out;
    return out.filter(
      (i) => i.label.toLowerCase().includes(k) || i.hint.toLowerCase().includes(k),
    );
  }, [mode, onMode, onNew, onOpen, q, sessions]);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setAt((n) => Math.min(items.length - 1, n + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAt((n) => Math.max(0, n - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const it = items[at];
        if (it) {
          it.run();
          onClose();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [at, items, onClose, open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-at="${at}"]`)?.scrollIntoView({
      block: "nearest",
    });
  }, [at]);

  if (!open) return null;

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
        style={{ backdropFilter: "blur(5px)" }}
      />

      <div className="relative w-full max-w-[560px] glass-3 glass-lit rounded-[18px] overflow-hidden rise">
        <div className="flex items-center gap-2.5 px-4 h-[52px] border-b border-line-2">
          <IconSearch size={16} className="text-t3 shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAt(0);
            }}
            placeholder="어디로 갈까요"
            aria-label="명령 검색"
            className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] text-t1 placeholder:text-t4"
          />
          <kbd className="font-mono text-[10px] text-t4 border border-line-2 rounded-[5px] px-1.5 py-0.5 shrink-0">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto scroll-y p-1.5">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-t4">찾는 게 없습니다</p>
          )}
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <div key={it.id}>
                {head && (
                  <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-t4 uppercase">
                    {head}
                  </p>
                )}
                <button
                  type="button"
                  data-at={i}
                  onMouseEnter={() => setAt(i)}
                  onClick={() => {
                    it.run();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-left transition-colors ${
                    i === at ? "bg-white/[.08]" : ""
                  }`}
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ background: it.accent }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-t1 truncate">
                      {it.label}
                    </span>
                    <span className="block text-[11px] text-t3 truncate">{it.hint}</span>
                  </span>
                  {it.id === "new" && <IconPlus size={14} className="text-t4 shrink-0" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
