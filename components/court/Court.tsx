"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CourtChat } from "@/components/court/CourtChat";
import { CourtStart } from "@/components/court/CourtStart";
import { newId } from "@/lib/chat";
import {
  nameOf,
  type CaseFile,
  type Cast,
  type DemoCase,
  type Rating,
} from "@/lib/court";
import type { StoredSession } from "@/lib/sessions";
import { useCourt, type CourtSnapshot } from "@/lib/useCourt";
import type { PersistInput } from "@/lib/useSessions";

export function Court({
  persist,
  restore,
  onSession,
}: {
  persist: (p: PersistInput) => void;
  restore: StoredSession | null;
  onSession: (id: string) => void;
}) {
  const c = useCourt();
  const idRef = useRef<string | null>(restore?.id ?? null);
  const booted = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (restore?.data) c.load(restore.data as CourtSnapshot);
  }, [c, restore]);

  /* 말이 하나 늘 때마다 따라 내려간다. 다만 위로 올려 다시 읽는 중이면 놔둔다.
     두 번 부르는 이유는 판결 카드가 뒤늦게 부풀기 때문이다 — 한 번만 부르면 덜 내려간다. */
  const stick = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    const t1 = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 100);
    const t2 = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "auto" }), 620);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // 단계가 끝나면 아래에 버튼줄과 안내가 붙는다 — 그만큼 다시 내려가야 한다
  }, [c.msgs.length, c.typing, c.step]);

  /* 말풍선이 자라는 동안에도 붙어 있는다 — 폰에서는 세 줄만 되도 아래로 넘어간다 */
  const lastLen = c.msgs[c.msgs.length - 1]?.text.length ?? 0;
  useEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [lastLen]);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }, []);

  /* 단계가 넘어갈 때만 저장한다 — 스냅샷은 ref로 읽어야 저장 루프에 안 빠진다 */
  const snapRef = useRef<CourtSnapshot | null>(null);
  useEffect(() => {
    snapRef.current = c.snapshot;
  }, [c.snapshot]);

  useEffect(() => {
    const id = idRef.current;
    const snap = snapRef.current;
    if (!id || !snap || !snap.msgs.length) return;
    const f = snap.caseFile;
    const m = nameOf(f.man, "남자");
    const w = nameOf(f.woman, "여자");
    persist({
      id,
      mode: "court",
      title: f.man.claim ? `${m} 대 ${w}` : "재판 진행 중",
      subtitle: `${f.rating === "adult" ? "19금 · " : ""}${
        f.man.claim.slice(0, 22) || "진술 대기"
      }`,
      data: snap,
    });
  }, [c.step, persist]);

  const begin = useCallback(
    (rating: Rating, cast: Cast) => {
      idRef.current = newId();
      onSession(idRef.current);
      void c.start(rating, cast);
    },
    [c, onSession],
  );

  const demo = useCallback(
    (d: DemoCase, cast: Cast) => {
      idRef.current = newId();
      onSession(idRef.current);
      const file: CaseFile = { rating: d.rating, man: d.man, woman: d.woman };
      void c.runDemo(file, cast);
    },
    [c, onSession],
  );

  const verdictText = useMemo(() => {
    const v = c.verdict;
    if (!v) return "";
    return [
      `${nameOf(c.caseFile.man, "남자")} 대 ${nameOf(c.caseFile.woman, "여자")}`,
      `주문: ${v.order}`,
      `과실: 남자 ${v.fault.m}% · 여자 ${v.fault.w}%`,
      ...v.sentences.map((s) => `형(${s.who}): ${s.order}`),
      v.remark ? `재판장 한마디: ${v.remark}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [c.caseFile, c.verdict]);

  const copy = useCallback(() => {
    if (!verdictText) return;
    void navigator.clipboard?.writeText(verdictText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [verdictText]);

  if (c.step === "idle") {
    return <CourtStart onStart={begin} onDemo={demo} />;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div ref={scroller} onScroll={onScroll} className="flex-1 min-h-0 overflow-auto scroll-y">
        <CourtChat
          file={c.caseFile}
          cast={c.cast}
          msgs={c.msgs}
          jurors={c.jurors}
          verdict={c.verdict}
          typing={c.typing}
          step={c.step}
        />
        {c.error && (
          <p className="mx-auto max-w-[680px] px-5 pb-4 text-[12.5px] text-bad">{c.error}</p>
        )}
        {c.mock && c.step === "done" && (
          <p className="mx-auto max-w-[680px] px-5 pb-4 text-[11px] text-t4 text-center">
            API 키가 없어 모의 기록으로 재판했습니다
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-line-2 px-3 sm:px-5 py-3">
        <div className="mx-auto w-full max-w-[680px]">
          {c.waitingUser ? (
            <Statement
              side={c.step === "askMan" ? "man" : "woman"}
              onSend={c.submit}
              disabled={Boolean(c.typing)}
            />
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto no-bar">
              {c.busy ? (
                <button
                  type="button"
                  onClick={c.stop}
                  className="nm-btn shrink-0 h-[36px] px-3.5 rounded-[11px] text-[12.5px] font-semibold text-t1"
                >
                  휴정
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      idRef.current = null;
                      c.reset();
                    }}
                    className="nm-btn shrink-0 h-[36px] px-3.5 rounded-[11px] text-[12.5px] font-semibold text-t1"
                  >
                    새 재판
                  </button>
                  {c.verdict && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          idRef.current = newId();
                          onSession(idRef.current);
                          c.appeal();
                        }}
                        title="대리인을 맞바꿔서 변론부터 다시"
                        className="nm-btn shrink-0 h-[36px] px-3.5 rounded-[11px] text-[12.5px] font-semibold text-t2 hover:text-t1"
                      >
                        항소하기
                      </button>
                      <button
                        type="button"
                        onClick={copy}
                        className="nm-btn shrink-0 h-[36px] px-3.5 rounded-[11px] text-[12.5px] font-semibold text-t2 hover:text-t1"
                      >
                        {copied ? "복사했습니다" : "판결문 복사"}
                      </button>
                    </>
                  )}
                </>
              )}
              <span className="flex-1" />
              <span className="hidden sm:block shrink-0 text-[11px] text-t4">
                {c.busy ? "대리인들이 싸우는 중" : "판결에 불복하면 항소하십시오"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 당사자 입력 ──────────────────────────────────────────── */

function Statement({
  side,
  onSend,
  disabled,
}: {
  side: "man" | "woman";
  onSend: (name: string, text: string) => void;
  disabled: boolean;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const man = side === "man";
  const tone = man ? "#2F63C4" : "#C0446E";

  const send = () => {
    if (!text.trim() || disabled) return;
    onSend(name, text);
    setName("");
    setText("");
    if (ta.current) ta.current.style.height = "auto";
  };

  return (
    <div
      className="glass glass-lit lit-focus rounded-[20px]"
      style={{ borderColor: `${tone}3a` }}
    >
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <span
          className="inline-flex items-center h-[21px] px-2 rounded-[6px] text-[11px] font-bold pulse-gold"
          style={{ color: tone, background: `${tone}1f` }}
        >
          {man ? "남자 차례" : "여자 차례"}
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (선택)"
          aria-label="이름"
          className="w-[92px] bg-transparent outline-none text-[12px] text-t2 placeholder:text-t4"
        />
      </div>

      <textarea
        ref={ta}
        value={text}
        autoFocus
        onChange={(e) => {
          setText(e.target.value);
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${Math.min(150, el.scrollHeight)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        rows={2}
        placeholder={
          man
            ? "무슨 일이 있었는지 적으세요. 본인한테 유리하게 적어도 됩니다"
            : "반박하세요. 억울한 점, 사정, 다 적으세요"
        }
        aria-label="진술"
        className="w-full resize-none bg-transparent outline-none px-3.5 pt-2 pb-1.5 text-[14.5px] leading-[1.7] text-t1 placeholder:text-t4"
      />

      <div className="flex items-center gap-2 px-2.5 pb-2.5">
        <span className="flex-1 text-[11px] text-t4 pl-1 truncate">
          이대로 대리인에게 넘어갑니다
        </span>
        <button
          type="button"
          onClick={send}
          disabled={!text.trim() || disabled}
          className="btn-solid h-[36px] sm:h-[31px] px-3.5 sm:px-3 text-[12.5px] font-semibold flex items-center gap-1.5 disabled:cursor-not-allowed"
        >
          진술
          <span className="text-[10.5px] font-normal opacity-55">⏎</span>
        </button>
      </div>
    </div>
  );
}
