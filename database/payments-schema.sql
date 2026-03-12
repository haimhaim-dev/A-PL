-- ========================================
-- 토스페이먼츠 결제 시스템 데이터베이스 스키마
-- 보안, 감사, 복구 기능을 포함한 완전한 결제 시스템
-- ========================================

-- 1. 결제 상품 테이블 (크레딧 패키지 정의)
CREATE TABLE IF NOT EXISTS payment_products (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price INTEGER NOT NULL CHECK (price > 0), -- 원 단위
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 결제 주문 테이블 (결제 전 주문 생성)
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY, -- orderId (UUID 또는 custom format)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES payment_products(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  credits INTEGER NOT NULL CHECK (credits > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',     -- 주문 생성됨
    'processing',  -- 결제 진행 중
    'completed',   -- 결제 완료
    'failed',      -- 결제 실패
    'cancelled',   -- 주문 취소
    'refunded'     -- 환불 완료
  )),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'), -- 주문 만료시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 결제 트랜잭션 테이블 (토스페이먼츠 결제 정보)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY, -- paymentKey from TossPayments
  order_id TEXT NOT NULL REFERENCES payment_orders(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 토스페이먼츠 정보
  payment_key TEXT NOT NULL UNIQUE,
  method VARCHAR(50), -- 결제 수단 (카드, 계좌이체 등)
  provider VARCHAR(50), -- 결제 제공사
  
  -- 금액 정보
  total_amount INTEGER NOT NULL,
  supplied_amount INTEGER, -- 공급가액
  vat INTEGER, -- 부가세
  
  -- 상태 정보
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- 결제 대기
    'confirmed',  -- 결제 승인
    'failed',     -- 결제 실패
    'cancelled',  -- 결제 취소
    'refunded'    -- 환불 완료
  )),
  
  -- 결제 시간 정보
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- 토스페이먼츠 응답 데이터 (JSON)
  toss_response JSONB,
  
  -- 실패 정보
  failure_code VARCHAR(50),
  failure_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 크레딧 트랜잭션 테이블 (기존 point_logs 확장)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 크레딧 정보
  amount INTEGER NOT NULL, -- 양수: 충전, 음수: 사용
  balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  
  -- 트랜잭션 타입
  type VARCHAR(20) NOT NULL CHECK (type IN (
    'purchase',   -- 결제로 구매
    'usage',      -- 퀴즈 생성 사용
    'refund',     -- 환불
    'admin',      -- 관리자 지급/차감
    'bonus'       -- 이벤트 보너스
  )),
  
  -- 연관 정보
  payment_order_id TEXT REFERENCES payment_orders(id),
  quiz_id TEXT, -- 사용된 퀴즈 ID (usage 타입일 때)
  description TEXT NOT NULL,
  
  -- 메타데이터
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 결제 웹훅 로그 테이블 (토스페이먼츠 웹훅 기록)
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type VARCHAR(50) NOT NULL,
  payment_key TEXT,
  order_id TEXT,
  
  -- 웹훅 데이터
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  
  -- 처리 정보
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 환불 요청 테이블
CREATE TABLE IF NOT EXISTS refund_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payment_transaction_id TEXT NOT NULL REFERENCES payment_transactions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- 환불 정보
  refund_amount INTEGER NOT NULL CHECK (refund_amount > 0),
  reason TEXT NOT NULL,
  admin_note TEXT,
  
  -- 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',   -- 환불 요청
    'approved',  -- 승인됨
    'rejected',  -- 거절됨
    'completed', -- 환불 완료
    'failed'     -- 환불 실패
  )),
  
  -- 처리 정보
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 인덱스 생성 (성능 최적화)
-- ========================================

-- 결제 주문 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_expires_at ON payment_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);

-- 결제 트랜잭션 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_key ON payment_transactions(payment_key);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- 크레딧 트랜잭션 인덱스
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_order_id ON credit_transactions(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- 웹훅 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment_key ON payment_webhooks(payment_key);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created_at ON payment_webhooks(created_at DESC);

-- ========================================
-- RLS (Row Level Security) 정책
-- ========================================

-- RLS 활성화
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- 결제 주문 정책
CREATE POLICY "Users can view their own payment orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment orders" ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 결제 트랜잭션 정책 (읽기 전용)
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 크레딧 트랜잭션 정책 (읽기 전용)
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 환불 요청 정책
CREATE POLICY "Users can view their own refund requests" ON refund_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refund requests" ON refund_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 트리거 함수 (자동화)
-- ========================================

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 저장 프로시저 (핵심 비즈니스 로직)
-- ========================================

-- 1. 크레딧 충전 함수 (원자적 처리)
CREATE OR REPLACE FUNCTION charge_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_payment_order_id TEXT,
  p_description TEXT DEFAULT '크레딧 구매'
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance INTEGER,
  transaction_id TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id TEXT;
BEGIN
  -- 현재 잔액 조회
  SELECT COALESCE(credits, 0) INTO v_current_balance
  FROM users WHERE id = p_user_id;
  
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, ''::TEXT, 'User not found'::TEXT;
    RETURN;
  END IF;
  
  -- 새로운 잔액 계산
  v_new_balance := v_current_balance + p_amount;
  
  -- 트랜잭션 ID 생성
  v_transaction_id := gen_random_uuid()::text;
  
  -- 사용자 크레딧 업데이트
  UPDATE users 
  SET credits = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 크레딧 트랜잭션 기록
  INSERT INTO credit_transactions (
    id, user_id, amount, balance_before, balance_after,
    type, payment_order_id, description
  ) VALUES (
    v_transaction_id, p_user_id, p_amount, v_current_balance, v_new_balance,
    'purchase', p_payment_order_id, p_description
  );
  
  RETURN QUERY SELECT true, v_new_balance, v_transaction_id, ''::TEXT;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 0, ''::TEXT, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 만료된 주문 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE payment_orders 
  SET status = 'cancelled', updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 초기 데이터 삽입
-- ========================================

-- 크레딧 패키지 상품 등록
INSERT INTO payment_products (id, name, description, credits, price, display_order) VALUES
  ('credits_10', '크레딧 10개', '퀴즈 10개 생성 가능', 10, 1000, 1),
  ('credits_50', '크레딧 50개', '퀴즈 50개 생성 가능 (10% 할인)', 50, 4500, 2),
  ('credits_100', '크레딧 100개', '퀴즈 100개 생성 가능 (20% 할인)', 100, 8000, 3),
  ('credits_500', '크레딧 500개', '퀴즈 500개 생성 가능 (30% 할인)', 500, 35000, 4)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 정기 작업 (Cron Job 설정 - pg_cron 확장 필요)
-- ========================================

-- 만료된 주문 정리 (매시간 실행)
-- SELECT cron.schedule('cleanup-expired-orders', '0 * * * *', 'SELECT cleanup_expired_orders();');

-- ========================================
-- 보안 및 감사 설정
-- ========================================

-- 민감한 테이블에 대한 감사 로그 (필요시 확장)
-- CREATE EXTENSION IF NOT EXISTS "audit";

-- 결제 관련 테이블 백업 정책 설정
-- ALTER TABLE payment_transactions SET (log_statement = 'all');
-- ALTER TABLE credit_transactions SET (log_statement = 'all');

COMMENT ON TABLE payment_products IS '결제 상품 정의 테이블';
COMMENT ON TABLE payment_orders IS '결제 주문 테이블 - 결제 전 주문 생성';
COMMENT ON TABLE payment_transactions IS '결제 트랜잭션 테이블 - 토스페이먼츠 결제 정보';
COMMENT ON TABLE credit_transactions IS '크레딧 트랜잭션 테이블 - 모든 크레딧 변동 기록';
COMMENT ON TABLE payment_webhooks IS '결제 웹훅 로그 테이블 - 토스페이먼츠 웹훅 기록';
COMMENT ON TABLE refund_requests IS '환불 요청 테이블 - 사용자 환불 요청 관리';