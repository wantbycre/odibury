/**
 * 홈(랜딩) 임시 화면.
 * 01-setup 단계에서는 스캐폴딩이 정상 동작하는지 확인하는 최소 플레이스홀더만 둔다.
 * 실제 핵심 플로우(동네 선택 → 품목 검색 → 수수료·방법·신고링크)는
 * 이후 단계(데이터 모델/검색 UI)에서 구현한다.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      {/* 서비스 아이덴티티: 한국어 이름을 크게 노출 */}
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        어디버려 <span className="text-emerald-600">♻️</span>
      </h1>

      {/* 한 줄 가치 제안(value proposition) */}
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        이거 어디에 어떻게 버려? 우리동네 기준 분리배출·대형폐기물 정보를
        3초 만에 확인하세요.
      </p>

      {/* 현재 개발 단계 표시 (임시) */}
      <p className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        🚧 01-setup · 프로젝트 스캐폴딩 완료
      </p>
    </main>
  );
}
