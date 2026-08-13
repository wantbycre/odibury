// @ts-check
/**
 * 어디버려 시드 스크립트 (03단계)
 * ------------------------------------------------------------
 * seed/*.template.csv 를 읽어 Supabase 에 넣는다.
 * RLS 를 우회해야 하므로 반드시 service_role 키로 접속한다(브라우저 노출 금지).
 *
 * 실행:
 *   npm run seed
 *   (내부적으로: node --env-file=.env.local scripts/seed.mjs)
 *
 * 특징
 *   - 멱등(idempotent): 여러 번 돌려도 중복이 쌓이지 않는다.
 *       · region : slug 기준 upsert
 *       · item   : name 기준 select-or-insert (name 은 unique 제약이 없어 수동 처리)
 *       · fee    : (region,item,spec) 기준 upsert
 *       · tip    : 해당 지역 tip 을 지우고 다시 삽입(자연키가 없어 replace 전략)
 *   - CSV 의 자연키(region_slug, item_name)를 UUID 로 해석해 FK 를 채운다.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

// ---- 경로 계산: 이 스크립트 기준으로 seed 디렉터리를 찾는다 -------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = join(__dirname, "..", "seed");

// ---- 환경변수 로드 (node --env-file=.env.local 로 주입됨) --------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 .env.local 에 채우세요."
  );
  process.exit(1);
}

// service_role 클라이언트. 세션 저장 비활성(서버/CLI 용도).
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * CSV 파일을 헤더 기반 객체 배열로 읽는다.
 * @param {string} file - seed 디렉터리 내 파일명
 * @returns {Record<string, string>[]}
 */
function readCsv(file) {
  const raw = readFileSync(join(SEED_DIR, file), "utf8");
  return parse(raw, {
    columns: true, // 첫 줄을 헤더로
    skip_empty_lines: true,
    trim: true, // 값 양끝 공백 제거(따옴표 내부는 보존)
  });
}

/** 빈 문자열을 null 로 정규화(선택 컬럼용) */
const nz = (v) => (v === undefined || v === "" ? null : v);

async function main() {
  // ============================================================
  // 1) region : slug 기준 upsert
  // ============================================================
  const regionRows = readCsv("regions.template.csv").map((r) => ({
    sido: r.sido,
    sigungu: r.sigungu,
    name: r.name,
    slug: r.slug,
    report_url: nz(r.report_url),
    report_system: r.report_system,
    large_waste_method: nz(r.large_waste_method),
    recycle_guide_url: nz(r.recycle_guide_url),
    source_note: nz(r.source_note),
    source_updated_at: nz(r.source_updated_at),
    is_active: String(r.is_active).toLowerCase() === "true",
  }));

  const { data: regions, error: regionErr } = await supabase
    .from("region")
    .upsert(regionRows, { onConflict: "slug" })
    .select("id, slug");
  if (regionErr) throw regionErr;

  /** slug → region.id */
  const regionIdBySlug = new Map(regions.map((r) => [r.slug, r.id]));
  console.log(`✓ region: ${regions.length}건 upsert`);

  // ============================================================
  // 2) item : name 기준 select-or-insert (name 에 unique 제약 없음)
  // ============================================================
  const itemRows = readCsv("items.template.csv");

  // 이미 존재하는 품목명 → id 매핑
  const { data: existingItems, error: exErr } = await supabase
    .from("item")
    .select("id, name");
  if (exErr) throw exErr;
  /** name → item.id */
  const itemIdByName = new Map(existingItems.map((i) => [i.name, i.id]));

  // 아직 없는 품목만 insert 대상으로 추린다
  const toInsert = itemRows
    .filter((r) => !itemIdByName.has(r.name))
    .map((r) => ({
      name: r.name,
      category: r.category || "기타",
      waste_type: r.waste_type || "large_waste",
      // keywords 는 파이프(|)로 구분된 문자열 → 배열
      keywords: (r.keywords || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      default_method: nz(r.default_method),
    }));

  if (toInsert.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from("item")
      .insert(toInsert)
      .select("id, name");
    if (insErr) throw insErr;
    for (const it of inserted) itemIdByName.set(it.name, it.id);
  }
  console.log(
    `✓ item: 신규 ${toInsert.length}건 insert (전체 ${itemIdByName.size}건 매핑)`
  );

  // ============================================================
  // 3) fee : (region, item, spec) 기준 upsert
  // ============================================================
  const feeRows = readCsv("fees.template.csv").map((r) => {
    const region_id = regionIdBySlug.get(r.region_slug);
    const item_id = itemIdByName.get(r.item_name);
    if (!region_id) throw new Error(`fee: 알 수 없는 region_slug '${r.region_slug}'`);
    if (!item_id) throw new Error(`fee: 알 수 없는 item_name '${r.item_name}'`);
    return {
      region_id,
      item_id,
      spec_label: r.spec_label || "일반",
      amount_krw: Number.parseInt(r.amount_krw, 10),
      method: nz(r.method),
      note: nz(r.note),
    };
  });

  const { error: feeErr, count: feeCount } = await supabase
    .from("fee")
    .upsert(feeRows, {
      onConflict: "region_id,item_id,spec_label",
      count: "exact",
    });
  if (feeErr) throw feeErr;
  console.log(`✓ fee: ${feeRows.length}건 upsert`);

  // ============================================================
  // 4) tip : 대상 지역의 기존 tip 삭제 후 재삽입 (replace 전략)
  // ============================================================
  const tipRows = readCsv("tips.template.csv");
  const tipRegionIds = [
    ...new Set(tipRows.map((r) => regionIdBySlug.get(r.region_slug))),
  ].filter(Boolean);

  if (tipRegionIds.length > 0) {
    const { error: delErr } = await supabase
      .from("tip")
      .delete()
      .in("region_id", tipRegionIds);
    if (delErr) throw delErr;
  }

  const tipInsert = tipRows.map((r) => {
    const region_id = regionIdBySlug.get(r.region_slug);
    if (!region_id) throw new Error(`tip: 알 수 없는 region_slug '${r.region_slug}'`);
    return {
      region_id,
      // item_name 이 비어있으면 지역 전체 팁(null)
      item_id: r.item_name ? itemIdByName.get(r.item_name) ?? null : null,
      body: r.body,
      status: r.status || "approved",
    };
  });
  const { error: tipErr } = await supabase.from("tip").insert(tipInsert);
  if (tipErr) throw tipErr;
  console.log(`✓ tip: ${tipInsert.length}건 insert`);

  console.log("\n🎉 시드 완료");
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err.message ?? err);
  process.exit(1);
});
