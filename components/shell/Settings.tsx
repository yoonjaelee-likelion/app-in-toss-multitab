"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck, IconGear } from "./icons";
import { useCopy } from "@/lib/i18n";
import { useSettings, type Lang, type Theme } from "@/lib/settings";

/**
 * 설정 — 사이드바 바닥에서 위로 열린다.
 *
 * 고를 게 두 가지뿐이라 페이지를 따로 두지 않았다. 페이지로 보내면
 * 돌아오는 길을 만들어야 하고, 그게 두 줄짜리 설정에는 과하다.
 */
export function Settings({ collapsed }: { collapsed: boolean }) {
  const t = useCopy();
  const { lang, theme, setLang, setTheme } = useSettings();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const langs: { v: Lang; label: string }[] = [
    { v: "ko", label: "한국어" },
    { v: "en", label: "English" },
  ];
  const themes: { v: Theme; label: string }[] = [
    { v: "light", label: t.settings.light },
    { v: "dark", label: t.settings.dark },
    { v: "system", label: t.settings.system },
  ];

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.settings.title}
        aria-expanded={open}
        title={t.settings.title}
        className={`press w-full flex items-center rounded-[11px] text-t3 hover:text-t1 ${
          collapsed ? "h-[36px] justify-center" : "h-[36px] gap-2.5 px-2.5"
        }`}
      >
        <IconGear size={16} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="text-[12.5px] font-medium">{t.settings.title}</span>
            <span className="flex-1" />
            <span className="text-[11px] text-t4 truncate">
              {lang === "ko" ? "한국어" : "English"}
            </span>
          </>
        )}
      </button>

      {open && (
        /* 바닥에서 위로 — 사이드바 맨 아래라서 아래로는 열 자리가 없다 */
        <div
          className={`absolute z-50 bottom-[calc(100%+8px)] rise ${
            collapsed ? "left-0 w-[210px]" : "left-0 right-0"
          }`}
        >
          <div className="glass-modal glass-lit rounded-[16px] p-2.5">
            <Group label={t.settings.language}>
              {langs.map((o) => (
                <Row key={o.v} on={lang === o.v} onClick={() => setLang(o.v)}>
                  {o.label}
                </Row>
              ))}
            </Group>

            <span className="block my-2 h-px rule-2" aria-hidden />

            <Group label={t.settings.theme}>
              {themes.map((o) => (
                <Row key={o.v} on={theme === o.v} onClick={() => setTheme(o.v)}>
                  {o.label}
                </Row>
              ))}
            </Group>

            <p className="px-2 pt-2 text-[10.5px] leading-[1.5] text-t4">{t.settings.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-t4 uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`press w-full h-[34px] px-2 rounded-[9px] flex items-center gap-2 text-left text-[13px] ${
        on ? "text-t1 font-semibold" : "text-t2"
      }`}
    >
      <span className="flex-1 truncate">{children}</span>
      {on && <IconCheck size={14} className="shrink-0 text-accent" />}
    </button>
  );
}
