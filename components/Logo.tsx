/** 워드마크 — 겹쳐 놓인 탭 세 장. 앞의 한 장만 색이 산다. */
export function Logo({ size = 15 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-[7px] select-none shrink-0">
      <svg
        width={size * 1.32}
        height={size}
        viewBox="0 0 26 20"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="lg-front" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c3ccdd" />
          </linearGradient>
        </defs>
        <path d="M14 6a3 3 0 013-3h6a3 3 0 013 3v14h-12z" fill="#fff" fillOpacity=".16" />
        <path d="M8 4.5a3 3 0 013-3h6a3 3 0 013 3V20H8z" fill="#fff" fillOpacity=".3" />
        <path d="M0 3a3 3 0 013-3h8a3 3 0 013 3v17H0z" fill="url(#lg-front)" />
      </svg>
      <span className="text-[14.5px] font-bold tracking-[-0.03em] text-t1">멀티탭</span>
    </span>
  );
}
