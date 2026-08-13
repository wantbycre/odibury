"use client";

import { useMemo, useState } from "react";
import type { Region, Item, Fee, Tip } from "@/types/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** 원화 포맷: 3000 → "3,000원", 0 → "무료" */
function krw(amount: number) {
  return amount === 0 ? "무료" : `${amount.toLocaleString("ko-KR")}원`;
}

interface Props {
  regions: Region[];
  items: Item[];
  fees: Fee[];
  tips: Tip[];
}

/**
 * 핵심 플로우 UI (클라이언트, 다지역).
 * 지역 선택 → 품목 검색 → 선택 품목의 규격별 수수료 + 배출방법 + 신고 딥링크.
 * 데이터가 소량이라 전량 받아 클라이언트에서 필터링한다(라운드트립 0).
 */
export function WasteSearch({ regions, items, fees, tips }: Props) {
  // 기본 지역: 관악(gwanak)이 있으면 우선, 없으면 첫 지역
  const defaultRegionId =
    regions.find((r) => r.slug === "gwanak")?.id ?? regions[0].id;

  const [regionId, setRegionId] = useState(defaultRegionId);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const region = useMemo(
    () => regions.find((r) => r.id === regionId) ?? regions[0],
    [regions, regionId],
  );

  // 검색: 품목명 또는 keywords 동의어 부분일치(대소문자 무시)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      if (it.name.toLowerCase().includes(q)) return true;
      return it.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [items, query]);

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) ?? null,
    [items, selectedId],
  );

  // 선택 품목 × 현재 지역의 규격별 수수료(저렴한 순)
  const selectedFees = useMemo(() => {
    if (!selected) return [];
    return fees
      .filter((f) => f.item_id === selected.id && f.region_id === region.id)
      .sort((a, b) => a.amount_krw - b.amount_krw);
  }, [fees, selected, region]);

  // 팁: 현재 지역 + (이 품목 전용 또는 지역 전체)
  const selectedTips = useMemo(() => {
    return tips.filter(
      (t) =>
        t.region_id === region.id &&
        (t.item_id === null || (selected && t.item_id === selected.id)),
    );
  }, [tips, region, selected]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      {/* 헤더 */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          어디버려 <span className="text-primary">♻️</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          우리동네 기준 분리배출·대형폐기물 정보를 3초에
        </p>
      </header>

      <div className="flex justify-between items-end gap-2">
        {/* 지역 선택 */}
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="region" className="text-sm font-medium">
            동네 선택
          </label>
          <select
            id="region"
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="region" className="text-sm font-medium">
            품목 검색
          </label>
          {/* 검색창 */}
          <Input
            type="search"
            placeholder="예: 책상, 매트리스, 냉장고…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="품목 검색"
            className="h-11 text-base w-full"
          />
        </div>
      </div>

      <p className="text-sm font-medium mb-[-15px]">
        원하는 품목을 선택하세요.
      </p>

      {/* 품목 후보 칩 */}
      <div className="flex flex-wrap gap-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            &lsquo;{query}&rsquo; 와 맞는 품목이 없어요. 다른 이름으로
            검색해보세요.
          </p>
        ) : (
          filtered.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setSelectedId(it.id)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                selectedId === it.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {it.name}
            </button>
          ))
        )}
      </div>

      {/* 결과 카드 */}
      {selected && (
        <Card className="bg-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{selected.name}</CardTitle>
              <Badge variant="destructive">{selected.category}</Badge>
              <span className="ml-auto text-sm text-muted-foreground">
                {region.name}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* 규격별 수수료 */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                수수료
              </h3>
              {selectedFees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {region.name}에는 이 품목의 수수료 정보가 아직 없어요.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {selectedFees.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-start justify-between gap-4 py-2"
                    >
                      <span className="text-sm text-foreground">
                        {f.spec_label}
                        {/* 무상수거 등 비고 */}
                        {f.note && (
                          <span className="mt-0.5 block text-xs text-destructive">
                            {f.note}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono font-semibold text-primary">
                        {krw(f.amount_krw)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 배출 방법(지역 공통 절차) */}
            {region.large_waste_method && (
              <section>
                <h3 className="mb-1 text-sm font-semibold text-muted-foreground">
                  배출 방법
                </h3>
                <p className="text-sm leading-6 text-foreground">
                  {region.large_waste_method}
                </p>
              </section>
            )}

            {/* 지역 꿀팁 */}
            {selectedTips.length > 0 && (
              <section className="rounded-lg bg-white p-3">
                <h3 className="mb-1 text-sm font-semibold">
                  💡 알아두면 좋아요
                </h3>
                <ul className="flex flex-col gap-1">
                  {selectedTips.map((t) => (
                    <li key={t.id} className="text-sm text-muted-foreground">
                      · {t.body}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 신고 딥링크: 실제 신고·결제는 지자체 시스템으로 토스 */}
            {region.report_url ? (
              <a
                href={region.report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button size="lg" className="w-full">
                  {region.sigungu} 배출 신고하러 가기 ↗
                </Button>
              </a>
            ) : (
              <Button size="lg" className="w-full" disabled>
                신고 링크 준비 중
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              신고·결제는 {region.sigungu} 시스템에서 진행돼요. 어디버려는
              정보만 안내해요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
