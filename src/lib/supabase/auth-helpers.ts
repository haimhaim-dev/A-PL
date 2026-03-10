import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * API 라우트에서 현재 로그인한 사용자 조회 (쿠키 기반 세션)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error) {
    console.error("[auth-helpers] getCurrentUser error:", error.message);
    return null;
  }
  return user;
}

/**
 * ✅ 안전한 크레딧 차감 및 로그 기록
 * 
 * 이 함수는 직접 호출하지 말고, API 라우트에서 supabase.rpc('log_and_deduct_credits')를 직접 호출하세요.
 * 
 * @example
 * ```typescript
 * const { data, error } = await supabase.rpc('log_and_deduct_credits', {
 *   p_user_id: userId,
 *   p_amount: -1, // 차감할 금액 (음수)
 *   p_description: '퀴즈 생성 비용',
 *   p_quiz_id: quizId,
 *   p_type: 'usage'
 * });
 * ```
 */
export function getRecommendedCreditPattern() {
  return `
// ✅ 권장 패턴: 안전한 크레딧 차감
const { data: creditResult, error: creditError } = await supabase.rpc('log_and_deduct_credits', {
  p_user_id: userId,
  p_amount: -requiredCredits, // 차감할 금액 (음수)
  p_description: '서비스 이용 비용',
  p_quiz_id: quizId || null,
  p_type: 'usage'
});

if (creditError) {
  // 크레딧 부족 또는 기타 에러 처리
  if (creditError.message.includes('INSUFFICIENT_CREDITS')) {
    return { error: '크레딧이 부족합니다.' };
  }
  return { error: '크레딧 처리 중 오류가 발생했습니다.' };
}

// 성공 시 creditResult.remaining_credits 사용 가능
`;
}