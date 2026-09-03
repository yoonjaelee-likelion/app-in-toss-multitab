import type { Metadata, Viewport } from "next";
import { SettingsProvider, THEME_BOOT } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "멀티탭 — 여러 AI를 한 창에",
  description:
    "질문 하나를 여러 AI에게 동시에 던지고 서로 반박시킵니다. AI 법인이 사업을 진단하고, 싸움은 AI 법정에서 재판에 부칩니다.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EDE5" },
    { media: "(prefers-color-scheme: dark)", color: "#16130F" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /* lang과 data-theme은 아래 스크립트가 첫 그림 전에 덮어쓴다.
       suppressHydrationWarning이 없으면 서버가 그린 값과 달라졌다고 React가 경고한다 —
       여기서는 달라지는 게 정상이다. */
    <html lang="ko" data-theme="light" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* 저장된 테마를 첫 페인트 전에 박아 넣는다.
            이게 없으면 어두운 화면을 쓰는 사람에게 흰 화면이 한 번 번쩍인다. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* 라틴은 Jakarta가, 한글은 Pretendard가 받는다 — 브라우저가 글자마다 고른다 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@500;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap"
        />
      </head>
      <body className="min-h-full">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
