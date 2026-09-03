"use client";

import { VerdictCard } from "@/components/court/Verdict";
import { IconGavel } from "@/components/shell/icons";
import {
  caseNo,
  nameOf,
  shortOf,
  type CaseFile,
  type Cast,
  type Juror,
  type Msg,
  type Step,
  type Verdict,
  type Who,
} from "@/lib/court";
import { useCopy } from "@/lib/i18n";

const MAN = "#2F63C4";
const WOMAN = "#C0446E";

/**
 * 법정 기록 — 그냥 대화창이다.
 *
 * 재판장은 가운데, 남자 쪽은 왼쪽, 여자 쪽은 오른쪽.
 * 당사자가 한 말은 금속(눌린 것), 대리인이 한 말은 유리(뜬 것)로 구분한다.
 */
export function CourtChat({
  file,
  cast,
  msgs,
  jurors,
  verdict,
  typing,
  step,
}: {
  file: CaseFile;
  cast: Cast;
  msgs: Msg[];
  jurors: Juror[];
  verdict: Verdict | null;
  typing: Who | null;
  step: Step;
}) {
  const t = useCopy();
  const m = nameOf(file.man, "남자");
  const w = nameOf(file.woman, "여자");

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 sm:px-5 py-5 space-y-3.5">
      <p className="text-center font-mono text-[10.5px] text-t4">
        {caseNo(file)}
        {file.rating === "adult" && <span className="text-blood/70"> · {t.court.caseAdultSuffix}</span>}
      </p>

      {msgs.map((msg) => {
        if (msg.who === "judge") return <JudgeLine key={msg.id} msg={msg} />;
        if (msg.who === "verdict")
          return verdict ? <VerdictCard key={msg.id} verdict={verdict} file={file} /> : null;
        if (msg.who === "jury") return <JuryCard key={msg.id} jurors={jurors} man={m} />;

        const left = msg.who === "man" || msg.who === "a";
        const tone = left ? MAN : WOMAN;
        const party = msg.who === "man" || msg.who === "woman";

        return (
          <Row key={msg.id} left={left}>
            <div className="max-w-[92%] sm:max-w-[86%] min-w-0">
              <p
                className={`mb-1 text-[10.5px] text-t4 flex items-center gap-1.5 ${
                  left ? "" : "justify-end"
                }`}
              >
                {party ? (
                  <>
                    <span style={{ color: tone }}>{msg.who === "man" ? m : w}</span>
                    <span>{t.court.ownStatement}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: tone }}>
                      {t.court.counselOf(msg.who === "a" ? m : w)}
                    </span>
                    <span>· {shortOf(msg.model ?? "")}</span>
                  </>
                )}
              </p>

              {/* 당사자가 한 말은 종이에서 솟은 자기, 대리인이 한 말은 자기 편 색을
                  아주 옅게 머금은 유리. 밝은 바탕에서는 재질만으로는 안 갈라진다 —
                  색을 조금 타야 어느 쪽 말인지 읽기 전에 보인다. */}
              <div
                className={`px-3.5 py-2.5 ${
                  party ? "nm" : "glass-2"
                } ${left ? "rounded-[16px] rounded-tl-[6px]" : "rounded-[16px] rounded-tr-[6px]"}`}
                style={
                  party
                    ? { borderColor: `${tone}2e` }
                    : {
                        background: `linear-gradient(150deg, ${tone}16, ${tone}0a)`,
                        borderColor: `${tone}33`,
                        boxShadow: `inset 0 1px 0 var(--lip-soft), inset ${
                          left ? "2.5px" : "-2.5px"
                        } 0 0 ${tone}80`,
                      }
                }
              >
                <p className="text-[14px] leading-[1.72] text-t1 break-keep whitespace-pre-wrap">
                  {msg.text}
                  {msg.streaming && (
                    <span
                      className="caret inline-block w-[2px] h-[14px] align-[-2px] ml-[1px]"
                      style={{ background: tone }}
                    />
                  )}
                </p>
              </div>
            </div>
          </Row>
        );
      })}

      {typing && <Typing who={typing} cast={cast} man={m} woman={w} />}

      {step === "verdict" && !verdict && (
        <p className="thinking text-center text-[12.5px] font-medium py-2">
          {t.court.writingVerdict}
        </p>
      )}
    </div>
  );
}

function Row({ left, children }: { left: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${left ? "justify-start slide-in-l" : "justify-end slide-in-r"}`}>
      {children}
    </div>
  );
}

/* ── 재판장 — 가운데, 가늘게 ─────────────────────────────── */

function JudgeLine({ msg }: { msg: Msg }) {
  const t = useCopy();
  return (
    <div className="rise flex flex-col items-center py-1.5">
      <div className="flex items-center gap-2 w-full max-w-[520px]">
        <span className="flex-1 h-px bg-gold/15" aria-hidden />
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.14em] text-gold/70 uppercase shrink-0">
          <IconGavel size={11} />
          {t.court.judge}
        </span>
        <span className="flex-1 h-px bg-gold/15" aria-hidden />
      </div>
      <p className="serif mt-2 max-w-[52ch] text-center text-[14px] sm:text-[15px] leading-[1.8] text-t1">
        {msg.text}
        {msg.streaming && (
          <span className="caret inline-block w-[2px] h-[14px] align-[-2px] ml-[1px] bg-gold" />
        )}
      </p>
    </div>
  );
}

/* ── 배심 ─────────────────────────────────────────────────── */

function JuryCard({ jurors, man }: { jurors: Juror[]; man: string }) {
  const t = useCopy();
  if (!jurors.length) return null;
  const avg = Math.round(jurors.reduce((n, j) => n + j.m, 0) / jurors.length);

  return (
    <div className="rise glass rounded-[17px] px-4 py-3.5">
      <div className="flex items-baseline gap-2 mb-2.5">
        <p className="text-[10.5px] font-semibold tracking-[0.14em] text-t3 uppercase">{t.court.juryHead}</p>
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-t4">
          {t.court.juryAvg(man, avg)}
        </span>
      </div>
      {/* 좁은 화면에서는 별명과 한 줄 평을 위아래로 나눈다 — 한 줄에 넣으면 평이 잘려 나간다 */}
      <div className="space-y-2 sm:space-y-1.5">
        {jurors.map((j, i) => (
          <div
            key={`${j.name}-${i}`}
            className="pop-in flex items-start sm:items-center gap-2.5"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <span className="font-mono text-[13px] font-bold text-t1 w-[26px] shrink-0 text-right pt-[1px] sm:pt-0">
              {j.m}
            </span>
            <span className="w-[42px] sm:w-[54px] h-[4px] rounded-full overflow-hidden flex shrink-0 track mt-[7px] sm:mt-0">
              <span className="bar-fill shrink-0" style={{ width: `${j.m}%`, background: MAN }} />
              <span className="flex-1" style={{ background: WOMAN }} />
            </span>
            <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-[11px] text-t4 truncate sm:max-w-[9rem] sm:shrink-0">
                {j.name}
              </span>
              <span className="text-[12px] text-t2 break-keep sm:truncate sm:min-w-0 sm:flex-1">
                {j.note}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 입력 중 ──────────────────────────────────────────────── */

function Typing({
  who,
  cast,
  man,
  woman,
}: {
  who: Who;
  cast: Cast;
  man: string;
  woman: string;
}) {
  const t = useCopy();
  if (who === "judge") {
    return (
      <p className="text-center text-[11.5px] text-gold/60 py-1">
        {t.court.judgeSpeaking}<Dots />
      </p>
    );
  }
  const left = who === "a";
  const tone = left ? MAN : WOMAN;
  const label = t.court.counselOf(left ? man : woman);
  const model = shortOf(left ? cast.a : cast.b);

  return (
    <Row left={left}>
      <div className="flex items-center gap-2 px-3 h-[34px] glass-2 rounded-[13px]">
        <span className="text-[11px]" style={{ color: tone }}>
          {label}
        </span>
        <span className="text-[10.5px] text-t4">{model}</span>
        <Dots />
      </div>
    </Row>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1 align-middle" aria-hidden>
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="dot-step block w-[3px] h-[3px] rounded-full bg-t3"
          style={{ animationDelay: `${i * 170}ms` }}
        />
      ))}
    </span>
  );
}
