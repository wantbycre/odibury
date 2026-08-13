-- ============================================================
-- 어디버려(odibury) · 스키마 DDL (Supabase / PostgreSQL)
-- ------------------------------------------------------------
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 설계 원칙
--   · region(지자체)이 최상위. 신고 링크/시스템/배출방법을 보유.
--   · item(품목)은 지자체와 무관한 "카탈로그". 검색 동의어(keywords) 포함.
--   · fee = region × item × 규격(spec). 같은 품목도 크기별로 요금이 달라
--          여러 행으로 표현한다(예: 책상 1m 미만/이상).
--   · tip = 지역 크라우드소싱 꿀팁(선택적으로 특정 품목에 연결).
-- 저작권/성격
--   · 수수료·품목은 조례/고시 기반 "사실 데이터" → 저작권 대상 아님.
--   · 개인정보 없음. 전 국민 공개 읽기(anon SELECT) 전제.
-- ============================================================

-- UUID 생성 함수(gen_random_uuid)를 위해 pgcrypto 활성화(Supabase는 보통 기본 활성).
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) region : 지자체(시군구)
-- ------------------------------------------------------------
create table if not exists public.region (
  id                 uuid primary key default gen_random_uuid(),
  sido               text not null,                 -- 시/도 (예: 서울특별시)
  sigungu            text not null,                 -- 시군구 (예: 관악구)
  name               text not null,                 -- 표시명 (예: 서울 관악구)
  slug               text not null unique,          -- URL 슬러그 (예: gwanak)
  -- 대형폐기물 신고를 넘길 딥링크와 시스템 종류
  report_url         text,                          -- 신고 랜딩 URL(딥링크 토스 대상)
  report_system      text not null default '자체'    -- 신고 시스템 종류
                     check (report_system in ('자체','정부24','여기로','빼기','기타')),
  large_waste_method text,                          -- 대형폐기물 일반 배출 절차(요약 안내문)
  recycle_guide_url  text,                          -- (선택) 분리배출 안내 페이지 URL
  source_note        text,                          -- 데이터 출처 메모(예: 관악구 조례 별표)
  source_updated_at  date,                          -- 출처 기준일(수수료 개정 추적)
  is_active          boolean not null default true, -- 서비스 노출 여부
  created_at         timestamptz not null default now()
);

comment on table  public.region is '지자체(시군구). 대형폐기물 신고 링크/시스템/배출방법 보유';
comment on column public.region.report_url is '대형폐기물 신고 랜딩 URL. 사용자를 이 링크로 토스한다';
comment on column public.region.report_system is '신고 처리 주체(자체/정부24/여기로/빼기/기타)';

-- ------------------------------------------------------------
-- 2) item : 품목 카탈로그 (지자체 무관)
-- ------------------------------------------------------------
create table if not exists public.item (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,                 -- 품목명 (예: 책상)
  category       text not null default '기타'    -- 대분류
                 check (category in ('가구','가전','생활','침구','기타')),
  -- 대형폐기물(수수료 신고) vs 일반 분리배출(재활용). v1은 large_waste 중심.
  waste_type     text not null default 'large_waste'
                 check (waste_type in ('large_waste','recycle')),
  keywords       text[] not null default '{}',  -- 검색 동의어(예: {책상,테이블,데스크})
  default_method text,                           -- 일반적 배출 방법(재활용 품목용 기본 안내)
  created_at     timestamptz not null default now()
);

comment on table  public.item is '품목 카탈로그. 지자체와 무관한 공통 목록';
comment on column public.item.keywords is '검색 동의어 배열. 부분 검색/오탈자 매칭용';
comment on column public.item.waste_type is 'large_waste(대형폐기물) | recycle(일반 분리배출)';

-- 검색 동의어(GIN) 인덱스 : keywords 배열 포함 검색 가속
create index if not exists item_keywords_gin on public.item using gin (keywords);

-- ------------------------------------------------------------
-- 3) fee : region × item × 규격 → 수수료
-- ------------------------------------------------------------
create table if not exists public.fee (
  id          uuid primary key default gen_random_uuid(),
  region_id   uuid not null references public.region(id) on delete cascade,
  item_id     uuid not null references public.item(id)   on delete cascade,
  spec_label  text not null default '일반',    -- 규격 구분(예: '길이 1m 미만', '일반')
  amount_krw  integer not null                -- 수수료(원). 정수로 저장(반올림 이슈 회피)
              check (amount_krw >= 0),
  method      text,                           -- (선택) 이 품목만의 배출 방법 override
  note        text,                           -- 비고(예: '분해 시 2점 처리')
  created_at  timestamptz not null default now(),
  -- 같은 지자체·품목·규격 조합은 유일
  unique (region_id, item_id, spec_label)
);

comment on table  public.fee is 'region×item×규격 수수료. 크기별 요금은 여러 행으로 표현';
comment on column public.fee.amount_krw is '수수료(원). 통화는 정수 저장이 원칙';

-- 조회 패턴(지자체별 품목 요금) 가속 인덱스
create index if not exists fee_region_item_idx on public.fee (region_id, item_id);

-- ------------------------------------------------------------
-- 4) tip : 크라우드소싱 로컬 꿀팁
-- ------------------------------------------------------------
create table if not exists public.tip (
  id         uuid primary key default gen_random_uuid(),
  region_id  uuid not null references public.region(id) on delete cascade,
  item_id    uuid references public.item(id) on delete cascade, -- null=지역 전체 팁
  body       text not null,                  -- 팁 본문(예: '관악구는 일요일 배출 안 받음')
  status     text not null default 'approved' -- 노출 상태(모더레이션)
             check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

comment on table public.tip is '지역 크라우드소싱 꿀팁. item_id 가 null 이면 지역 전체 팁';

create index if not exists tip_region_idx on public.tip (region_id);

-- ============================================================
-- RLS(Row Level Security)
-- ------------------------------------------------------------
-- 데이터는 전부 공개 사실정보이므로 anon 에게 "읽기"만 허용한다.
-- 쓰기(시드/관리)는 service_role 키로 수행(RLS 우회)하거나 이후 관리자 경로로.
-- tip 의 사용자 제보 insert 정책은 07 단계(제보 폼)에서 추가한다.
-- ============================================================
alter table public.region enable row level security;
alter table public.item   enable row level security;
alter table public.fee    enable row level security;
alter table public.tip    enable row level security;

-- 공개 읽기 정책 (anon + authenticated 모두 SELECT 허용)
create policy "region public read" on public.region for select using (true);
create policy "item public read"   on public.item   for select using (true);
create policy "fee public read"    on public.fee    for select using (true);
-- tip 은 승인(approved)된 것만 공개
create policy "tip approved read"  on public.tip    for select using (status = 'approved');
