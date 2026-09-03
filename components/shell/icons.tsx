/**
 * 아이콘 — 전부 같은 규격으로 그린다.
 * 16 그리드, 선 굵기 1.5, 끝은 둥글게. 채우지 않는다.
 * 하나라도 다른 굵기가 섞이면 목록이 어긋나 보인다.
 */

type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/** 인비즈 — 검진 그래프 */
export const IconPulse = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M1.6 8.4h2.6l1.5-4 2.3 8 1.6-4.6 1.2 2.2h3.6" />
  </svg>
);

/** 대화 — 말풍선 하나에 점 셋. 여럿이 한 번에 답한다는 뜻 */
export const IconChatMulti = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14 8.4a5.6 5.6 0 0 1-5.8 5.6c-.9 0-1.8-.2-2.5-.5L2 14.6l1.2-3.4A5.4 5.4 0 0 1 2.4 8.4 5.6 5.6 0 0 1 8.2 2.8 5.6 5.6 0 0 1 14 8.4Z" />
    <path d="M5.9 8.4h.01M8.2 8.4h.01M10.5 8.4h.01" strokeWidth="1.9" />
  </svg>
);

/** 저울 — 지금은 안 쓰지만 판정이라는 개념이 돌아올 수 있어 남겨 둔다 */
export const IconScales = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M8 2.2v11.6M4.5 13.8h7M3 4.6h10M3 4.6 1.4 8.6a2.1 2.1 0 0 0 3.2 0L3 4.6ZM13 4.6l-1.6 4a2.1 2.1 0 0 0 3.2 0L13 4.6Z" />
  </svg>
);

/** 레드팀 — 조준 */
export const IconTarget = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="8" cy="8" r="5.6" />
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 .8v2.2M8 13v2.2M.8 8H3M13 8h2.2" />
  </svg>
);

/** 법원 — 의사봉 */
export const IconGavel = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m3.2 9.6 3.4-3.4M2 11l1.6-1.6a.9.9 0 0 1 1.3 0l.9.9a.9.9 0 0 1 0 1.3L4.2 13.2a.9.9 0 0 1-1.3 0L2 12.3a.9.9 0 0 1 0-1.3ZM7.4 2.6l6 6M9.6 1.4 8 3l4.9 4.9 1.7-1.6a.9.9 0 0 0 0-1.3l-3.6-3.6a.9.9 0 0 0-1.4 0ZM8.4 13.6h6" />
  </svg>
);

/** 위로 — 말풍선 두 개 */
export const IconChat = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5.6 10.4H3.9a2 2 0 0 1-2-2V4.6a2 2 0 0 1 2-2h5.2a2 2 0 0 1 2 2v.6" />
    <path d="M7.2 6.2h4.9a2 2 0 0 1 2 2v3.4a2 2 0 0 1-2 2h-.9v1.8l-2.2-1.8H7.2a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2Z" />
  </svg>
);

export const IconPlus = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M8 3.2v9.6M3.2 8h9.6" />
  </svg>
);

/** 사이드바 접기 */
export const IconPanel = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="2.4" />
    <path d="M6.2 2.6v10.8" />
  </svg>
);

export const IconSearch = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="7.2" cy="7.2" r="4.6" />
    <path d="m10.6 10.6 3 3" />
  </svg>
);

export const IconTrash = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2.8 4.2h10.4M6.4 4.2V2.9h3.2v1.3M4.2 4.2l.6 8.3a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9l.6-8.3" />
  </svg>
);

export const IconClose = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const IconArrow = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const IconCheck = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m3.2 8.4 3.2 3.2 6.4-7.2" />
  </svg>
);

/** 설정 — 톱니 대신 손잡이 두 개. 톱니는 어느 앱에나 있다 */
export const IconGear = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2.4 5.2h11.2M2.4 10.8h11.2" />
    <circle cx="6" cy="5.2" r="1.9" />
    <circle cx="10.4" cy="10.8" r="1.9" />
  </svg>
);

/** 19금 봉인 */
export const IconSeal = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M8 1.4 13.6 4v4.2c0 3-2.3 5.4-5.6 6.4-3.3-1-5.6-3.4-5.6-6.4V4L8 1.4Z" />
    <path d="M6.2 8.2h3.6M8 6.4v3.6" />
  </svg>
);
