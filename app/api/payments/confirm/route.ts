// ========================================
// 결제 승인 API
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-helpers-final";
import { tossPaymentsService } from "@/lib/payments/toss-service";
import type { 
  PaymentApiResponse, 
  PaymentConfirmResponse,
  TossPaymentConfirm 
} from "@/types/payment";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
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
    const { paymentKey, orderId, amount }: TossPaymentConfirm = await request.json();
    
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "필수 결제 정보가 누락되었습니다.",
        code: "MISSING_PAYMENT_DATA"
      }, { status: 400 });
    }

    // 3. 주문 정보 확인
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select(`
        *,
        payment_products (
          name,
          credits
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "주문을 찾을 수 없습니다.",
        code: "ORDER_NOT_FOUND"
      }, { status: 404 });
    }

    // 4. 주문 상태 및 만료 시간 확인
    if (order.status !== 'pending') {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "이미 처리된 주문입니다.",
        code: "ORDER_ALREADY_PROCESSED"
      }, { status: 400 });
    }

    if (new Date() > new Date(order.expires_at)) {
      // 만료된 주문 취소
      await supabase
        .from('payment_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
        
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "주문이 만료되었습니다.",
        code: "ORDER_EXPIRED"
      }, { status: 400 });
    }

    // 5. 결제 금액 검증
    if (order.amount !== amount) {
      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: "결제 금액이 일치하지 않습니다.",
        code: "AMOUNT_MISMATCH"
      }, { status: 400 });
    }

    // 6. 주문 상태를 처리 중으로 변경
    await supabase
      .from('payment_orders')
      .update({ status: 'processing' })
      .eq('id', orderId);

    try {
      // 7. 토스페이먼츠 결제 승인 요청
      const confirmResult = await tossPaymentsService.confirmPayment({
        paymentKey,
        orderId,
        amount
      });

      if (!confirmResult.success) {
        // 결제 승인 실패 시 주문 상태 되돌리기
        await supabase
          .from('payment_orders')
          .update({ status: 'failed' })
          .eq('id', orderId);

        return NextResponse.json<PaymentApiResponse>({
          success: false,
          error: confirmResult.error || "결제 승인에 실패했습니다.",
          code: confirmResult.code || "PAYMENT_CONFIRM_FAILED"
        }, { status: 400 });
      }

      const tossResponse = confirmResult.data!;

      // 8. 결제 트랜잭션 기록 생성
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          id: `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          order_id: orderId,
          user_id: user.id,
          payment_key: paymentKey,
          method: tossResponse.method,
          provider: tossResponse.card?.issuerCode || 'unknown',
          total_amount: tossResponse.totalAmount,
          supplied_amount: tossResponse.suppliedAmount,
          vat: tossResponse.vat,
          status: 'confirmed',
          requested_at: tossResponse.requestedAt,
          approved_at: tossResponse.approvedAt,
          toss_response: tossResponse
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction creation failed:', transactionError);
        throw new Error('결제 기록 생성에 실패했습니다.');
      }

      // 9. 크레딧 충전 (원자적 처리)
      const { data: creditResult, error: creditError } = await supabase
        .rpc('charge_user_credits', {
          p_user_id: user.id,
          p_amount: order.credits,
          p_payment_order_id: orderId,
          p_description: `${order.payment_products?.name} 구매`
        });

      if (creditError || !creditResult?.[0]?.success) {
        console.error('Credit charge failed:', creditError);
        throw new Error('크레딧 충전에 실패했습니다.');
      }

      // 10. 주문 상태를 완료로 변경
      await supabase
        .from('payment_orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      // 11. 성공 응답
      return NextResponse.json<PaymentApiResponse<PaymentConfirmResponse>>({
        success: true,
        data: {
          success: true,
          orderId,
          transactionId: transaction.id,
          creditsAdded: order.credits,
          newBalance: creditResult[0].new_balance
        }
      });

    } catch (error) {
      console.error('Payment confirmation error:', error);
      
      // 오류 발생 시 주문 상태를 실패로 변경
      await supabase
        .from('payment_orders')
        .update({ status: 'failed' })
        .eq('id', orderId);

      return NextResponse.json<PaymentApiResponse>({
        success: false,
        error: error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.",
        code: "PAYMENT_PROCESSING_ERROR"
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment confirm API error:', error);
    return NextResponse.json<PaymentApiResponse>({
      success: false,
      error: "결제 승인 중 오류가 발생했습니다.",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}