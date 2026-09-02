"use client";

import { useCallback, useRef, useState } from "react";
import {
  DEFAULT_COMFORT_CAST,
  FRIEND_BY_KEY,
  REPLY_ORDER,
  type ChatMsg,
  type ComfortCast,
  type ComfortEvent,
  type ComfortRequest,
  type FriendKey,
} from "./comfort";

/**
 * 단톡방 하나를 굴린다.
 *
 * 친구들이 동시에 답하면 그건 단톡이 아니라 공지사항이다.
 * 그래서 한 명씩 순서대로 부른다 — 앞사람 말을 읽고 다음 사람이 들어온다.
 * 첫 사연에는 다섯이 다 붙고, 그 뒤로는 셋만 붙는다. 실제 단톡이 그렇다.
 */

export interface ComfortSnapshot {
  cast: ComfortCast;
  msgs: ChatMsg[];
}

const newId = () => Math.random().toString(36).slice(2, 10);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 두 번째 턴부터는 셋만 — 매번 다른 셋이 붙어야 방이 살아 있다 */
function pickThree(): FriendKey[] {
  const shuffled = [...REPLY_ORDER].sort(() => Math.random() - 0.5).slice(0, 3);
  return REPLY_ORDER.filter((k) => shuffled.includes(k));
}

export function useComfort() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [cast, setCast] = useState<ComfortCast>(DEFAULT_COMFORT_CAST);
  const [typing, setTyping] = useState<FriendKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [mock, setMock] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const msgsRef = useRef<ChatMsg[]>([]);
  const castRef = useRef<ComfortCast>(cast);

  const push = useCallback((m: ChatMsg) => {
    msgsRef.current = [...msgsRef.current, m];
    setMsgs(msgsRef.current);
  }, []);

  const patchLast = useCallback((fn: (m: ChatMsg) => ChatMsg) => {
    const list = msgsRef.current;
    if (!list.length) return;
    msgsRef.current = [...list.slice(0, -1), fn(list[list.length - 1])];
    setMsgs(msgsRef.current);
  }, []);

  const record = useCallback(
    () =>
      msgsRef.current
        .filter((m) => m.text.trim())
        .map((m) => ({
          name: m.who === "me" ? "나" : FRIEND_BY_KEY[m.who].name,
          text: m.text,
        })),
    [],
  );

  const speak = useCallback(
    async (friend: FriendKey, first: boolean) => {
      const ac = abortRef.current;
      if (!ac || ac.signal.aborted) return;

      setTyping(friend);
      await wait(420 + Math.random() * 420);
      if (ac.signal.aborted) return;
      setTyping(null);

      // 빈 말풍선을 띄우기 전에 기록을 떠 둔다 — 띄운 뒤에 뜨면 자기 자신이 섞인다
      const rec = record();

      push({
        id: newId(),
        who: friend,
        text: "",
        model: castRef.current[friend],
        streaming: true,
      });

      try {
        const res = await fetch("/api/comfort", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            friend,
            cast: castRef.current,
            record: rec,
            first,
          } satisfies ComfortRequest),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) throw new Error(`서버 응답 ${res.status}`);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let full = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let e: ComfortEvent;
            try {
              e = JSON.parse(line) as ComfortEvent;
            } catch {
              continue;
            }
            if (e.t === "start") {
              if (e.mock) setMock(true);
            } else if (e.t === "delta") {
              full += e.d;
              patchLast((m) => ({ ...m, text: full }));
            } else if (e.t === "error") {
              throw new Error(e.message);
            }
          }
        }
        patchLast((m) => ({ ...m, streaming: false }));
      } catch (e) {
        setTyping(null);
        patchLast((m) => ({ ...m, streaming: false }));
        if (!ac.signal.aborted) throw e;
      }
    },
    [patchLast, push, record],
  );

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || busy) return;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const first = msgsRef.current.length === 0;
      push({ id: newId(), who: "me", text: body });
      setBusy(true);
      setError("");

      try {
        const line = first ? REPLY_ORDER : pickThree();
        for (const friend of line) {
          if (ac.signal.aborted) break;
          await speak(friend, first);
          await wait(320);
        }
      } catch (e) {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "답장에 실패했습니다");
      } finally {
        setTyping(null);
        setBusy(false);
      }
    },
    [busy, push, speak],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setTyping(null);
    setBusy(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    msgsRef.current = [];
    setMsgs([]);
    setTyping(null);
    setBusy(false);
    setError("");
  }, []);

  const reshuffle = useCallback((next: ComfortCast) => {
    castRef.current = next;
    setCast(next);
  }, []);

  const load = useCallback((snap: ComfortSnapshot) => {
    abortRef.current?.abort();
    abortRef.current = null;
    msgsRef.current = snap.msgs ?? [];
    castRef.current = snap.cast ?? DEFAULT_COMFORT_CAST;
    setMsgs(snap.msgs ?? []);
    setCast(snap.cast ?? DEFAULT_COMFORT_CAST);
    setTyping(null);
    setBusy(false);
    setError("");
  }, []);

  const snapshot: ComfortSnapshot = { cast, msgs };

  return {
    msgs,
    cast,
    typing,
    busy,
    mock,
    error,
    snapshot,
    send,
    stop,
    reset,
    reshuffle,
    load,
  };
}
