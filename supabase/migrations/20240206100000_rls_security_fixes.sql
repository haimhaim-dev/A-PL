-- ============================================================
-- RLS 보안 강화 마이그레이션
-- 
-- 발견된 취약점:
-- 1. exporthistory INSERT: WITH CHECK 없음 → 타인 user_id로 삽입 가능 (치명적)
-- 2. point_logs INSERT: WITH CHECK 없음 → 타인 user_id로 삽입 가능 (치명적)
-- 3. exporthistory SELECT: roles=public → authenticated로 제한 필요
-- 4. users: INSERT/UPDATE 정책 누락 (auth 콜백 upsert 지원)
-- ============================================================

-- ========== 1. users 테이블 ==========
-- 기존 정책 유지, INSERT/UPDATE 추가 (auth 콜백 upsert 지원)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========== 2. Quiz 테이블 ==========
-- 중복 정책 정리 (Enable read + full_access → 개별 정책으로 통일)
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Quiz";
DROP POLICY IF EXISTS "Quiz_full_access_own" ON public."Quiz";

CREATE POLICY "Quiz_select_own"
  ON public."Quiz" FOR SELECT TO authenticated
  USING ((auth.uid())::text = "userId");

CREATE POLICY "Quiz_insert_own"
  ON public."Quiz" FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = "userId");

CREATE POLICY "Quiz_update_own"
  ON public."Quiz" FOR UPDATE TO authenticated
  USING ((auth.uid())::text = "userId")
  WITH CHECK ((auth.uid())::text = "userId");

CREATE POLICY "Quiz_delete_own"
  ON public."Quiz" FOR DELETE TO authenticated
  USING ((auth.uid())::text = "userId");

-- ========== 3. QuizAttempt 테이블 ==========
-- userId: UUID 또는 text (auth.uid()와 비교 시 캐스팅)
DROP POLICY IF EXISTS "QuizAttempt_full_access_own" ON public."QuizAttempt";

CREATE POLICY "QuizAttempt_select_own"
  ON public."QuizAttempt" FOR SELECT TO authenticated
  USING (auth.uid() = ("userId")::uuid);

CREATE POLICY "QuizAttempt_insert_own"
  ON public."QuizAttempt" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ("userId")::uuid);

CREATE POLICY "QuizAttempt_update_own"
  ON public."QuizAttempt" FOR UPDATE TO authenticated
  USING (auth.uid() = ("userId")::uuid)
  WITH CHECK (auth.uid() = ("userId")::uuid);

CREATE POLICY "QuizAttempt_delete_own"
  ON public."QuizAttempt" FOR DELETE TO authenticated
  USING (auth.uid() = ("userId")::uuid);

-- ========== 4. exporthistory 테이블 ==========
-- 🚨 치명적: INSERT에 WITH CHECK 추가
DROP POLICY IF EXISTS "Users can view their own export history" ON public.exporthistory;
DROP POLICY IF EXISTS "exporthistory_insert_own" ON public.exporthistory;

CREATE POLICY "exporthistory_select_own"
  ON public.exporthistory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "exporthistory_insert_own"
  ON public.exporthistory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========== 5. point_logs 테이블 ==========
-- 🚨 치명적: INSERT에 WITH CHECK 추가
-- (RPC가 SECURITY DEFINER로 삽입하지만, 직접 삽입 경로 방어)
DROP POLICY IF EXISTS "Users can view own point logs" ON public.point_logs;
DROP POLICY IF EXISTS "point_logs_insert_own" ON public.point_logs;

CREATE POLICY "point_logs_select_own"
  ON public.point_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- point_logs INSERT는 RPC(log_and_deduct_credits)에서만 수행
-- 클라이언트 직접 삽입 차단: 본인 user_id만 허용
CREATE POLICY "point_logs_insert_own"
  ON public.point_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
