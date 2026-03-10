# 🔧 데이터베이스 리팩토링 가이드

## 🚨 발견된 치명적 불일치

### 1. **users.credits 컬럼 누락** (CRITICAL)
- **문제**: 코드 전반에서 `users.credits` 참조하지만 실제 테이블에 없음
- **영향**: 크레딧 조회/차감 기능 완전 실패
- **해결**: 즉시 컬럼 추가 필요

### 2. **포인트 시스템 이중화**
- **시스템 A**: `user_points` + `point_transactions` (마이그레이션)
- **시스템 B**: `users.credits` + `point_logs` (코드)
- **문제**: 두 시스템이 혼재하여 데이터 불일치

---

## 🎯 권장 해결 방안

### 단계 1: 즉시 실행 필요 (Supabase SQL Editor)

```sql
-- 1. users 테이블에 credits 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 5;

-- 2. 기존 사용자들에게 초기 크레딧 지급
UPDATE public.users SET credits = 5 WHERE credits IS NULL;

-- 3. Quiz 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public."Quiz" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  table_references JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. QuizAttempt 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public."QuizAttempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quizId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userAnswers" JSONB NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. exporthistory 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.exporthistory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  quiz_id TEXT NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL
);

-- 6. RLS 활성화
ALTER TABLE public."Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exporthistory ENABLE ROW LEVEL SECURITY;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_quiz_userid_created ON public."Quiz" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_quizattempt_userid ON public."QuizAttempt" ("userId");
CREATE INDEX IF NOT EXISTS idx_exporthistory_userid ON public.exporthistory (user_id, exported_at DESC);
```

### 단계 2: RLS 정책 WITH CHECK 추가

```sql
-- INSERT 정책에 WITH CHECK 추가 (보안 강화)
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Quiz_insert_own" ON public."Quiz";
CREATE POLICY "Quiz_insert_own"
  ON public."Quiz" FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = "userId");

DROP POLICY IF EXISTS "QuizAttempt_insert_own" ON public."QuizAttempt";
CREATE POLICY "QuizAttempt_insert_own"
  ON public."QuizAttempt" FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = "userId");

DROP POLICY IF EXISTS "exporthistory_insert_own" ON public.exporthistory;
CREATE POLICY "exporthistory_insert_own"
  ON public.exporthistory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "point_logs_insert_own" ON public.point_logs;
CREATE POLICY "point_logs_insert_own"
  ON public.point_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## 📋 당신이 할 일 체크리스트

### 즉시 실행 (HIGH PRIORITY)
- [ ] 위 "단계 1" SQL을 Supabase SQL Editor에서 실행
- [ ] 위 "단계 2" RLS 정책을 Supabase SQL Editor에서 실행
- [ ] `users` 테이블에 `credits` 컬럼이 추가되었는지 확인

### 선택적 정리 (MEDIUM PRIORITY)
- [ ] `user_points`, `point_transactions` 테이블 제거 (더 이상 사용하지 않는 경우)
- [ ] `deduct_points` RPC 함수 제거 (log_and_deduct_credits만 사용)

---

이 작업을 완료하면 코드와 DB 스키마가 일치하여 빌드 오류와 런타임 오류가 해결될 것입니다.