// ========================================
// 결제 시스템 타입 정의
// ========================================

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  is_active: boolean;
  display_order: number;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  credits: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  user_id: string;
  payment_key: string;
  method?: string;
  provider?: string;
  total_amount: number;
  supplied_amount?: number;
  vat?: number;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded';
  requested_at: string;
  approved_at?: string;
  failed_at?: string;
  toss_response?: any;
  failure_code?: string;
  failure_message?: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  type: 'purchase' | 'usage' | 'refund' | 'admin' | 'bonus';
  payment_order_id?: string;
  quiz_id?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// 토스페이먼츠 API 타입
export interface TossPaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerName?: string;
  customerEmail?: string;
}

export interface TossPaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  type: string;
  orderId: string;
  orderName: string;
  mId: string;
  currency: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  useEscrow: boolean;
  lastTransactionKey?: string;
  suppliedAmount: number;
  vat: number;
  cultureExpense: boolean;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  cancels?: any[];
  isPartialCancelable: boolean;
  card?: {
    amount: number;
    issuerCode: string;
    acquirerCode?: string;
    number: string;
    installmentPlanMonths: number;
    approveNo: string;
    useCardPoint: boolean;
    cardType: string;
    ownerType: string;
    acquireStatus: string;
    isInterestFree: boolean;
    interestPayer?: string;
  };
  virtualAccount?: any;
  transfer?: any;
  mobilePhone?: any;
  giftCertificate?: any;
  cashReceipt?: any;
  cashReceipts?: any[];
  discount?: any;
  country: string;
  failure?: {
    code: string;
    message: string;
  };
}

// API 응답 타입
export interface PaymentApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  credits: number;
  expiresAt: string;
}

export interface PaymentConfirmResponse {
  success: boolean;
  orderId: string;
  transactionId: string;
  creditsAdded: number;
  newBalance: number;
}

// 결제 상태 타입
export type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

// 결제 에러 타입
export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}