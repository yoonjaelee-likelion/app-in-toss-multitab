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

const DAY = 86_400_000;

/** 어제인가 — 날짜로 본다. 24시간이 아니라 달력이 기준이어야 한다 */
function isYesterday(d: Date, now: Date): boolean {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return (
    d.getFullYear() === y.getFullYear() &&
    d.getMonth() === y.getMonth() &&
    d.getDate() === y.getDate()
  );
}

/**
 * 기록에 붙는 시각과 묶음 이름.
 *
 * 말이 언어를 타므로 사전을 받아서 만든다. 훅은 Sidebar와 ⌘K 양쪽에서 쓴다.
 */
export function makeWhen(copy: {
  today: string;
  yesterday: string;
  week: string;
  older: string;
  monthDay: (m: number, d: number) => string;
}) {
  /** 같은 날이면 시각만, 아니면 날짜만 */
  const label = (at: number): string => {
    const d = new Date(at);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    if (isYesterday(d, now)) return copy.yesterday;
    return copy.monthDay(d.getMonth() + 1, d.getDate());
  };

  const groupOf = (at: number): string => {
    const now = new Date();
    const d = new Date(at);
    const diff = Date.now() - at;
    if (diff < DAY && d.getDate() === now.getDate()) return copy.today;
    if (isYesterday(d, now)) return copy.yesterday;
    if (diff < 7 * DAY) return copy.week;
    return copy.older;
  };

  return { label, groupOf, order: [copy.today, copy.yesterday, copy.week, copy.older] };
}

export type When = ReturnType<typeof makeWhen>;
