import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "멀티탭 — 여러 AI를 한 창에",
  description:
    "질문 하나를 여러 AI에게 동시에 던지고 서로 반박시킵니다. AI 법인이 사업을 진단하고, 싸움은 AI 법정에서 재판에 부칩니다.",
};

export const viewport: Viewport = {
  themeColor: "#05060A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Nanum+Myeongjo:wght@400;700;800&display=swap"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
