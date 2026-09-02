"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  loadSessions,
  saveSessions,
  type SessionMode,
  type StoredSession,
} from "./sessions";

export interface PersistInput {
  id: string;
  mode: SessionMode;
  title: string;
  subtitle: string;
  data: unknown;
}

/**
 * 기록 목록.
 *
 * 스트리밍 도중에도 저장이 불릴 수 있어서 리액트 상태로 두면 저장 → 리렌더 →
 * 저장이 돌기 쉽다. 그래서 목록은 모듈 바깥에 한 벌만 두고 구독으로 읽는다.
 * 화면은 즉시 갱신하고, 디스크 쓰기만 뒤로 미룬다.
 */

let cache: StoredSession[] | null = null;
const EMPTY: StoredSession[] = [];
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function snapshot(): StoredSession[] {
  if (!cache) cache = loadSessions();
  return cache;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function commit(next: StoredSession[]) {
  cache = next;
  for (const fn of listeners) fn();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => saveSessions(next), 400);
}

export function useSessions() {
  const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY);

  const persist = useCallback((input: PersistInput) => {
    const prev = snapshot();
    const at = Date.now();
    const kept = prev.filter((s) => s.id !== input.id);
    const old = prev.find((s) => s.id === input.id);
    // 내용이 그대로면 목록을 흔들지 않는다 — 순서가 계속 튀는 걸 막는다
    if (old && old.title === input.title && old.subtitle === input.subtitle && kept.length === prev.length - 1) {
      if (JSON.stringify(old.data) === JSON.stringify(input.data)) return;
    }
    commit([{ ...input, at }, ...kept]);
  }, []);

  const remove = useCallback((id: string) => {
    commit(snapshot().filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(() => commit([]), []);

  return { list, persist, remove, clear };
}
