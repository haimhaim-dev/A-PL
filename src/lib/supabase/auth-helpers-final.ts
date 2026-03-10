import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * 최종 리팩토링된 인증 헬퍼 - 단순하고 안전한 구조
 */

export interface CreditDeductionResult {
  success: boolean;
  remaining_credits: number;
  amount_deducted: number;
  error?: string;
}

/**
 * API 라우트에서 현재 로그인한 사용자 조회
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: any }> {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  
  if (error) {
    console.error("[auth-helpers] getCurrentUser error:", error.message);
    return { user: null, error };
  }
  
  return { user, error: null };
}

/**
 * 원자적 크레딧 차감 - 확인과 차감을 한 번에 처리
 * RPC 함수가 내부적으로 크레딧 부족 여부를 확인하고 안전하게 차감
 */
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  description: string,
  quizId?: string | null
): Promise<CreditDeductionResult> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc("log_and_deduct_credits", {
      p_user_id: userId,
      p_amount: -Math.abs(amount), // 항상 음수로 (차감)
      p_description: description,
      p_quiz_id: quizId ?? null,
      p_type: "usage"
    });

    if (error) {
      console.error("[auth-helpers] deductCreditsAtomic error:", error.message);
      
      // 크레딧 부족인 경우
      if (error.message.includes("INSUFFICIENT_CREDITS") || 
          error.message.includes("크레딧이 부족")) {
        return {
          success: false,
          remaining_credits: 0,
          amount_deducted: 0,
          error: "INSUFFICIENT_CREDITS"
        };
      }
      
      // 기타 에러
      return {
        success: false,
        remaining_credits: 0,
        amount_deducted: 0,
        error: error.message
      };
    }

    return {
      success: true,
      remaining_credits: data.remaining_credits,
      amount_deducted: amount,
    };
  } catch (error) {
    console.error("[auth-helpers] deductCreditsAtomic exception:", error);
    return {
      success: false,
      remaining_credits: 0,
      amount_deducted: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * 사용자 크레딧 조회 (필요한 경우에만 사용)
 * 일반적으로는 deductCreditsAtomic 사용 권장
 */
export async function getUserCredits(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[auth-helpers] getUserCredits error:", error.message);
    return 0;
  }

  return data?.credits ?? 0;
}