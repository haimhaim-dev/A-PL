// ========================================
// 결제 상품 목록 조회 API
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { PaymentApiResponse, PaymentProduct } from "@/types/payment";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 활성 상품 목록 조회
    const { data: products, error } = await supabase
      .from('payment_products')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Products fetch failed:', error);
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "상품 목록 조회에 실패했습니다.",
        code: "PRODUCTS_FETCH_FAILED"
      }, { status: 500 });
    }

    return NextResponse.json<PaymentApiResponse<PaymentProduct[]>>({
      success: true,
      data: products || []
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json<PaymentApiResponse>({
      success: false,
      error: "상품 목록 조회 중 오류가 발생했습니다.",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}