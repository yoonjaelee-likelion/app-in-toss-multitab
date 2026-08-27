"use client";

import { useCallback, useRef, useState } from "react";
import {
  DEPT_BY_KEY,
  parseDiagnosis,
  parseMeetings,
  parseStaff,
  type Dept,
  type Diagnosis,
  type InbizEvent,
  type InbizRequest,
  type Meeting,
  type Phase,
} from "./inbiz";

/**
 * 법인을 한 번 굴린다.
 *
 * 편성 → 분석 → 회의 → 진단. 각 단계는 앞 단계의 결과를 받아서만 시작한다.
 * 편성 단계는 스트리밍 도중에도 파싱해서, 대표가 부서 이름을 말하는 순간
 * 조직도에 카드가 하나씩 올라오게 했다.
 */
export function useInbiz() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [idea, setIdea] = useState("");
  const [headline, setHeadline] = useState("");
  const [depts, setDepts] = useState<Dept[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [mock, setMock] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const deptsRef = useRef<Dept[]>([]);
  deptsRef.current = depts;

  /** NDJSON 한 줄씩 읽어서 콜백에 넘긴다 */
  const stream = useCallback(
    async (req: InbizRequest, onEvent: (e: InbizEvent) => void, signal: AbortSignal) => {
      const res = await fetch("/api/inbiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
        signal,
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
          try {
            onEvent(JSON.parse(line) as InbizEvent);
          } catch {
            /* 잘린 줄은 버린다 */
          }
        }
      }
    },
    [],
  );

  /** 한 단계를 통째로 돌려서 slot별 최종 텍스트를 돌려준다 */
  const runStage = useCallback(
    async (
      req: InbizRequest,
      signal: AbortSignal,
      onDelta?: (slot: string, full: string) => void,
    ) => {
      const acc: Record<string, string> = {};
      await stream(
        req,
        (e) => {
          if (e.t === "start") {
            if (e.mock) setMock(true);
            acc[e.slot] = "";
          } else if (e.t === "delta") {
            acc[e.slot] = (acc[e.slot] ?? "") + e.d;
            onDelta?.(e.slot, acc[e.slot]);
          } else if (e.t === "error") {
            acc[e.slot] = acc[e.slot] ?? "";
            throw new Error(e.message);
          }
        },
        signal,
      );
      return acc;
    },
    [stream],
  );

  const patch = useCallback((key: string, fn: (d: Dept) => Dept) => {
    setDepts((prev) => prev.map((d) => (d.key === key ? fn(d) : d)));
  }, []);

  const run = useCallback(
    async (rawIdea: string) => {
      const text = rawIdea.trim();
      if (!text) return;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setIdea(text);
      setHeadline("");
      setDepts([]);
      setMeetings([]);
      setDiagnosis(null);
      setError("");

      try {
        /* ── 1. 편성 — 대표가 부서를 부르는 대로 카드가 올라온다 ── */
        setPhase("staffing");
        let spawned: Dept[] = [];
        await runStage({ op: "staff", idea: text }, ac.signal, (_slot, full) => {
          const { headline: h, picks } = parseStaff(full);
          if (h) setHeadline(h);
          if (picks.length === spawned.length) return;
          spawned = picks.map(({ key, why }) => {
            const def = DEPT_BY_KEY[key];
            const existing = spawned.find((d) => d.key === key);
            return (
              existing ?? {
                key,
                name: def.name,
                abbr: def.abbr,
                color: def.color,
                why,
                status: "waiting" as const,
                report: "",
              }
            );
          });
          setDepts(spawned);
        });

        if (!spawned.length) throw new Error("부서를 편성하지 못했습니다");
        // 조직도가 다 그려지는 걸 잠깐 보여주고 넘어간다
        await new Promise((r) => setTimeout(r, 520));
        if (ac.signal.aborted) return;

        /* ── 2. 분석 — 부서가 동시에 일한다 ── */
        setPhase("analyzing");
        const keys = spawned.map((d) => d.key);
        setDepts((prev) => prev.map((d) => ({ ...d, status: "working" })));

        const reports = await runStage(
          {
            op: "analyze",
            idea: text,
            targets: keys,
            depts: spawned.map((d) => ({ key: d.key, name: d.name, why: d.why })),
          },
          ac.signal,
          (slot, full) => patch(slot, (d) => ({ ...d, report: full, status: "working" })),
        );

        setDepts((prev) =>
          prev.map((d) => ({
            ...d,
            report: reports[d.key] ?? d.report,
            status: reports[d.key] ? "done" : "error",
          })),
        );
        if (ac.signal.aborted) return;

        const done = spawned
          .map((d) => ({ key: d.key, name: d.name, text: reports[d.key] ?? "" }))
          .filter((r) => r.text.trim());

        /* ── 3. 회의 — 전제가 부딪히는 부서끼리만 ── */
        setPhase("meeting");
        const names = done.map((r) => r.name);
        const meetOut = await runStage(
          { op: "meet", idea: text, reports: done },
          ac.signal,
          (_slot, full) => setMeetings(parseMeetings(full, names)),
        );
        const finalMeetings = parseMeetings(meetOut.head ?? "", names);
        setMeetings(finalMeetings);
        await new Promise((r) => setTimeout(r, 420));
        if (ac.signal.aborted) return;

        /* ── 4. 진단 — 한 장으로 ── */
        setPhase("diagnosing");
        const diagOut = await runStage(
          { op: "diagnose", idea: text, reports: done, meetings: finalMeetings },
          ac.signal,
          (_slot, full) => {
            const d = parseDiagnosis(full);
            if (d) setDiagnosis(d);
          },
        );
        const final = parseDiagnosis(diagOut.head ?? "");
        if (final) setDiagnosis(final);

        setPhase("done");
      } catch (e) {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "진단에 실패했습니다");
        setPhase("done");
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [patch, runStage],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("done");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setIdea("");
    setHeadline("");
    setDepts([]);
    setMeetings([]);
    setDiagnosis(null);
    setError("");
  }, []);

  const busy = phase !== "idle" && phase !== "done";

  return {
    phase,
    idea,
    headline,
    depts,
    meetings,
    diagnosis,
    mock,
    error,
    busy,
    run,
    stop,
    reset,
  };
}
