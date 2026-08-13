# 05 · 배포 (Vercel) + SEO

## 배포 (Vercel)

GitHub 연동 zero-config 배포.

1. [vercel.com](https://vercel.com) → Add New → Project → `wantbycre/odibury` import.
2. Next.js 자동 감지(빌드 설정 불필요).
3. **Environment Variables** (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 🔒 `SUPABASE_SERVICE_ROLE_KEY` 는 **넣지 않는다**(시드 스크립트 로컬 전용, 전권 키 노출 방지).
4. Deploy → main push마다 자동 재배포.

- 라이브: https://odibury.vercel.app
- 홈은 `force-dynamic`이라 요청마다 anon 키로 Supabase를 읽는다(RLS 공개 SELECT).

## SEO

`src/app/layout.tsx` 메타데이터 + `app/robots.ts`(/robots.txt) + `app/sitemap.ts`(/sitemap.xml).

- 키워드: 대형폐기물·지역별 수수료·분리배출·구별.
- 검색엔진 소유확인은 **env로**(값 있을 때만 meta 출력):
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (구글 서치콘솔)
  - `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` (네이버 서치어드바이저)
- 커스텀 도메인 붙이면 `NEXT_PUBLIC_SITE_URL` 지정 → canonical/OG/sitemap 자동 반영.

### 검색 등록 체크리스트

- [ ] 네이버 서치어드바이저 사이트 등록 + 소유확인 코드 → env 주입 → sitemap 제출
- [ ] 구글 서치콘솔 사이트 등록 + 소유확인 코드 → env 주입 → sitemap 제출
- [ ] 다음/카카오: 별도 meta 없이 URL 등록
