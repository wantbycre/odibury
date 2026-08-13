import type { MetadataRoute } from "next";

/**
 * sitemap.xml (App Router 자동 생성 → /sitemap.xml).
 * v1 은 단일 홈 라우트. 다지역 개별 페이지(/[slug])가 생기면 여기서 지역별 URL을 확장한다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odibury.vercel.app";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
