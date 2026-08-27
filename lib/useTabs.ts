"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  emptyReplies,
  newId,
  type AskEvent,
  type AskRequest,
  type GroupKind,
  type GroupTurn,
  type Turn,
} from "./chat";
import { DEFAULT_TABS, MAX_TABS, MODEL_BY_ID } from "./models";

export function useTabs() {
  const [tabs, setTabs] = useState<string[]>(DEFAULT_TABS);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [blind, setBlind] = useState(false);
  const [anyMock, setAnyMock] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;

  const openTab = useCallback((id: string) => {
    setTabs((prev) => (prev.includes(id) || prev.length >= MAX_TABS ? prev : [...prev, id]));
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => prev.filter((s) => s !== id));
  }, []);

  const toggleTab = useCallback((id: string) => {
    setTabs((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length >= MAX_TABS
          ? prev
          : [...prev, id],
    );
  }, []);

  const patchReply = useCallback(
    (
      gid: string,
      slot: string,
      fn: (r: GroupTurn["replies"][string]) => GroupTurn["replies"][string],
    ) => {
      setTurns((prev) =>
        prev.map((t) => {
          if (t.kind !== "group" || t.id !== gid) return t;
          const cur = t.replies[slot];
          if (!cur) return t;
          return { ...t, replies: { ...t.replies, [slot]: fn(cur) } };
        }),
      );
    },
    [],
  );

  const run = useCallback(
    async (opts: {
      mode: GroupKind;
      targets: string[];
      question: string;
      round: number;
      priorTurns: Turn[];
      gid: string;
    }) => {
      const ac = new AbortController();
      abortRef.current = ac;
      setBusy(true);

      const req: AskRequest = {
        mode: opts.mode,
        targets: opts.targets,
        question: opts.question,
        round: opts.round,
        blind: blind && opts.mode === "ask",
        turns: opts.priorTurns,
      };

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(req),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) throw new Error(`서버 응답 ${res.status}`);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let e: AskEvent;
            try {
              e = JSON.parse(line) as AskEvent;
            } catch {
              continue;
            }
            if (e.t === "start") {
              if (e.mock) setAnyMock(true);
              patchReply(opts.gid, e.slot, (r) => ({ ...r, status: "streaming", mock: e.mock }));
            } else if (e.t === "delta") {
              patchReply(opts.gid, e.slot, (r) => ({
                ...r,
                text: r.text + e.d,
                status: "streaming",
              }));
            } else if (e.t === "done") {
              patchReply(opts.gid, e.slot, (r) => ({ ...r, status: "done", ms: e.ms }));
            } else if (e.t === "error") {
              patchReply(opts.gid, e.slot, (r) => ({ ...r, status: "error", error: e.message }));
            }
          }
        }
        // 스트림이 먼저 끊겨 done을 못 받은 탭 정리
        setTurns((prev) =>
          prev.map((t) => {
            if (t.kind !== "group" || t.id !== opts.gid) return t;
            const replies = { ...t.replies };
            for (const k of Object.keys(replies)) {
              const r = replies[k];
              if (r.status === "streaming" || r.status === "pending") {
                replies[k] = r.text
                  ? { ...r, status: "stopped" }
                  : { ...r, status: "error", error: "응답이 끊겼습니다" };
              }
            }
            return { ...t, replies };
          }),
        );
      } catch (e) {
        const stopped = ac.signal.aborted;
        setTurns((prev) =>
          prev.map((t) => {
            if (t.kind !== "group" || t.id !== opts.gid) return t;
            const replies = { ...t.replies };
            for (const k of Object.keys(replies)) {
              const r = replies[k];
              if (r.status === "done" || r.status === "error") continue;
              replies[k] = stopped
                ? { ...r, status: "stopped" }
                : { ...r, status: "error", error: e instanceof Error ? e.message : "연결 실패" };
            }
            return { ...t, replies };
          }),
        );
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [blind, patchReply],
  );

  const ask = useCallback(
    (text: string, targets?: string[]) => {
      const q = text.trim();
      const to = (targets ?? tabs).filter((s) => MODEL_BY_ID[s]);
      if (!q || !to.length || busy) return;

      const userTurn: Turn = { kind: "user", id: newId(), text: q };
      const gid = newId();
      const group: GroupTurn = {
        kind: "group",
        id: gid,
        gkind: "ask",
        question: q,
        round: 0,
        blind,
        order: to,
        replies: emptyReplies(to),
      };
      const prior = [...turnsRef.current, userTurn];
      setTurns([...prior, group]);
      void run({ mode: "ask", targets: to, question: q, round: 0, priorTurns: prior, gid });
    },
    [blind, busy, tabs, run],
  );

  const lastQuestion = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.kind === "user") return t.text;
    }
    return "";
  }, [turns]);

  const debateRound = useCallback(() => {
    const to = tabs.filter((s) => MODEL_BY_ID[s]);
    if (to.length < 2 || busy) return;
    const q = lastQuestion;
    if (!q) return;
    const lastRound = turnsRef.current.reduce(
      (n, t) => (t.kind === "group" && t.gkind === "debate" ? Math.max(n, t.round) : n),
      0,
    );
    const round = lastRound + 1;
    const gid = newId();
    const group: GroupTurn = {
      kind: "group",
      id: gid,
      gkind: "debate",
      question: q,
      round,
      blind: false,
      order: to,
      replies: emptyReplies(to),
    };
    const prior = [...turnsRef.current];
    setTurns([...prior, group]);
    void run({ mode: "debate", targets: to, question: q, round, priorTurns: prior, gid });
  }, [busy, lastQuestion, tabs, run]);

  const synthesize = useCallback(
    (by?: string) => {
      const who = by ?? tabs[0];
      if (!who || busy || !lastQuestion) return;
      const gid = newId();
      const group: GroupTurn = {
        kind: "group",
        id: gid,
        gkind: "synthesis",
        question: lastQuestion,
        round: 0,
        blind: false,
        order: [who],
        replies: emptyReplies([who]),
      };
      const prior = [...turnsRef.current];
      setTurns([...prior, group]);
      void run({
        mode: "synthesis",
        targets: [who],
        question: lastQuestion,
        round: 0,
        priorTurns: prior,
        gid,
      });
    },
    [busy, lastQuestion, tabs, run],
  );

  const retry = useCallback(
    (gid: string, slot: string) => {
      const idx = turnsRef.current.findIndex((t) => t.id === gid);
      const t = turnsRef.current[idx];
      if (idx < 0 || !t || t.kind !== "group" || busy) return;
      patchReply(gid, slot, (r) => ({ ...r, text: "", status: "pending", error: undefined }));
      void run({
        mode: t.gkind,
        targets: [slot],
        question: t.question,
        round: t.round,
        priorTurns: turnsRef.current.slice(0, idx),
        gid,
      });
    },
    [busy, patchReply, run],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
  }, []);

  const hasAnswers = useMemo(
    () => turns.some((t) => t.kind === "group" && t.gkind !== "synthesis"),
    [turns],
  );

  /** 지금 응답 중인 탭 */
  const loading = useMemo(() => {
    const s = new Set<string>();
    for (const t of turns) {
      if (t.kind !== "group") continue;
      for (const [slot, r] of Object.entries(t.replies)) {
        if (r.status === "streaming" || r.status === "pending") s.add(slot);
      }
    }
    return s;
  }, [turns]);

  return {
    tabs,
    turns,
    busy,
    blind,
    anyMock,
    hasAnswers,
    lastQuestion,
    loading,
    setBlind,
    openTab,
    closeTab,
    toggleTab,
    ask,
    debateRound,
    synthesize,
    retry,
    stop,
    reset,
  };
}
