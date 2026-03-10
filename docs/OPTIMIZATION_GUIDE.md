# 에이쁠(A-Pl) 프로젝트 최적화 가이드

현재 코드베이스와 DB 사용처를 기준으로, **데이터베이스 구조·RLS 정책·Supabase API 설정·프로젝트 수정** 방향을 정리했습니다.

---

## 1. 현재 상태 요약

### 1.1 사용 중인 테이블 (코드 기준)

| 테이블 | 용도 | 접근 주체 |
|--------|------|------------|
| **users** | 프로필, 크레딧(일부 플로우) | 클라이언트(use-auth), API(server), 콜백(upsert) |
| **Quiz** | 퀴즈 목록/상세 | 클라이언트, simple-generate, quiz/generate, save-progress |
| **QuizAttempt** | 퀴즈 진행/완료 | 클라이언트, quiz/[quizId], save-progress |
| **exporthistory** | 내보내기 기록 | API(export-history) GET/POST |
| **point_logs** | 포인트 변동 내역(충전/사용) | API(point-logs) GET/POST, payments/history UI |
| **user_points** | 잔여 포인트(마이그레이션 스키마) | auth-helpers, generate-quiz, pdf-ocr API |
| **point_transactions** | 포인트 거래 내역(마이그레이션) | deduct_points RPC 내부 |

### 1.2 포인트/크레딧 이원화 문제 (중요)

- **경로 A (users + point_logs)**  
  - `users.credits` 조회/차감, `point_logs` 기록, RPC `log_and_deduct_credits`  
  - 사용처: **use-auth**(화면 잔액), **simple-generate**(퀴즈 생성), **payments/history**

- **경로 B (user_points + point_transactions)**  
  - `user_points` 조회, RPC `deduct_points`(내부에서 point_transactions 기록)  
  - 사용처: **generate-quiz** API, **pdf-ocr** API, **auth-helpers**

→ 한쪽만 쓰는 페이지가 있어서, **한 가지 체계로 통일**하는 것이 최적화의 핵심입니다.

### 1.3 RLS 정책 (제공해주신 내용)

- **users**: `authenticated` → SELECT만 `auth.uid() = id`
- **Quiz**: `authenticated` → SELECT만 `auth.uid() = userId`
- **exporthistory**:  
  - SELECT `auth.uid() = user_id`  
  - INSERT 정책은 있으나 **qual: null** → 본인만 넣도록 제한 필요
- **point_logs**:  
  - SELECT `auth.uid() = user_id` (authenticated)  
  - INSERT **qual: null** → 본인만 넣도록 제한 필요

**user_points, point_transactions, QuizAttempt**에 대한 정책은 제공 목록에 없습니다.  
실제 DB에 테이블이 있다면 RLS를 반드시 추가해야 합니다.

---

## 2. 권장 방향: 포인트 체계 통일

**권장: “users.credits + point_logs” 한 체계로 통일**

- 이미 **use-auth**, **simple-generate**, **payments/history**가 이 조합을 사용 중입니다.
- `user_points` / `point_transactions` / `deduct_points`를 쓰는 **generate-quiz**, **pdf-ocr**를 이 체계로 옮기면,  
  - RLS·RPC·클라이언트 표시가 하나로 맞고  
  - 운영·마이그레이션·정책 작성이 단순해집니다.

통일 후 목표 구조는 아래 “3. 데이터베이스 구조 및 정책”과 같습니다.

---

## 3. 데이터베이스 구조 및 정책

### 3.1 테이블별 권장 구조

#### users

- **역할**: 프로필 + **단일 잔액(credits)**  
- **컬럼 예시**:  
  `id` (PK, auth.users 참조), `email`, `name`, `avatar_url` 또는 `image_url`(하나로 통일), `credits` (INTEGER 기본값 예: 5), `created_at`, `updated_at`
- **정책**  
  - SELECT: `auth.uid() = id`  
  - UPDATE: `auth.uid() = id` (프로필·credits는 서버/트리거에서만 수정해도 됨)

#### Quiz

- **역할**: 퀴즈 메타·컨텐츠  
- **정책**  
  - SELECT: `auth.uid()::text = "userId"` (또는 DB가 UUID면 `auth.uid() = "userId"`)  
  - INSERT: `auth.uid()::text = "userId"` (본인만 생성)  
  - UPDATE / DELETE: `auth.uid()::text = "userId"`

#### QuizAttempt

- **역할**: 퀴즈별 진행/완료  
- **정책**  
  - SELECT, INSERT, UPDATE, DELETE: `auth.uid() = userId` (또는 문자열이면 `auth.uid()::text = "userId"`)

#### point_logs

- **역할**: 포인트 변동 내역(충전/사용)  
- **정책**  
  - SELECT: `auth.uid() = user_id`  
  - INSERT: `auth.uid() = user_id` **및** `WITH CHECK (auth.uid() = user_id)`  
  - UPDATE/DELETE: 일반적으로 불필요(로그는 추가만).

#### exporthistory

- **역할**: 내보내기 기록  
- **정책**  
  - SELECT: `auth.uid() = user_id`  
  - INSERT: `auth.uid() = user_id` **및** `WITH CHECK (auth.uid() = user_id)`  
  - (필요 시) UPDATE/DELETE도 본인만

#### user_points / point_transactions (통일 후 제거 권장)

- **통일 후**:  
  - 잔액은 **users.credits**만 사용  
  - 내역은 **point_logs**만 사용  
  - `deduct_points` 대신 **log_and_deduct_credits** 한 가지 RPC만 사용  
- **당분간 유지**한다면:  
  - **user_points**: SELECT `auth.uid() = user_id`  
  - **point_transactions**: SELECT `auth.uid() = user_id`  
  - INSERT/UPDATE는 **서버 전용 RPC**(SECURITY DEFINER)에서만 수행하는 방식 권장.

### 3.2 RLS 정책 정리 (Supabase SQL 예시)

```sql
-- ========== users ==========
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- (회원가입 시 삽입은 트리거 또는 service_role로 처리)
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ========== Quiz ==========
-- (userId 컬럼 타입에 맞게 ::text 사용 여부 조정)
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

-- ========== QuizAttempt ==========
CREATE POLICY "QuizAttempt_select_own"
  ON public."QuizAttempt" FOR SELECT TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "QuizAttempt_insert_own"
  ON public."QuizAttempt" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "QuizAttempt_update_own"
  ON public."QuizAttempt" FOR UPDATE TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "QuizAttempt_delete_own"
  ON public."QuizAttempt" FOR DELETE TO authenticated
  USING (auth.uid() = "userId");

-- ========== point_logs ==========
CREATE POLICY "point_logs_select_own"
  ON public.point_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own logs" ON public.point_logs;
CREATE POLICY "point_logs_insert_own"
  ON public.point_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========== exporthistory ==========
CREATE POLICY "exporthistory_select_own"
  ON public.exporthistory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own export history" ON public.exporthistory;
CREATE POLICY "exporthistory_insert_own"
  ON public.exporthistory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

- **INSERT 정책**: `qual: null`이었던 부분을 **WITH CHECK (auth.uid() = user_id)** 로 꼭 제한하는 것이 중요합니다.
- **public**이 아닌 **authenticated**만 주는 것이 안전합니다.

### 3.3 RPC (서버 전용)

- **log_and_deduct_credits**  
  - `p_user_id`, `p_amount`(음수로 차감), `p_description`, `p_quiz_id`, `p_type` 등  
  - 내부에서 `users.credits` 감소 + `point_logs` INSERT  
  - **SECURITY DEFINER**로 두고, **서버(anon 키로 호출 시에도)** RLS를 우회해 실행되도록 하거나,  
  - anon 호출을 막고 **service_role**로만 호출하도록 할 수 있습니다.  
  - 현재처럼 anon으로 호출한다면, RPC 내부에서 `p_user_id = auth.uid()` 검사 필수.

- **deduct_points** (user_points 사용 시)  
  - 통일 후 제거 예정이면, generate-quiz/pdf-ocr를 **log_and_deduct_credits**로 바꾼 뒤 제거.

---

## 4. Supabase API 설정

### 4.1 키 사용처

- **NEXT_PUBLIC_SUPABASE_URL** / **NEXT_PUBLIC_SUPABASE_ANON_KEY**  
  - 브라우저·Next.js 서버(API 라우트, SSR) 공통  
  - RLS가 적용되므로, 로그인한 사용자만 자신의 행에 접근 가능하게 설계

- **SUPABASE_SERVICE_ROLE_KEY**  
  - **절대** 클라이언트에 노출하지 말 것  
  - 사용처 예:  
    - 회원가입 시 `users`/초기 credits 삽입(트리거 대신 API로 할 때)  
    - 관리자용 배치·통계  
    - RLS를 일시적으로 우회해야 하는 서버 전용 작업  
  - 일반 CRUD는 anon + RLS로 충분히 처리 가능하면 service_role 사용 최소화

### 4.2 Dashboard 설정 (Project Settings → API)

- **Project URL** · **anon key**  
  - 앱 환경 변수와 동일한지 확인  
- **Enable RLS**  
  - 위 테이블 모두 RLS 활성화  
- **JWT expiry**  
  - 기본값 유지 또는 앱 요구에 맞게 조정  
- **Rate limiting**  
  - 필요 시 Supabase 쪽 제한과 앱(rate-limiter) 정책을 함께 점검

### 4.3 Auth 설정

- **Providers**  
  - Google OAuth 사용 중이면, Redirect URL에  
    `https://<your-domain>/auth/callback`  
    및 로컬 개발용 URL 등록  
- **Email redirect**  
  - 콜백 경로와 일치시키기 (`/auth/callback`)

---

## 5. 프로젝트(코드) 수정 사항

### 5.1 포인트 체계 통일 (권장)

1. **use-auth**  
   - 이미 `users.credits` + `point_logs` 기반이면 유지  
   - credits 초기값(예: 5)은 DB 기본값 또는 회원가입 트리거와 맞추기

2. **generate-quiz API** (`app/api/generate-quiz/route.ts`)  
   - `getCurrentUser` / `getUserPoints` / `deductPoints` (auth-helpers) 제거  
   - 대신:  
     - `users`에서 `credits` 조회  
     - 차감·기록은 **log_and_deduct_credits** 한 번만 호출  
   - 필요 크레딧 수(예: 1)를 `p_amount: -1` 등으로 전달

3. **pdf-ocr API** (`app/api/pdf-ocr/route.ts`)  
   - 동일하게 **users.credits** 조회 + **log_and_deduct_credits** 호출로 변경  
   - `auth-helpers`의 user_points/deduct_points 의존 제거

4. **auth-helpers** (`src/lib/supabase/auth-helpers.ts`)  
   - 통일 후:  
     - `getUserPoints` → `users`의 `credits` 조회로 대체하거나,  
     - 아예 제거하고 각 API에서 직접 `users.credits` + `log_and_deduct_credits`만 사용

5. **log_and_deduct_credits 시그니처**  
   - 현재 simple-generate에서 쓰는 인자와 맞추기  
   - `p_type: 'usage'`, `p_description` 등 point_logs에 저장할 필드 일치

### 5.2 스키마/컬럼 정리

- **users**  
  - `avatar_url` vs `image_url`:  
    - auth callback은 `image_url` 사용  
    - 마이그레이션은 `avatar_url`  
    - **한 이름으로 통일**하고, 콜백·프로필 조회 코드를 그에 맞게 수정

- **user_points / point_transactions**  
  - 통일 후 사용 중단하면,  
    - 관련 RPC(deduct_points 등) 제거  
    - (선택) 테이블 드롭 또는 deprecated로 두고 읽기만 하도록 정책 유지

### 5.3 기타 최적화

- **인덱스**  
  - `point_logs(user_id, created_at DESC)`  
  - `exporthistory(user_id, exported_at DESC)`  
  - `Quiz(userId, createdAt DESC)`  
  - `QuizAttempt(userId, updatedAt DESC)`  
  → 목록/페이징 쿼리 성능에 유리

- **API 라우트**  
  - 가능한 곳에서 `createClient()` 한 번만 호출  
  - 인증 실패 시 401 조기 반환으로 불필요한 DB 호출 줄이기

- **클라이언트**  
  - use-auth의 credits/퀴즈 목록 등은 필요한 페이지에서만 구독  
  - 불필요한 refreshCredits/refreshQuizzes 호출 제거

---

## 6. 당신이 할 작업 체크리스트

### DB / Supabase

- [ ] **포인트 통일 결정**  
  - [ ] users.credits + point_logs + log_and_deduct_credits만 사용할지 확정  
  - [ ] 사용한다면 generate-quiz, pdf-ocr, auth-helpers를 이 체계로 수정

- [ ] **users 테이블**  
  - [ ] `credits` 컬럼 존재·기본값 확인 (없으면 추가)  
  - [ ] `avatar_url` vs `image_url` 중 하나로 통일 후 코드 반영

- [ ] **RLS**  
  - [ ] `supabase/migrations/20240206100000_rls_security_fixes.sql` 실행 (INSERT WITH CHECK 등 보안 강화)
  - [ ] 위 3.2 정책을 참고해 모든 테이블에 적용  
  - [ ] INSERT 정책에 **WITH CHECK (auth.uid() = user_id)** 반드시 넣기  
  - [ ] QuizAttempt 테이블 정책 추가(없을 경우)

- [ ] **RPC**  
  - [ ] `log_and_deduct_credits`가 users.credits + point_logs와 일치하는지 확인  
  - [ ] RPC 내부에서 `p_user_id = auth.uid()` 검사 있는지 확인  
  - [ ] (통일 시) deduct_points 제거 또는 deprecated 처리

- [ ] **인덱스**  
  - [ ] point_logs, exporthistory, Quiz, QuizAttempt에 위 5.3 인덱스 추가

### Supabase Dashboard

- [ ] **API**  
  - [ ] Project URL / anon key가 앱 env와 일치하는지 확인  
  - [ ] service_role 키는 서버 전용·노출 금지

- [ ] **Auth**  
  - [ ] Google OAuth Redirect URL 등록  
  - [ ] 콜백 경로 `/auth/callback`와 동일한지 확인

### 코드

- [ ] **Auth callback**  
  - [ ] users 컬럼명(avatar_url vs image_url) 통일

- [ ] **generate-quiz / pdf-ocr**  
  - [ ] 포인트 체계 통일 시 users.credits + log_and_deduct_credits로 전환

- [ ] **auth-helpers**  
  - [ ] 통일 후 getUserPoints/deductPoints 제거 또는 users.credits 전용으로 단순화

이 가이드를 순서대로 적용하면, DB 구조·RLS·API 설정·프로젝트가 한 방향으로 맞고, 유지보수와 보안이 개선됩니다.
