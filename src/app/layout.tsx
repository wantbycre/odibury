import type { Metadata } from "next";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * 폰트 로딩.
 * 본문은 한글 서비스이므로 Noto Sans KR 을 self-host 한다.
 * next/font 가 CSS 변수 `--font-sans` 로 노출하고, globals.css 의
 * `@theme(--font-sans)` + `html { @apply font-sans }` 가 이 변수를 소비한다.
 * 숫자/코드(수수료·규격 등)는 Geist Mono 로 별도 노출한다(--font-geist-mono).
 */
const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 사이트 절대 URL(정규 URL·OG·sitemap 기준).
 * 커스텀 도메인을 붙이면 NEXT_PUBLIC_SITE_URL 로 덮어쓴다.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://odibury.vercel.app";

/**
 * 검색엔진 사이트 소유확인 코드(선택).
 * 값이 있을 때만 meta 로 출력한다(구글 서치콘솔 / 네이버 서치어드바이저에서 발급).
 */
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;

/**
 * 사이트 전역 메타데이터 (SEO).
 * 검색 유입이 핵심 유통 채널이라 한국어 검색 의도("대형폐기물", "지역별 수수료",
 * "분리배출")에 맞춰 title/description/keywords 를 구성한다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // 하위 페이지는 "<페이지> · 어디버려" 형태로, 홈은 default 사용
    default: "어디버려 – 우리동네 대형폐기물·분리배출 수수료 안내",
    template: "%s · 어디버려",
  },
  description:
    "이거 어디에 어떻게 버려? 관악·강남·노원·영등포 등 우리동네 기준 대형폐기물 수수료와 분리배출 방법을 3초에 확인하고, 신고는 지자체 시스템으로 바로 연결해요.",
  keywords: [
    "대형폐기물",
    "대형폐기물 수수료",
    "대형폐기물 신고",
    "폐기물 배출",
    "분리배출",
    "지역별 폐기물",
    "구별 대형폐기물 수수료",
    "폐기물 스티커",
    "관악구 대형폐기물",
    "강남구 대형폐기물",
    "노원구 대형폐기물",
    "영등포구 대형폐기물",
    "매트리스 버리는 법",
    "소파 버리는 비용",
    "어디버려",
  ],
  applicationName: "어디버려",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "어디버려",
    url: SITE_URL,
    title: "어디버려 – 우리동네 대형폐기물·분리배출 수수료 안내",
    description:
      "우리동네 기준 대형폐기물 수수료와 배출 방법을 3초에. 신고는 지자체 시스템으로 연결.",
  },
  robots: {
    index: true,
    follow: true,
  },
  // 소유확인 코드는 env 에 있을 때만 출력(구글은 google, 네이버는 other 로).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ...(naverVerification
      ? { other: { "naver-site-verification": naverVerification } }
      : {}),
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // lang="ko": 한국어 서비스이므로 스크린리더/검색엔진에 언어를 명시한다.
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* min-h-full + flex-col: 페이지가 짧아도 콘텐츠를 세로로 꽉 채우기 위한 골격 */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
