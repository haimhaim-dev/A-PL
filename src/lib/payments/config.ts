// ========================================
// 결제 시스템 설정
// ========================================

export const PAYMENT_CONFIG = {
  // 토스페이먼츠 설정
  toss: {
    clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
    secretKey: process.env.TOSS_SECRET_KEY!,
    apiUrl: 'https://api.tosspayments.com/v1',
  },
  
  // 결제 설정
  order: {
    expiryMinutes: 30, // 주문 만료 시간 (분)
    maxAmount: 1000000, // 최대 결제 금액 (원)
    minAmount: 1000, // 최소 결제 금액 (원)
  },
  
  // URL 설정
  urls: {
    success: '/payments/success',
    fail: '/payments/fail',
    webhook: '/api/payments/webhook',
  },
  
  // 보안 설정
  security: {
    maxRetries: 3, // 최대 재시도 횟수
    webhookTimeout: 10000, // 웹훅 타임아웃 (ms)
    orderIdPrefix: 'APL', // 주문 ID 접두사
  },
} as const;

// 환경 변수 검증
export function validatePaymentConfig() {
  const required = [
    'NEXT_PUBLIC_TOSS_CLIENT_KEY',
    'TOSS_SECRET_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required payment environment variables: ${missing.join(', ')}`);
  }
}

// 결제 금액 검증
export function validatePaymentAmount(amount: number): boolean {
  return amount >= PAYMENT_CONFIG.order.minAmount && 
         amount <= PAYMENT_CONFIG.order.maxAmount;
}

// 주문 ID 생성
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${PAYMENT_CONFIG.security.orderIdPrefix}_${timestamp}_${random}`;
}

// 결제 만료 시간 계산
export function calculateExpiryTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + PAYMENT_CONFIG.order.expiryMinutes * 60 * 1000);
}