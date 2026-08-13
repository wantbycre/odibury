import { createClient } from "@supabase/supabase-js";

/**
 * 공개 읽기용 Supabase 클라이언트 팩토리.
 *
 * - anon(public) 키만 사용한다. 우리 데이터는 RLS 공개 SELECT 정책이라
 *   익명 키로 읽기가 가능하고, 쓰기는 애초에 이 클라이언트로 하지 않는다.
 * - 세션/토큰 자동갱신을 끈다(서버 컴포넌트에서 요청마다 생성해 쓰는 용도).
 * - service_role 키는 이 파일에서 절대 사용하지 않는다(브라우저 번들 유출 방지).
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // env 누락 시 호출부에서 fallback UI 를 그릴 수 있게 명시적으로 던진다.
    throw new Error(
      "Supabase 환경변수 미설정: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
