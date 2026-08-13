/**
 * 어디버려 DB 타입 정의.
 * supabase/schema.sql 의 테이블과 1:1 로 대응한다.
 * (스키마를 바꾸면 이 파일도 반드시 함께 수정한다 — 단일 진실 공급원은 schema.sql)
 *
 * 이후 Supabase 클라이언트 도입 시, 이 타입들을 쿼리 결과에 붙여
 * 컴파일 타임 안전성을 확보한다.
 */

/** 대형폐기물 신고를 처리하는 시스템 종류 */
export type ReportSystem = "자체" | "정부24" | "여기로" | "빼기" | "기타";

/** 품목 대분류 */
export type ItemCategory = "가구" | "가전" | "생활" | "침구" | "기타";

/** 배출 유형: 대형폐기물(수수료 신고) vs 일반 분리배출 */
export type WasteType = "large_waste" | "recycle";

/** 크라우드소싱 팁 모더레이션 상태 */
export type TipStatus = "pending" | "approved" | "rejected";

/** 지자체(시군구) */
export interface Region {
  id: string;
  sido: string; // 시/도 (예: 서울특별시)
  sigungu: string; // 시군구 (예: 관악구)
  name: string; // 표시명 (예: 서울 관악구)
  slug: string; // URL 슬러그 (예: gwanak)
  report_url: string | null; // 대형폐기물 신고 딥링크
  report_system: ReportSystem;
  large_waste_method: string | null; // 대형폐기물 일반 배출 절차 안내문
  recycle_guide_url: string | null; // 분리배출 안내 페이지(선택)
  source_note: string | null; // 데이터 출처 메모
  source_updated_at: string | null; // 출처 기준일 (ISO date 문자열)
  is_active: boolean;
  created_at: string;
}

/** 품목 카탈로그(지자체 무관) */
export interface Item {
  id: string;
  name: string; // 품목명 (예: 책상)
  category: ItemCategory;
  waste_type: WasteType;
  keywords: string[]; // 검색 동의어
  default_method: string | null; // 일반적 배출 방법(재활용 품목 기본 안내)
  created_at: string;
}

/** region × item × 규격 수수료 */
export interface Fee {
  id: string;
  region_id: string;
  item_id: string;
  spec_label: string; // 규격 구분 (예: '길이 1m 미만')
  amount_krw: number; // 수수료(원) — 정수
  method: string | null; // 품목별 배출 방법 override(선택)
  note: string | null; // 비고
  created_at: string;
}

/** 지역 크라우드소싱 꿀팁 */
export interface Tip {
  id: string;
  region_id: string;
  item_id: string | null; // null 이면 지역 전체 팁
  body: string;
  status: TipStatus;
  created_at: string;
}

/**
 * 화면(결과 카드)에서 쓰기 좋은 조인 결과 형태.
 * 특정 지자체에서 한 품목을 조회했을 때의 묶음:
 * 품목 + 규격별 요금 목록 + 지역 신고 정보.
 */
export interface ItemFeeResult {
  item: Item;
  region: Region;
  fees: Fee[]; // 규격별 수수료(오름차순 정렬 권장)
}
