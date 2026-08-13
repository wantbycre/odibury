# 02 · 데이터 모델 & 스키마

## 개요

핵심 질문 **"이 품목, 우리동네선 얼마고 어떻게 신고해?"** 에 답하기 위한 최소 모델.
지자체(`region`)를 최상위로, 품목(`item`)은 지자체 무관 카탈로그로 두고,
둘의 교차점에 규격별 수수료(`fee`)를 둔다. 지역 꿀팁(`tip`)은 크라우드소싱용.

```
region 1 ── * fee * ── 1 item
   │                      
   └── * tip *────────────┘ (tip.item_id 는 nullable = 지역 전체 팁)
```

## 테이블

| 테이블 | 역할 | 핵심 컬럼 |
| --- | --- | --- |
| `region` | 지자체(시군구) | `slug`, `report_url`(딥링크), `report_system`, `large_waste_method` |
| `item` | 품목 카탈로그 | `name`, `category`, `waste_type`, `keywords[]`(검색 동의어) |
| `fee` | region×item×규격 수수료 | `spec_label`, `amount_krw`(정수 원), `unique(region,item,spec)` |
| `tip` | 지역 크라우드소싱 팁 | `body`, `status`(pending/approved/rejected) |

### 설계 결정

- **수수료는 정수(원)로 저장** — 통화 반올림/부동소수 오차 회피.
- **규격은 행으로 분리** — "책상 1m 미만/이상"처럼 같은 품목의 크기별 요금을
  컬럼이 아니라 `fee` 다중 행(`spec_label`)으로 표현 → 확장 자유롭고 스키마 안정.
- **`keywords[]` + GIN 인덱스** — "데스크/테이블" 같은 동의어·오탈자 검색 대응.
- **`item` 은 지자체 무관** — 품목 카탈로그를 한 번만 관리하고, 지역차는 `fee`가 흡수.
- **`waste_type`** — v1은 `large_waste`(대형폐기물) 중심, `recycle`(일반 분리배출)은
  같은 테이블로 자연 확장(로드맵 뒤 단계).

## RLS 방침

모든 데이터가 **공개 사실정보 + 개인정보 없음** 이므로:

- `region/item/fee` : anon 포함 **공개 SELECT** 정책.
- `tip` : `status='approved'` 인 것만 공개 SELECT.
- **쓰기(시드/관리)는 `service_role` 키로 수행**(RLS 우회). 사용자 제보 insert 정책은
  07 단계(제보 폼)에서 추가.

> Trackr 때 겪은 "Table Editor 로 만들면 RLS 기본 ON → anon insert 거부" 이슈를
> 여기서는 **처음부터 공개 읽기 정책 + service_role 시드**로 회피한다.

## 실행 순서

1. Supabase 프로젝트 생성 → `.env.local` 에 URL/anon 키 입력(형식은 `.env.example`).
2. SQL Editor 에서 [`supabase/schema.sql`](../supabase/schema.sql) 실행.
3. (03단계) 시드: 아래 CSV 를 채워 `service_role` 키로 임포트.

## 시드 CSV 포맷

`seed/*.template.csv` — **공개 사실 데이터이므로 레포에 커밋**(Trackr 와 다른 점).
`fee`/`tip` 은 UUID 대신 **자연키**(`region_slug`, `item_name`)로 작성하고,
03단계 임포트 스크립트가 id 로 해석한다.

| 파일 | 키/특이사항 |
| --- | --- |
| `regions.template.csv` | `slug` 가 자연키. `report_url` 은 03에서 실값 검증 후 채움 |
| `items.template.csv` | `keywords` 는 `|`(파이프)로 구분 → 배열로 로드 |
| `fees.template.csv` | `region_slug`,`item_name`,`spec_label` 조합이 유일. `amount_krw` 는 **EXAMPLE → 03에서 관악구 조례 실값으로 교체** |
| `tips.template.csv` | `item_name` 비우면 지역 전체 팁 |

> ⚠️ 현재 CSV 의 수수료 숫자는 **포맷 예시**다. 03단계에서 관악구 조례/고시 실값으로 반드시 교체한다.

## 다음 단계

03 · 관악구 실데이터 수집(신고 URL + 조례 수수료표) → 임포트 스크립트 작성 → 시드.
