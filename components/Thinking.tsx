"use client";

import { useEffect, useState } from "react";

/**
 * 생각하는 중 표시.
 *
 * 점 세 개만 찍어 두면 멈춘 것처럼 보인다. 그래서 지금 무엇을 하고 있는지
 * 문장으로 바꿔가며 보여준다. 글자 위로 빛이 천천히 지나간다.
 */

const STAGES: Record<string, string[]> = {
  head: [
    "사업을 읽는 중",
    "어떤 축이 성패를 가르는지 보는 중",
    "필요한 부서를 추리는 중",
    "조직을 세우는 중",
  ],
  dept: [
    "자료를 여는 중",
    "비슷한 사례를 훑는 중",
    "숫자를 맞춰보는 중",
    "가정을 의심하는 중",
    "정리하는 중",
  ],
  meet: [
    "부서별 전제를 비교하는 중",
    "어긋나는 숫자를 찾는 중",
    "회의를 붙이는 중",
  ],
  diagnose: [
    "부서 의견을 모으는 중",
    "가장 약한 축을 찾는 중",
    "점수를 매기는 중",
    "진단서를 쓰는 중",
  ],
};

/** 한 줄씩 천천히 넘어간다 — 급하게 넘기면 읽히지 않는다 */
export function Thinking({
  kind = "dept",
  size = "sm",
}: {
  kind?: keyof typeof STAGES;
  size?: "sm" | "md";
}) {
  const lines = STAGES[kind] ?? STAGES.dept;
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // 마지막 줄에서 멈춘다. 끝없이 도는 것보다 기다리는 느낌이 정직하다.
      setI((n) => (n + 1 < lines.length ? n + 1 : n));
    }, 2600);
    return () => clearInterval(id);
  }, [lines]);

  // kind가 바뀌어 목록이 짧아져도 넘치지 않게 렌더 시점에 자른다
  const at = Math.min(i, lines.length - 1);

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <Orbit />
      <span
        key={at}
        className={`thinking rise font-medium truncate ${
          size === "md" ? "text-[13px]" : "text-[12px]"
        }`}
      >
        {lines[at]}
      </span>
    </span>
  );
}

/** 아주 느리게 도는 고리 — 스피너보다 조용하다 */
function Orbit() {
  return (
    <span className="relative shrink-0 w-[13px] h-[13px]" aria-hidden>
      <svg width="13" height="13" viewBox="0 0 14 14" className="block">
        <circle cx="7" cy="7" r="5.4" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" />
        <circle
          cx="7"
          cy="7"
          r="5.4"
          fill="none"
          stroke="rgba(244,246,250,.85)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="9 25"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 7 7"
            to="360 7 7"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </span>
  );
}

/** 점 세 개 — 자리에 여유가 없을 때 */
export function Dots({ label = "응답 중" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px] shrink-0" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="dot-step block w-[3px] h-[3px] rounded-full bg-t3"
          style={{ animationDelay: `${i * 240}ms` }}
        />
      ))}
    </span>
  );
}
