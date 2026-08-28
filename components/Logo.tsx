import Image from "next/image";

/** 워드마크 — 실제 멀티탭 로고. 흰 배경 스티커라서 살짝 띄운 카드 위에 얹는다. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none shrink-0">
      <span
        className="grid place-items-center rounded-[9px] overflow-hidden shrink-0"
        style={{
          width: size,
          height: size,
          boxShadow: "0 1px 0 rgba(255,255,255,.5) inset, 0 6px 14px -8px rgba(0,0,0,.6)",
        }}
      >
        <Image src="/logo.png" alt="" width={size} height={size} priority className="block" />
      </span>
      <span className="text-[14.5px] font-bold tracking-[-0.03em] text-t1">멀티탭</span>
    </span>
  );
}
