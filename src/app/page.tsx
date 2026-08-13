import { createSupabaseClient } from "@/lib/supabase";
import { WasteSearch } from "@/components/waste-search";
import type { Region, Item, Fee, Tip } from "@/types/db";

/**
 * 요청 시점 조회(force-dynamic) — 빌드가 외부 상태(Supabase)에 흔들리지 않게.
 * 데이터가 소량(지역 수개·품목 수십·요금 수백)이라 전량 받아 클라이언트에서 필터링한다.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  let regions: Region[] = [];
  let items: Item[] = [];
  let fees: Fee[] = [];
  let tips: Tip[] = [];
  let errored = false;

  try {
    const supabase = createSupabaseClient();
    const [regionsRes, itemsRes, feesRes, tipsRes] = await Promise.all([
      supabase
        .from("region")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      supabase.from("item").select("*").order("name"),
      supabase.from("fee").select("*"),
      supabase.from("tip").select("*").eq("status", "approved"),
    ]);
    regions = (regionsRes.data as Region[]) ?? [];
    items = (itemsRes.data as Item[]) ?? [];
    fees = (feesRes.data as Fee[]) ?? [];
    tips = (tipsRes.data as Tip[]) ?? [];
  } catch {
    errored = true;
  }

  // 지역 데이터를 못 불러온 경우의 안내 화면
  if (errored || regions.length === 0) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold">어디버려 ♻️</h1>
        <p className="text-sm text-muted-foreground">
          데이터를 불러오지 못했어요. Supabase 환경변수(.env.local)와 시드 상태를
          확인해주세요.
        </p>
      </main>
    );
  }

  return (
    <WasteSearch regions={regions} items={items} fees={fees} tips={tips} />
  );
}
