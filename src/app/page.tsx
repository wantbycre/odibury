import { createSupabaseClient } from "@/lib/supabase";
import { WasteSearch } from "@/components/waste-search";
import type { Region, Item, Fee, Tip } from "@/types/db";

/**
 * 요청 시점에 데이터를 조회한다(force-dynamic).
 * - 빌드 시 Supabase 로 네트워크를 태우지 않으므로 CI/빌드가 외부 상태에 안 흔들린다.
 * - 데이터가 자주 안 바뀌면 이후 ISR(revalidate)로 최적화할 수 있다.
 */
export const dynamic = "force-dynamic";

// v1 은 관악구 단일 지역. 이후 [slug] 라우트로 다지역 확장.
const REGION_SLUG = "gwanak";

export default async function Home() {
  let region: Region | null = null;
  let items: Item[] = [];
  let fees: Fee[] = [];
  let tips: Tip[] = [];
  let errored = false;

  try {
    const supabase = createSupabaseClient();

    // 1) 활성 지역 조회
    const { data: regionData } = await supabase
      .from("region")
      .select("*")
      .eq("slug", REGION_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    region = regionData as Region | null;

    // 2) 지역이 있으면 품목/수수료/팁을 병렬 조회
    if (region) {
      const [itemsRes, feesRes, tipsRes] = await Promise.all([
        supabase.from("item").select("*").order("name"),
        supabase.from("fee").select("*").eq("region_id", region.id),
        supabase
          .from("tip")
          .select("*")
          .eq("region_id", region.id)
          .eq("status", "approved"),
      ]);
      items = (itemsRes.data as Item[]) ?? [];
      fees = (feesRes.data as Fee[]) ?? [];
      tips = (tipsRes.data as Tip[]) ?? [];
    }
  } catch {
    // env 미설정/네트워크 오류 등 → 아래 fallback 렌더
    errored = true;
  }

  // 데이터를 못 불러온 경우의 안내 화면
  if (errored || !region) {
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

  return <WasteSearch region={region} items={items} fees={fees} tips={tips} />;
}
