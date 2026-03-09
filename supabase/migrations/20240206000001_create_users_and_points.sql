-- 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 테이블
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 500, -- 회원가입 보너스 500P
  used_points INTEGER NOT NULL DEFAULT 0,
  remaining_points INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 포인트 거래 내역 테이블
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 양수: 적립, 음수: 차감
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  reason TEXT NOT NULL CHECK (reason IN ('signup_bonus', 'pdf_ocr', 'question_generation', 'purchase', 'refund', 'admin_adjustment')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 서비스 롤(백엔드)에서는 모든 작업 가능
CREATE POLICY "Service role can do anything on users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do anything on user_points" ON public.user_points
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do anything on point_transactions" ON public.point_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- 트리거 함수: 회원가입 시 자동으로 users 및 user_points 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. users 테이블에 사용자 정보 삽입
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 2. user_points 테이블에 초기 포인트 생성 (500P)
  INSERT INTO public.user_points (user_id, total_points, used_points, remaining_points)
  VALUES (NEW.id, 500, 0, 500);

  -- 3. 회원가입 보너스 거래 내역 기록
  INSERT INTO public.point_transactions (user_id, amount, type, reason, description)
  VALUES (NEW.id, 500, 'earn', 'signup_bonus', '회원가입 축하 보너스');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성: auth.users에 새 사용자 생성 시 자동 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 함수: 포인트 차감 (트랜잭션 보장)
CREATE OR REPLACE FUNCTION public.deduct_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_points INTEGER;
  v_new_remaining INTEGER;
BEGIN
  -- 1. 현재 포인트 조회 (FOR UPDATE로 락)
  SELECT remaining_points INTO v_current_points
  FROM public.user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 2. 포인트 부족 확인
  IF v_current_points < p_amount THEN
    RAISE EXCEPTION 'Insufficient points: current=%, required=%', v_current_points, p_amount;
  END IF;

  -- 3. 포인트 차감
  v_new_remaining := v_current_points - p_amount;
  
  UPDATE public.user_points
  SET 
    used_points = used_points + p_amount,
    remaining_points = v_new_remaining,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 4. 거래 내역 기록
  INSERT INTO public.point_transactions (user_id, amount, type, reason, description, metadata)
  VALUES (p_user_id, -p_amount, 'spend', p_reason, p_description, p_metadata);

  -- 5. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'remaining_points', v_new_remaining,
    'amount_deducted', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 포인트 추가
CREATE OR REPLACE FUNCTION public.add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_new_remaining INTEGER;
BEGIN
  -- 1. 포인트 추가
  UPDATE public.user_points
  SET 
    total_points = total_points + p_amount,
    remaining_points = remaining_points + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING remaining_points INTO v_new_remaining;

  -- 2. 거래 내역 기록
  INSERT INTO public.point_transactions (user_id, amount, type, reason, description)
  VALUES (p_user_id, p_amount, 'earn', p_reason, p_description);

  -- 3. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'remaining_points', v_new_remaining,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 코멘트 추가
COMMENT ON TABLE public.users IS '사용자 정보 테이블';
COMMENT ON TABLE public.user_points IS '사용자 포인트 테이블';
COMMENT ON TABLE public.point_transactions IS '포인트 거래 내역 테이블';
COMMENT ON FUNCTION public.handle_new_user() IS '회원가입 시 자동으로 users, user_points, point_transactions 생성';
COMMENT ON FUNCTION public.deduct_points(UUID, INTEGER, TEXT, TEXT, JSONB) IS '포인트 차감 (트랜잭션 보장)';
COMMENT ON FUNCTION public.add_points(UUID, INTEGER, TEXT, TEXT) IS '포인트 추가';
