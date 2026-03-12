// ========================================
// 토스페이먼츠 서비스 클래스
// ========================================

import { PAYMENT_CONFIG } from './config';
import type { 
  TossPaymentConfirm, 
  TossPaymentResponse, 
  PaymentApiResponse 
} from '@/types/payment';

export class TossPaymentsService {
  private readonly baseUrl = PAYMENT_CONFIG.toss.apiUrl;
  private readonly secretKey = PAYMENT_CONFIG.toss.secretKey;

  /**
   * 결제 승인 요청
   */
  async confirmPayment(data: TossPaymentConfirm): Promise<PaymentApiResponse<TossPaymentResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || '결제 승인에 실패했습니다.',
          code: result.code,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('TossPayments API Error:', error);
      return {
        success: false,
        error: '결제 서비스 연결에 실패했습니다.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<PaymentApiResponse<TossPaymentResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || '결제 정보 조회에 실패했습니다.',
          code: result.code,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('TossPayments API Error:', error);
      return {
        success: false,
        error: '결제 서비스 연결에 실패했습니다.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(
    paymentKey: string, 
    cancelReason: string, 
    cancelAmount?: number
  ): Promise<PaymentApiResponse<TossPaymentResponse>> {
    try {
      const body: any = { cancelReason };
      if (cancelAmount) {
        body.cancelAmount = cancelAmount;
      }

      const response = await fetch(`${this.baseUrl}/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || '결제 취소에 실패했습니다.',
          code: result.code,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('TossPayments API Error:', error);
      return {
        success: false,
        error: '결제 서비스 연결에 실패했습니다.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // 토스페이먼츠 웹훅 서명 검증 로직
    // 실제 구현에서는 토스페이먼츠 문서를 참조하여 구현
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('base64');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Authorization 헤더 생성
   */
  private getAuthHeader(): string {
    return Buffer.from(`${this.secretKey}:`).toString('base64');
  }
}

// 싱글톤 인스턴스
export const tossPaymentsService = new TossPaymentsService();