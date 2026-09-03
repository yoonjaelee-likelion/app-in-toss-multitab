"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * 설정 — 언어와 테마 두 가지뿐이다.
 *
 * 브라우저에만 남는다. 계정도 서버도 없다.
 * 테마는 <html data-theme>에 그대로 찍고, 언어는 <html lang>에 찍는다 —
 * CSS와 글꼴이 그걸 보고 알아서 따라온다.
 *
 * localStorage는 React 바깥의 저장소다. effect에서 읽어와 setState 하면
 * 렌더가 한 번 더 도는 데다 저장소가 진짜 주인이 아니게 된다. 그래서
 * 바깥 저장소를 그대로 구독한다 — 스냅샷은 캐시해서 같은 값이면 같은 참조를 준다.
 */

export type Lang = "ko" | "en";
export type Theme = "light" | "dark" | "system";

export const LANG_KEY = "multitab.lang";
export const THEME_KEY = "multitab.theme";

export interface Stored {
  lang: Lang;
  theme: Theme;
}

const DEFAULTS: Stored = { lang: "ko", theme: "system" };

const isLang = (v: unknown): v is Lang => v === "ko" || v === "en";
const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark" || v === "system";

/* ── 바깥 저장소 ───────────────────────────────────────────── */

const listeners = new Set<() => void>();
/** 같은 값이면 같은 객체를 돌려줘야 한다 — 매번 새로 만들면 렌더가 무한히 돈다 */
let cache: Stored = DEFAULTS;

function read(): Stored {
  try {
    const lang = window.localStorage.getItem(LANG_KEY);
    const theme = window.localStorage.getItem(THEME_KEY);
    return {
      lang: isLang(lang) ? lang : DEFAULTS.lang,
      theme: isTheme(theme) ? theme : DEFAULTS.theme,
    };
  } catch {
    /* 사생활 보호 모드 등으로 막혀 있어도 앱은 굴러가야 한다 */
    return DEFAULTS;
  }
}

function refresh() {
  const next = read();
  if (next.lang !== cache.lang || next.theme !== cache.theme) cache = next;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // 다른 탭에서 바꿔도 따라온다
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANG_KEY || e.key === THEME_KEY) {
      refresh();
      for (const l of listeners) l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Stored {
  refresh();
  return cache;
}

/** 서버에는 브라우저 저장소가 없다. 기본값으로 그리고 첫 페인트 전에 스크립트가 맞춘다 */
const getServerSnapshot = (): Stored => DEFAULTS;

function write(patch: Partial<Stored>) {
  try {
    if (patch.lang) window.localStorage.setItem(LANG_KEY, patch.lang);
    if (patch.theme) window.localStorage.setItem(THEME_KEY, patch.theme);
  } catch {
    /* 저장이 막혀 있어도 이번 세션은 굴러가야 한다 */
  }
  cache = { ...cache, ...patch };
  for (const l of listeners) l();
}

/* ── 컨텍스트 ─────────────────────────────────────────────── */

interface Settings extends Stored {
  /** system이면 지금 실제로 어느 쪽인지 */
  dark: boolean;
  setLang: (v: Lang) => void;
  setTheme: (v: Theme) => void;
}

const Ctx = createContext<Settings | null>(null);

/* 시스템이 밤인지도 바깥 상태다 — 같은 방식으로 구독한다 */
function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const systemDarkOnServer = () => false;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { lang, theme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const sysDark = useSyncExternalStore(subscribeSystem, systemDark, systemDarkOnServer);

  const dark = theme === "system" ? sysDark : theme === "dark";

  /* CSS와 글꼴이 볼 수 있게 문서 뿌리에 찍는다 — 여기가 바깥 시스템을 갱신하는 자리다 */
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = dark ? "dark" : "light";
    el.lang = lang;
  }, [dark, lang]);

  const setLang = useCallback((v: Lang) => write({ lang: v }), []);
  const setTheme = useCallback((v: Theme) => write({ theme: v }), []);

  const value = useMemo<Settings>(
    () => ({ lang, theme, dark, setLang, setTheme }),
    [lang, theme, dark, setLang, setTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): Settings {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSettings must be used inside <SettingsProvider>");
  return v;
}

/**
 * 첫 그림이 그려지기 전에 테마를 문서에 박아 넣는 조각.
 * 이게 없으면 저장된 값이 어두운데도 흰 화면이 한 번 번쩍인다.
 */
export const THEME_BOOT = `(function(){try{
var t=localStorage.getItem('${THEME_KEY}');
var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);
var e=document.documentElement;
e.dataset.theme=d?'dark':'light';
var l=localStorage.getItem('${LANG_KEY}');
if(l==='ko'||l==='en')e.lang=l;
}catch(_){}})()`;
