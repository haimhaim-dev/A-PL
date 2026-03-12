// ========================================
// 결제 주문 생성 API
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-helpers-final";
import { 
  generateOrderId, 
  calculateExpiryTime, 
  validatePaymentAmount 
} from "@/lib/payments/config";
import type { 
  PaymentApiResponse, 
  CreateOrderResponse, 
  PaymentProduct 
} from "@/types/payment";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 1. 사용자 인증 확인
    const { user, error: userError } = await getCurrentUser();
    if (userError || !user) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "로그인이 필요합니다.",
        code: "UNAUTHORIZED"
      }, { status: 401 });
    }

    // 2. 요청 데이터 검증
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "상품 ID가 필요합니다.",
        code: "INVALID_PRODUCT_ID"
      }, { status: 400 });
    }

    // 3. 상품 정보 조회
    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "유효하지 않은 상품입니다.",
        code: "PRODUCT_NOT_FOUND"
      }, { status: 404 });
    }

    // 4. 결제 금액 검증
    if (!validatePaymentAmount(product.price)) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "유효하지 않은 결제 금액입니다.",
        code: "INVALID_AMOUNT"
      }, { status: 400 });
    }

    // 5. 기존 대기 중인 주문 확인 및 취소
    await supabase
      .from('payment_orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // 6. 새 주문 생성
    const orderId = generateOrderId();
    const expiresAt = calculateExpiryTime();

    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        id: orderId,
        user_id: user.id,
        product_id: productId,
        amount: product.price,
        credits: product.credits,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation failed:', orderError);
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "주문 생성에 실패했습니다.",
        code: "ORDER_CREATION_FAILED"
      }, { status: 500 });
    }

    // 7. 성공 응답
    return NextResponse.json<PaymentApiResponse<CreateOrderResponse>>({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        credits: order.credits,
        expiresAt: order.expires_at
      }
    });

  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json<PaymentApiResponse>({
      success: false,
      error: "주문 생성 중 오류가 발생했습니다.",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

// GET: 사용자의 활성 주문 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 사용자 인증 확인
    const { user, error: userError } = await getCurrentUser();
    if (userError || !user) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "로그인이 필요합니다.",
        code: "UNAUTHORIZED"
      }, { status: 401 });
    }

    // 활성 주문 조회
    const { data: orders, error } = await supabase
      .from('payment_orders')
      .select(`
        *,
        payment_products (
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get orders failed:', error);
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "주문 조회에 실패했습니다.",
        code: "ORDER_FETCH_FAILED"
      }, { status: 500 });
    }

    return NextResponse.json<PaymentApiResponse>({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get orders API error:', error);
    return NextResponse.json<PaymentApiResponse>({
      success: false,
      error: "주문 조회 중 오류가 발생했습니다.",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}