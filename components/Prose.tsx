import type { ReactNode } from "react";

const LABEL = /^(동의|반박|그래서|합의|갈림|결론|발견|우려|치명상|합격선|판정)\s*[:：]\s*/;

/**
 * 답변 본문. 무거운 마크다운 대신 문단·목록·라벨 세 가지만 다룬다.
 * 셋이면 충분하고, 그 이상은 나란히 놓고 읽을 때 방해가 된다.
 */
export function Prose({ text, color }: { text: string; color: string }) {
  const out: ReactNode[] = [];
  let bullets: string[] = [];

  const flush = (key: string) => {
    if (!bullets.length) return;
    out.push(
      <ul key={key} className="my-2.5 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="prose-ko flex gap-2.5">
            <span
              className="mt-[10px] w-[4px] h-[4px] rounded-full shrink-0"
              style={{ background: color, opacity: 0.75 }}
            />
            <span className="min-w-0">{b}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  text.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*[-•*]\s+/.test(line)) {
      bullets.push(line.replace(/^\s*[-•*]\s+/, ""));
      return;
    }
    flush(`u${i}`);
    if (!line.trim()) return;

    const m = LABEL.exec(line);
    if (m) {
      out.push(
        <p key={i} className="prose-ko my-2.5">
          <span
            className="inline-flex items-center h-[18px] px-[7px] mr-1.5 rounded-[5px] text-[11px] font-semibold align-[1px]"
            style={{ color, background: `${color}22` }}
          >
            {m[1]}
          </span>
          {line.slice(m[0].length)}
        </p>,
      );
      return;
    }
    out.push(
      <p key={i} className="prose-ko my-2.5">
        {line}
      </p>,
    );
  });
  flush("u-end");

  return <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{out}</div>;
}
