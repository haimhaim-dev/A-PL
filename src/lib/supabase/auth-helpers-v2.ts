import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { LogAndDeductCreditsParams, LogAndDeductCreditsResult } from "./database-types";

/**
 * 리팩토링된 인증 헬퍼 (실제 DB 스키마 기반)
 */

/**
 * API 라우트에서 현재 로그인한 사용자 조회
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  
  if (error) {
    console.error("[auth-helpers-v2] getCurrentUser error:", error.message);
    return null;
  }
  
  return user;
}

/**
 * 사용자 크레딧 조회 (users.credits 컬럼)
 */
export async function getUserCredits(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[auth-helpers-v2] getUserCredits error:", error.message);
    return 0;
  }

  return data?.credits ?? 0;
}

/**
 * 안전한 크레딧 차감 (RPC 직접 호출)
 */
export async function deductCreditsRPC(
  userId: string,
  amount: number,
  description: string,
  quizId?: string | null
): Promise<LogAndDeductCreditsResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc("log_and_deduct_credits", {
    p_user_id: userId,
    p_amount: -Math.abs(amount), // 항상 음수로 (차감)
    p_description: description,
    p_quiz_id: quizId ?? null,
    p_type: "usage"
  } as LogAndDeductCreditsParams);

  if (error) {
    console.error("[auth-helpers-v2] deductCreditsRPC error:", error.message);
    
    if (error.message.includes("INSUFFICIENT_CREDITS") || 
        error.message.includes("크레딧이 부족")) {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    
    throw new Error(`크레딧 차감 실패: ${error.message}`);
  }

  return data as LogAndDeductCreditsResult;
}

/**
 * 사용자 크레딧 사전 확인 (UX 향상용)
 */
export async function checkUserCredits(userId: string, requiredAmount: number): Promise<{
  hasEnough: boolean;
  currentCredits: number;
  required: number;
}> {
  const currentCredits = await getUserCredits(userId);
  
  return {
    hasEnough: currentCredits >= requiredAmount,
    currentCredits,
    required: requiredAmount
  };
}