import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface UserPointsRow {
  remaining_points: number;
  total_points: number;
  used_points: number;
}

export interface DeductPointsResult {
  success: boolean;
  remaining_points: number;
  amount_deducted: number;
}

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
 * 사용자 포인트 조회 (user_points 테이블)
 */
export async function getUserPoints(userId: string): Promise<UserPointsRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_points")
    .select("remaining_points, total_points, used_points")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    if (error) console.error("[auth-helpers] getUserPoints error:", error.message);
    return {
      remaining_points: 0,
      total_points: 0,
      used_points: 0
    };
  }
  return data as UserPointsRow;
}

/**
 * 포인트 차감 (DB RPC deduct_points 호출 - 트랜잭션 보장)
 * @param reason 'pdf_ocr' | 'question_generation' | 'purchase' | 'refund' | 'admin_adjustment'
 */
export async function deductPoints(
  userId: string,
  amount: number,
  reason: string,
  description: string,
  metadata?: Record<string, unknown> | null
): Promise<DeductPointsResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("deduct_points", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_description: description,
    p_metadata: metadata ?? null
  });

  if (error) {
    const msg = error.message || "포인트 차감 실패";
    if (msg.includes("Insufficient points")) {
      throw new Error("INSUFFICIENT_POINTS");
    }
    throw new Error(msg);
  }

  const result = data as DeductPointsResult | null;
  if (!result || !result.success) {
    throw new Error("포인트 차감에 실패했습니다.");
  }
  return result;
}
