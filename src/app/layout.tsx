import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * 폰트 로딩.
 * next/font 로 Geist(본문)와 Geist_Mono(코드/숫자)를 self-host 하여
 * 레이아웃 시프트(CLS) 없이 CSS 변수(--font-geist-sans 등)로 노출한다.
 * 실제 폰트 매핑은 globals.css 의 @theme(--font-sans/--font-mono)에서 처리.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 사이트 전역 메타데이터.
 * 어디버려(odibury)는 "이거 어디에·어떻게·얼마에 버려?"를 지자체별로 3초에
 * 판단해주는 분리배출 정보 서비스다. 검색 유입이 핵심 유통 채널이라
 * title/description 을 한국어 검색 의도에 맞춰 작성한다.
 */
export const metadata: Metadata = {
  title: "어디버려 – 우리동네 분리배출·대형폐기물 안내",
  description:
    "이거 어디에 어떻게 버려? 우리동네 기준 분리배출 방법과 대형폐기물 수수료를 한 화면에서 확인하고, 신고는 지자체 시스템으로 바로 연결해요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // lang="ko": 한국어 서비스이므로 스크린리더/검색엔진에 언어를 명시한다.
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* min-h-full + flex-col: 페이지가 짧아도 푸터/콘텐츠를 세로로 꽉 채우기 위한 골격 */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
