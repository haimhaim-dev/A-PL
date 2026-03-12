// ========================================
// 토스페이먼츠 웹훅 API
// ========================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { tossPaymentsService } from "@/lib/payments/toss-service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    // 1. 웹훅 데이터 파싱
    const rawBody = await request.text();
    const webhookData = JSON.parse(rawBody);
    
    // 2. 웹훅 서명 검증 (보안)
    const signature = request.headers.get('toss-signature');
    if (signature && !tossPaymentsService.verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. 웹훅 로그 기록
    const { data: webhookLog, error: logError } = await supabase
      .from('payment_webhooks')
      .insert({
        event_type: webhookData.eventType || 'unknown',
        payment_key: webhookData.data?.paymentKey,
        order_id: webhookData.data?.orderId,
        raw_data: webhookData,
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Webhook log creation failed:', logError);
    }

    // 4. 이벤트 타입별 처리
    try {
      switch (webhookData.eventType) {
        case 'PAYMENT_STATUS_CHANGED':
          await handlePaymentStatusChanged(supabase, webhookData.data);
          break;
          
        case 'PAYMENT_CANCELED':
          await handlePaymentCanceled(supabase, webhookData.data);
          break;
          
        default:
          console.log(`Unhandled webhook event: ${webhookData.eventType}`);
      }

      // 5. 웹훅 처리 완료 표시
      if (webhookLog) {
        await supabase
          .from('payment_webhooks')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', webhookLog.id);
      }

      return NextResponse.json({ success: true });

    } catch (processingError) {
      console.error('Webhook processing error:', processingError);
      
      // 웹훅 처리 실패 기록
      if (webhookLog) {
        await supabase
          .from('payment_webhooks')
          .update({ 
            error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
            retry_count: (webhookLog.retry_count || 0) + 1
          })
          .eq('id', webhookLog.id);
      }

      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 결제 상태 변경 처리
async function handlePaymentStatusChanged(supabase: any, paymentData: any) {
  const { paymentKey, orderId, status } = paymentData;
  
  if (!paymentKey || !orderId) {
    throw new Error('Missing payment key or order ID');
  }

  // 결제 트랜잭션 상태 업데이트
  const { error: transactionError } = await supabase
    .from('payment_transactions')
    .update({
      status: mapTossStatusToInternal(status),
      toss_response: paymentData,
      updated_at: new Date().toISOString()
    })
    .eq('payment_key', paymentKey);

  if (transactionError) {
    console.error('Transaction update failed:', transactionError);
    throw transactionError;
  }

  // 주문 상태 업데이트
  const orderStatus = getOrderStatusFromPaymentStatus(status);
  if (orderStatus) {
    const { error: orderError } = await supabase
      .from('payment_orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) {
      console.error('Order update failed:', orderError);
      throw orderError;
    }
  }
}

// 결제 취소 처리
async function handlePaymentCanceled(supabase: any, paymentData: any) {
  const { paymentKey, orderId, cancels } = paymentData;
  
  if (!paymentKey || !orderId) {
    throw new Error('Missing payment key or order ID');
  }

  // 결제 트랜잭션 상태를 취소로 업데이트
  const { error: transactionError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'cancelled',
      toss_response: paymentData,
      updated_at: new Date().toISOString()
    })
    .eq('payment_key', paymentKey);

  if (transactionError) {
    console.error('Transaction cancel update failed:', transactionError);
    throw transactionError;
  }

  // 주문 상태를 취소로 업데이트
  const { error: orderError } = await supabase
    .from('payment_orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Order cancel update failed:', orderError);
    throw orderError;
  }

  // 크레딧 환불 처리 (필요한 경우)
  if (cancels && cancels.length > 0) {
    const totalCancelAmount = cancels.reduce((sum: number, cancel: any) => sum + cancel.cancelAmount, 0);
    
    // 환불할 크레딧 계산 및 처리
    // 실제 구현에서는 더 정교한 환불 로직 필요
    console.log(`Refund processing needed for amount: ${totalCancelAmount}`);
  }
}

// 토스 결제 상태를 내부 상태로 매핑
function mapTossStatusToInternal(tossStatus: string): string {
  switch (tossStatus) {
    case 'READY': return 'pending';
    case 'IN_PROGRESS': return 'pending';
    case 'WAITING_FOR_DEPOSIT': return 'pending';
    case 'DONE': return 'confirmed';
    case 'CANCELED': return 'cancelled';
    case 'PARTIAL_CANCELED': return 'confirmed'; // 부분 취소는 여전히 확정 상태
    case 'ABORTED': return 'failed';
    case 'EXPIRED': return 'failed';
    default: return 'pending';
  }
}

// 결제 상태에서 주문 상태 추출
function getOrderStatusFromPaymentStatus(paymentStatus: string): string | null {
  switch (paymentStatus) {
    case 'DONE': return 'completed';
    case 'CANCELED': return 'cancelled';
    case 'ABORTED': return 'failed';
    case 'EXPIRED': return 'failed';
    default: return null; // 주문 상태 변경 불필요
  }
}