"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 브라우저에만 있는 참·거짓 하나. 사이드바 접힘 같은 것.
 *
 * 효과 안에서 상태를 세우면 첫 프레임이 한 번 튄다. 구독으로 읽으면
 * 서버는 기본값, 클라이언트는 저장된 값을 각자 정확하게 그린다.
 */
const listeners = new Set<() => void>();
/** 저장소가 막혀 있어도 이번 세션 동안은 동작해야 한다 */
const mem = new Map<string, boolean>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function useStoredFlag(key: string): [boolean, (v: boolean) => void] {
  const get = useCallback(() => {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch {
      return mem.get(key) ?? false;
    }
  }, [key]);

  const value = useSyncExternalStore(subscribe, get, () => false);

  const set = useCallback(
    (v: boolean) => {
      mem.set(key, v);
      try {
        window.localStorage.setItem(key, v ? "1" : "0");
      } catch {
        /* 저장소가 막혀 있으면 이번 세션에만 적용된다 */
      }
      for (const fn of listeners) fn();
    },
    [key],
  );

  return [value, set];
}
