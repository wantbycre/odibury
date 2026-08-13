# 03 · 관악구 실데이터 시딩

## 데이터 출처 (검증됨)

관악구는 **자체 시스템 "스마트클린 관악"**(`smartclean.gwanak.go.kr`)으로 대형폐기물을
신고·결제한다. 정부24/여기로/빼기 아님.

- **신고 URL(딥링크 대상)**: https://smartclean.gwanak.go.kr/online/bulky/request
- **전화 신고**: 02-882-5677
- **조례 근거**: 서울특별시 관악구 폐기물 관리 조례 제26조
- **수수료·품목**: 스마트클린 관악 신고시스템의 실제 품목 DB에서 추출(추정치 아님).
  단, 시스템 안내에 "일부 품목 수수료 변동 가능" 명시.
- **일부 폐가전 무상방문수거**: 1599-0903 (https://www.15990903.or.kr)

> 모두 사실 데이터(조례·요금)라 저작권 클린. 응답 본문을 저장·재배포하지 않고
> 품목명/규격/금액이라는 사실만 보관한다.

## 시드 파일

`seed/*.template.csv` — 공개 사실데이터이므로 레포에 커밋.

| 파일 | 내용 |
| --- | --- |
| `regions.template.csv` | 관악구 1건(신고 URL·시스템·배출방법) |
| `items.template.csv` | 품목 18종(가구/가전/생활/침구) + 검색 동의어 |
| `fees.template.csv` | 관악구 규격별 수수료 38건 (자연키: region_slug+item_name) |
| `tips.template.csv` | 관악구 배출 팁 3건 |

## 임포트 실행

```bash
npm run seed
# = node --env-file=.env.local scripts/seed.mjs
```

- `.env.local` 에 `SUPABASE_SERVICE_ROLE_KEY` 가 채워져 있어야 한다(RLS 우회).
- **멱등(idempotent)**: 여러 번 실행해도 중복이 쌓이지 않는다.
  - region: `slug` upsert · item: `name` select-or-insert · fee: `(region,item,spec)` upsert · tip: 지역 tip 삭제 후 재삽입.

## 결과

```
✓ region: 1건 · item: 18건 · fee: 38건 · tip: 3건
```

## 다음 단계

04 · 핵심 플로우 UI — 동네 선택(관악구) → 품목 검색 → 규격별 수수료 + 배출방법 +
`report_url` 딥링크 결과 카드. (Supabase 클라이언트로 조회 연결)
