/**
 * 왼쪽 목록에 쌓이는 기록.
 *
 * 서버가 없으니 브라우저에 둔다. 목록만 남기고 내용은 안 남기면
 * 눌러도 아무 일이 없는 목록이 되므로, 각 모드가 자기 상태를 통째로
 * 스냅샷으로 넘긴다. 다시 누르면 그 화면이 그대로 돌아온다.
 */

export type SessionMode = "inbiz" | "judge" | "redteam" | "court" | "comfort";

export interface SessionMeta {
  id: string;
  mode: SessionMode;
  /** 목록에 굵게 보이는 줄 */
  title: string;
  /** 그 아래 흐리게 보이는 줄 */
  subtitle: string;
  at: number;
}

export interface StoredSession extends SessionMeta {
  data: unknown;
}

const KEY = "multitab.sessions.v1";
const MAX = 24;

export function loadSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && typeof s.id === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveSessions(list: StoredSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* 용량이 찼으면 조용히 포기한다 — 기록 때문에 앱이 죽으면 안 된다 */
  }
}

/** 같은 날이면 시각만, 아니면 날짜만 */
export function whenLabel(at: number): string {
  const d = new Date(at);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "어제";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 오늘 · 어제 · 지난 7일 · 이전 */
export function groupOf(at: number): string {
  const day = 86_400_000;
  const diff = Date.now() - at;
  if (diff < day && new Date(at).getDate() === new Date().getDate()) return "오늘";
  if (diff < 2 * day) return "어제";
  if (diff < 7 * day) return "지난 7일";
  return "이전";
}

export const GROUP_ORDER = ["오늘", "어제", "지난 7일", "이전"];
