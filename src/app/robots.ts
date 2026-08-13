import type { MetadataRoute } from "next";

/**
 * robots.txt (App Router 자동 생성 → /robots.txt).
 * 모든 크롤러 허용 + sitemap 위치 안내.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odibury.vercel.app";
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
