"use client";

import { useCallback, useRef, useState } from "react";
import { useSettings } from "./settings";
import {
  ARGUE_ROUNDS,
  DEFAULT_CAST,
  emptyCase,
  nameOf,
  parseJury,
  parseVerdict,
  type CaseFile,
  type Cast,
  type CourtEvent,
  type CourtOp,
  type CourtRequest,
  type Juror,
  type Msg,
  type Rating,
  type RoleKey,
  type Step,
  type Verdict,
  type Who,
} from "./court";

/**
 * 재판을 연다.
 *
 * 한 번에 한 사람만 말한다. 재판장이 남자를 부르면 멈춰서 기다리고,
 * 남자가 적으면 여자를 부른다. 그 뒤로는 대리인이 한 마디씩 주고받는다.
 * 단계 사이의 짧은 틈이 이 모드의 전부다 — 다 쏟아내면 대화가 아니다.
 */

export interface CourtSnapshot {
  caseFile: CaseFile;
  cast: Cast;
  msgs: Msg[];
  jurors: Juror[];
  verdict: Verdict | null;
}

const newId = () => Math.random().toString(36).slice(2, 10);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useCourt() {
  const [step, setStep] = useState<Step>("idle");
  const [caseFile, setCaseFile] = useState<CaseFile>(() => emptyCase("normal"));
  const [cast, setCast] = useState<Cast>(DEFAULT_CAST);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [typing, setTyping] = useState<Who | null>(null);
  const [mock, setMock] = useState(false);
  const [error, setError] = useState("");

  const { lang } = useSettings();
  const langRef = useRef(lang);
  langRef.current = lang;

  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<CaseFile>(caseFile);
  const castRef = useRef<Cast>(cast);
  const msgsRef = useRef<Msg[]>([]);

  const push = useCallback((m: Msg) => {
    msgsRef.current = [...msgsRef.current, m];
    setMsgs(msgsRef.current);
  }, []);

  const patchLast = useCallback((fn: (m: Msg) => Msg) => {
    const list = msgsRef.current;
    if (!list.length) return;
    msgsRef.current = [...list.slice(0, -1), fn(list[list.length - 1])];
    setMsgs(msgsRef.current);
  }, []);

  /** 지금까지 나온 말 — 다음 사람이 이걸 읽고 말한다 */
  const record = useCallback((): CourtRequest["record"] => {
    const f = fileRef.current;
    const label: Record<Who, string> = {
      judge: "재판장",
      man: nameOf(f.man, "남자"),
      woman: nameOf(f.woman, "여자"),
      a: `${nameOf(f.man, "남자")} 대리인`,
      b: `${nameOf(f.woman, "여자")} 대리인`,
      jury: "배심원단",
      verdict: "판결",
    };
    return msgsRef.current
      .filter((m) => m.text.trim() && m.who !== "verdict")
      .map((m) => ({ who: m.who, name: label[m.who], text: m.text }));
  }, []);

  /** 한 사람이 한 마디 한다. 말풍선을 먼저 띄우고 그 안으로 글자를 흘린다. */
  const speak = useCallback(
    async (
      op: CourtOp,
      who: Who,
      opts: { speaker?: RoleKey; round?: number; silent?: boolean } = {},
    ) => {
      const ac = abortRef.current;
      if (!ac || ac.signal.aborted) return "";

      const model = castRef.current[
        op === "jury" ? "jury" : op === "argue" ? (opts.speaker ?? "a") : "judge"
      ];

      setTyping(who);
      await wait(360);
      if (ac.signal.aborted) return "";
      setTyping(null);

      if (!opts.silent) push({ id: newId(), who, text: "", model, streaming: true });

      let full = "";
      try {
        const res = await fetch("/api/court", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            op,
            caseFile: fileRef.current,
            cast: castRef.current,
            speaker: opts.speaker,
            round: opts.round,
            lang: langRef.current,
            record: record(),
          } satisfies CourtRequest),
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
            let e: CourtEvent;
            try {
              e = JSON.parse(line) as CourtEvent;
            } catch {
              continue;
            }
            if (e.t === "start") {
              if (e.mock) setMock(true);
            } else if (e.t === "delta") {
              full += e.d;
              if (!opts.silent) patchLast((m) => ({ ...m, text: full }));
            } else if (e.t === "error") {
              throw new Error(e.message);
            }
          }
        }
        if (!opts.silent) patchLast((m) => ({ ...m, streaming: false }));
      } catch (e) {
        setTyping(null);
        if (ac.signal.aborted) return full;
        if (!opts.silent) patchLast((m) => ({ ...m, streaming: false }));
        throw e;
      }
      return full;
    },
    [patchLast, push, record],
  );

  /* ── 개정 ────────────────────────────────────────────── */

  const start = useCallback(
    async (rating: Rating, roster: Cast = DEFAULT_CAST) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const file = emptyCase(rating);
      fileRef.current = file;
      castRef.current = roster;
      msgsRef.current = [];

      setCaseFile(file);
      setCast(roster);
      setMsgs([]);
      setJurors([]);
      setVerdict(null);
      setError("");
      setMock(false);
      setStep("askMan");

      try {
        await speak("open", "judge");
        if (!ac.signal.aborted) setStep("askMan");
      } catch (e) {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "개정에 실패했습니다");
      }
    },
    [speak],
  );

  /* ── 대리인들이 붙는 구간 ─────────────────────────────── */

  const runTrial = useCallback(async () => {
    const ac = abortRef.current;
    if (!ac) return;
    try {
      setStep("arguing");
      await wait(420);

      for (let round = 1; round <= ARGUE_ROUNDS; round += 1) {
        await speak("argue", "a", { speaker: "a", round });
        if (ac.signal.aborted) return;
        await wait(520);
        await speak("argue", "b", { speaker: "b", round });
        if (ac.signal.aborted) return;
        await wait(520);
      }

      await speak("wrap", "judge");
      if (ac.signal.aborted) return;
      await wait(520);

      setStep("jury");
      const juryText = await speak("jury", "jury", { silent: true });
      if (ac.signal.aborted) return;
      const list = parseJury(juryText);
      setJurors(list);
      push({ id: newId(), who: "jury", text: juryText, model: castRef.current.jury });
      await wait(900);

      setStep("verdict");
      const vText = await speak("verdict", "judge", { silent: true });
      if (ac.signal.aborted) return;
      const v = parseVerdict(vText);
      setVerdict(v);
      push({ id: newId(), who: "verdict", text: vText, model: castRef.current.judge });

      setStep("done");
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : "재판이 중단됐습니다");
      setStep("done");
    } finally {
      setTyping(null);
    }
  }, [push, speak]);

  /* ── 당사자 진술 ─────────────────────────────────────── */

  const submit = useCallback(
    async (name: string, text: string) => {
      const body = text.trim();
      if (!body) return;
      const ac = abortRef.current;
      if (!ac) return;

      if (step === "askMan") {
        const file = { ...fileRef.current, man: { name: name.trim(), claim: body } };
        fileRef.current = file;
        setCaseFile(file);
        push({ id: newId(), who: "man", text: body });
        setStep("askWoman");
        try {
          await wait(340);
          await speak("callWoman", "judge");
        } catch (e) {
          if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "진행에 실패했습니다");
        }
        return;
      }

      if (step === "askWoman") {
        const file = { ...fileRef.current, woman: { name: name.trim(), claim: body } };
        fileRef.current = file;
        setCaseFile(file);
        push({ id: newId(), who: "woman", text: body });
        void runTrial();
      }
    },
    [push, runTrial, speak, step],
  );

  /** 데모 — 양쪽 진술을 미리 채워 넣고 끝까지 돌린다 */
  const runDemo = useCallback(
    async (file: CaseFile, roster: Cast = DEFAULT_CAST) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      fileRef.current = file;
      castRef.current = roster;
      msgsRef.current = [];

      setCaseFile(file);
      setCast(roster);
      setMsgs([]);
      setJurors([]);
      setVerdict(null);
      setError("");
      setMock(false);
      setStep("askMan");

      try {
        await speak("open", "judge");
        if (ac.signal.aborted) return;
        await wait(420);
        push({ id: newId(), who: "man", text: file.man.claim });
        setStep("askWoman");
        await wait(560);
        await speak("callWoman", "judge");
        if (ac.signal.aborted) return;
        await wait(420);
        push({ id: newId(), who: "woman", text: file.woman.claim });
        await wait(560);
        await runTrial();
      } catch (e) {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "재판이 중단됐습니다");
      }
    },
    [push, runTrial, speak],
  );

  /** 항소 — 대리인을 맞바꿔 변론부터 다시. 대체로 판결이 뒤집힌다. */
  const appeal = useCallback(() => {
    const swapped: Cast = { ...castRef.current, a: castRef.current.b, b: castRef.current.a };
    castRef.current = swapped;
    setCast(swapped);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // 당사자 진술까지만 남기고 대리인들이 한 말은 지운다
    msgsRef.current = msgsRef.current.filter((m) => m.who === "man" || m.who === "woman" || m.who === "judge").slice(0, 4);
    setMsgs(msgsRef.current);
    setJurors([]);
    setVerdict(null);
    setError("");
    void runTrial();
  }, [runTrial]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setTyping(null);
    setStep("done");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    msgsRef.current = [];
    setStep("idle");
    setMsgs([]);
    setJurors([]);
    setVerdict(null);
    setTyping(null);
    setError("");
  }, []);

  /** 기록에서 다시 열 때 — 다시 돌리지 않고 그대로 되살린다 */
  const load = useCallback((snap: CourtSnapshot) => {
    abortRef.current?.abort();
    abortRef.current = null;
    fileRef.current = snap.caseFile;
    castRef.current = snap.cast ?? DEFAULT_CAST;
    msgsRef.current = snap.msgs ?? [];
    setCaseFile(snap.caseFile);
    setCast(snap.cast ?? DEFAULT_CAST);
    setMsgs(snap.msgs ?? []);
    setJurors(snap.jurors ?? []);
    setVerdict(snap.verdict ?? null);
    setTyping(null);
    setError("");
    setStep("done");
  }, []);

  const busy = step === "arguing" || step === "jury" || step === "verdict";
  const waitingUser = step === "askMan" || step === "askWoman";

  const snapshot: CourtSnapshot = { caseFile, cast, msgs, jurors, verdict };

  return {
    step,
    caseFile,
    cast,
    msgs,
    jurors,
    verdict,
    typing,
    mock,
    error,
    busy,
    waitingUser,
    snapshot,
    setCast,
    start,
    submit,
    runDemo,
    appeal,
    stop,
    reset,
    load,
  };
}
