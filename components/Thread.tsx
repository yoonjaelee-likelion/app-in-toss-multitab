"use client";

import { Prose } from "@/components/Prose";
import { splitSynthesis, type GroupTurn, type Reply, type Turn } from "@/lib/chat";
import { MODEL_BY_ID } from "@/lib/models";

export function Thread({
  turns,
  compare,
  wide,
  active,
  onRetry,
}: {
  turns: Turn[];
  compare: boolean;
  /** 좁은 화면에서는 탭 전환 대신 단체 대화방처럼 답을 전부 쌓아 보여준다 */
  wide: boolean;
  active: string;
  onRetry: (gid: string, slot: string) => void;
}) {
  return (
    <>
      {turns.map((turn) =>
        turn.kind === "user" ? (
          <Question key={turn.id} text={turn.text} />
        ) : turn.gkind === "synthesis" ? (
          <Synthesis key={turn.id} group={turn} onRetry={onRetry} />
        ) : compare ? (
          <GroupColumns key={turn.id} group={turn} onRetry={onRetry} />
        ) : wide ? (
          <GroupSingle key={turn.id} group={turn} active={active} onRetry={onRetry} />
        ) : (
          <GroupChat key={turn.id} group={turn} onRetry={onRetry} />
        ),
      )}
    </>
  );
}

/* ── 질문 ─────────────────────────────────────────────────── */

function Question({ text }: { text: string }) {
  return (
    <div className="fade-up px-5 sm:px-7 py-5 sm:py-6 border-b border-line bg-chrome/45">
      <p className="text-[11.5px] font-medium text-t3 mb-1.5">질문</p>
      <p className="text-[17px] sm:text-[18.5px] leading-[1.6] font-semibold text-t1 tracking-[-0.02em] max-w-[62ch]">
        {text}
      </p>
    </div>
  );
}

/* ── 비교 보기 — 열 분할 ──────────────────────────────────── */

function GroupColumns({
  group,
  onRetry,
}: {
  group: GroupTurn;
  onRetry: (gid: string, slot: string) => void;
}) {
  const cols = group.order.length;
  return (
    <section className="fade-up border-b border-line">
      {group.gkind === "debate" && <RoundLabel round={group.round} blind={false} />}
      {group.gkind === "ask" && group.blind && <RoundLabel round={0} blind />}

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {group.order.map((slot, i) => {
          const m = MODEL_BY_ID[slot];
          const r = group.replies[slot];
          if (!m || !r) return null;
          return (
            <div key={slot} className={`min-w-0 ${i > 0 ? "border-l border-line-2" : ""}`}>
              <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-[2px] px-4 sm:px-5 pt-3 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  <span className="text-[12.5px] font-semibold text-t1 truncate">{m.short}</span>
                  <Meta reply={r} />
                </div>
                <div className="mt-2 h-[2px] rounded-full" style={{ background: `${m.color}2E` }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: r.status === "done" || r.status === "stopped" ? "100%" : "0%",
                      background: m.color,
                    }}
                  />
                </div>
              </div>
              <div className="px-4 sm:px-5 pb-6 pt-1">
                <ReplyBody reply={r} color={m.color} onRetry={() => onRetry(group.id, slot)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 탭 보기 — 한 탭만 ────────────────────────────────────── */

function GroupSingle({
  group,
  active,
  onRetry,
}: {
  group: GroupTurn;
  active: string;
  onRetry: (gid: string, slot: string) => void;
}) {
  const m = MODEL_BY_ID[active];
  const r = group.replies[active];

  return (
    <section className="fade-up border-b border-line">
      {group.gkind === "debate" && <RoundLabel round={group.round} blind={false} />}
      {group.gkind === "ask" && group.blind && <RoundLabel round={0} blind />}
      <div className="px-5 sm:px-7 py-5">
        <div className="max-w-[68ch]">
          {!m || !r ? (
            <p className="text-[13.5px] text-t3">
              이 탭은 이 질문 뒤에 열려서 답이 없습니다. 다시 물어보면 함께 답합니다.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ background: m.color }}
                />
                <span className="text-[12.5px] font-semibold text-t1">{m.name}</span>
                <Meta reply={r} />
              </div>
              <ReplyBody reply={r} color={m.color} onRetry={() => onRetry(group.id, active)} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── 좁은 화면 — 단체 대화방처럼 답을 쌓아서 ──────────────────── */

function GroupChat({
  group,
  onRetry,
}: {
  group: GroupTurn;
  onRetry: (gid: string, slot: string) => void;
}) {
  return (
    <section className="fade-up border-b border-line">
      {group.gkind === "debate" && <RoundLabel round={group.round} blind={false} />}
      {group.gkind === "ask" && group.blind && <RoundLabel round={0} blind />}
      <div className="px-4 sm:px-5 py-3.5 space-y-4">
        {group.order.map((slot) => {
          const m = MODEL_BY_ID[slot];
          const r = group.replies[slot];
          if (!m || !r) return null;
          return (
            <div key={slot} className="flex items-start gap-2.5">
              <span
                className="shrink-0 mt-[1px] w-[26px] h-[26px] rounded-full grid place-items-center text-[11px] font-bold text-white"
                style={{ background: m.color }}
                aria-hidden
              >
                {m.short.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12.5px] font-semibold text-t1">{m.short}</span>
                  <Meta reply={r} />
                </div>
                <div className="rounded-[14px] rounded-tl-[4px] bg-black/[.035] px-3 py-2.5">
                  <ReplyBody reply={r} color={m.color} onRetry={() => onRetry(group.id, slot)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 종합 ─────────────────────────────────────────────────── */

function Synthesis({
  group,
  onRetry,
}: {
  group: GroupTurn;
  onRetry: (gid: string, slot: string) => void;
}) {
  const slot = group.order[0];
  const r = group.replies[slot];
  const m = MODEL_BY_ID[slot];
  if (!r || !m) return null;
  const { agree, split, answer } = splitSynthesis(r.text);
  const waiting = (r.status === "streaming" || r.status === "pending") && !r.text;

  return (
    <section className="fade-up border-b border-line bg-chrome/45">
      <div className="px-5 sm:px-7 py-6">
        <div className="max-w-[72ch]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11.5px] font-semibold text-t1">종합</span>
            <span className="text-[11.5px] text-t3">{m.short}가 정리</span>
            {waiting && <Dots />}
          </div>

          {r.status === "error" ? (
            <ErrorLine message={r.error} onRetry={() => onRetry(group.id, slot)} />
          ) : (
            <div className="space-y-3.5">
              {agree && <Line label="합의" text={agree} />}
              {split && <Line label="갈림" text={split} />}
              {answer && (
                <div className="pt-2 mt-1 border-t border-line">
                  <p className="text-[11.5px] font-medium text-t3 mb-1.5">결론</p>
                  <p className="text-[17px] sm:text-[18px] leading-[1.68] font-semibold text-t1 tracking-[-0.018em]">
                    {answer}
                  </p>
                </div>
              )}
              {!agree && !split && !answer && r.text && <Prose text={r.text} color="#4A5059" />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-[34px] pt-[3px] text-[11.5px] font-medium text-t3">{label}</span>
      <p className="prose-ko flex-1">{text}</p>
    </div>
  );
}

/* ── 조각 ─────────────────────────────────────────────────── */

function RoundLabel({ round, blind }: { round: number; blind: boolean }) {
  return (
    <div className="px-5 sm:px-7 pt-3.5 pb-0.5 flex items-center gap-2">
      <span className="text-[11.5px] font-medium text-t3">
        {blind ? "독립 답변 · 서로의 답을 가림" : `토론 ${round}라운드`}
      </span>
      <span className="flex-1 h-px bg-line-2" />
    </div>
  );
}

function Meta({ reply }: { reply: Reply }) {
  if (reply.status === "streaming" || reply.status === "pending") {
    return (
      <span className="ml-auto shrink-0">
        <Dots />
      </span>
    );
  }
  return (
    <span className="ml-auto shrink-0 flex items-center gap-1.5 font-mono text-[10.5px] text-t4">
      {reply.mock && <span className="text-t4">모의</span>}
      {reply.status === "stopped"
        ? "중단"
        : reply.ms
          ? `${(reply.ms / 1000).toFixed(1)}s`
          : null}
    </span>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label="응답 중">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="dot-step block w-[3px] h-[3px] rounded-full bg-t3"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

function ReplyBody({
  reply,
  color,
  onRetry,
}: {
  reply: Reply;
  color: string;
  onRetry: () => void;
}) {
  if (reply.status === "error") return <ErrorLine message={reply.error} onRetry={onRetry} />;
  if (!reply.text) {
    return <p className="prose-ko text-t4">답을 쓰는 중입니다</p>;
  }
  return (
    <>
      <Prose text={reply.text} color={color} />
      {(reply.status === "streaming" || reply.status === "pending") && (
        <span className="caret inline-block w-[2px] h-[14px] align-[-2px] ml-[1px] bg-t3" />
      )}
    </>
  );
}

function ErrorLine({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div>
      <p className="text-[13.5px] leading-[1.65] text-t2">{message ?? "응답에 실패했습니다"}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 h-[28px] px-2.5 rounded-[6px] border border-line text-[12.5px] font-medium text-t1 hover:bg-black/[.04] transition-colors"
      >
        이 탭만 다시
      </button>
    </div>
  );
}
