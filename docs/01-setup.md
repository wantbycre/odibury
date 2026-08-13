# 01 · 초기 세팅 (scaffold)

## 완료 내용

- `create-next-app` 스캐폴딩 (App Router + TypeScript + Tailwind v4 + ESLint + `src/` + `@/*` alias).
- 스택: **Next.js 16.3.0 / React 19.2.8 / Tailwind v4 / TypeScript 5** (Trackr와 동일 — 자산 재활용).
- 루트 레이아웃 한국어화(`lang="ko"`, 검색 의도 기반 메타데이터).
- 한글 폰트 폴백 스택 추가(Geist엔 한글 글리프 없음 → OS 고딕 폴백).
- 임시 랜딩(`page.tsx`) — 아이덴티티/가치제안/개발단계 표시.
- 문서: `README.md`, `docs/00-concept.md`, `docs/01-setup.md`.
- `.gitignore`: `.env*` 무시하되 `.env.example`은 추적, `.kiro/`(KiroCrew 워크스페이스 설정) 무시.

## 로컬 개발

```bash
npm run dev     # http://localhost:3000 (dev 서버)
npm run build   # 프로덕션 빌드 = 전체 타입체크 게이트
npm run lint    # ESLint
```

> Node는 fnm 로 관리(기본 v22). 셸에서 node가 안 잡히면 `eval "$(fnm env)"` 후 사용.

## 작업 규칙 (odi 컨벤션)

1. **주석 꼼꼼히** — 무엇/왜를 설명하는 주석을 코드에 남긴다.
2. **단락마다 게이트** — 작업 한 단락이 끝나면 `next build`(전체 tsc) 통과를 확인하고 **바로 git push**.
3. **브랜치 + PR** — 단계마다 `setup/NN-*` 또는 `feat/*` 브랜치로 작업하고 gh로 PR 생성. 병합은 사용자가 수행.

## 개발 로드맵 (초안)

| 단계 | 내용 |
| --- | --- |
| 01 | 스캐폴딩 · 문서 · git 워크플로 (현재) |
| 02 | 데이터 모델 확정(region/item/fee/tip) + Supabase 스키마 |
| 03 | 관악구 실데이터 시딩(수수료표 + 신고 URL) |
| 04 | 핵심 플로우 UI: 동네 선택 → 품목 검색 → 결과 카드 |
| 05 | 딥링크 토스 + 크라우드소싱 제보 폼 |
| 06 | 다듬기(다크모드/반응형/빈상태) + 배포(Vercel) |
| 07 | 링크 헬스체크 cron + CI(lint/build 게이트) |

*(로드맵은 만들면서 보완한다 — ship first.)*
