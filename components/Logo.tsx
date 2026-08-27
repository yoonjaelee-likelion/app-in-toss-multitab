/** 워드마크 — 겹쳐 놓인 탭 세 장. 앱이 하는 일이 그것뿐이라 그 이상 그리지 않았다. */
export function Logo({ size = 15 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-[7px] select-none">
      <svg
        width={size * 1.32}
        height={size}
        viewBox="0 0 26 20"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path d="M14 6a3 3 0 013-3h6a3 3 0 013 3v14h-12z" fill="#C6CAD2" />
        <path d="M8 4.5a3 3 0 013-3h6a3 3 0 013 3V20H8z" fill="#7C838F" />
        <path d="M0 3a3 3 0 013-3h8a3 3 0 013 3v17H0z" fill="#16181D" />
      </svg>
      <span className="text-[14.5px] font-bold tracking-[-0.03em] text-t1">멀티탭</span>
    </span>
  );
}
