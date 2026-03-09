# Supabase 설정 가이드

## 🚀 빠른 시작

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `a-pl` 또는 원하는 이름
   - Database Password: 강력한 비밀번호 생성
   - Region: `Northeast Asia (Seoul)` 또는 가까운 지역

### 2. 환경변수 설정

프로젝트 대시보드에서 Settings → API 이동:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 데이터베이스 마이그레이션 실행

Supabase 대시보드 → SQL Editor:

```sql
-- supabase/migrations/20240206000001_create_users_and_points.sql 내용 복사하여 실행
```

또는 Supabase CLI 사용:

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 링크
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

### 4. 구글 OAuth 설정

#### 4.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "APIs & Services" → "Credentials" 이동
4. "Create Credentials" → "OAuth 2.0 Client ID" 선택
5. Application type: "Web application"
6. Authorized redirect URIs 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
7. Client ID와 Client Secret 복사

#### 4.2 Supabase에 Google OAuth 설정

Supabase 대시보드 → Authentication → Providers → Google:

1. "Enable Sign in with Google" 활성화
2. Client ID 입력
3. Client Secret 입력
4. "Save" 클릭

### 5. Redirect URLs 설정

Supabase 대시보드 → Authentication → URL Configuration:

**Site URL** (프로덕션):
```
https://your-domain.com
```

**Redirect URLs** (추가):
```
http://localhost:3000/**
https://your-domain.com/**
```

---

## 📊 데이터베이스 스키마

### users 테이블
```sql
- id (UUID, PK) → auth.users 참조
- email (TEXT, UNIQUE)
- name (TEXT)
- avatar_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### user_points 테이블
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- total_points (INTEGER) -- 누적 획득 포인트
- used_points (INTEGER)  -- 사용한 포인트
- remaining_points (INTEGER) -- 잔여 포인트
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### point_transactions 테이블
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- amount (INTEGER) -- 양수: 적립, 음수: 차감
- type (TEXT) -- 'earn' | 'spend'
- reason (TEXT) -- 'signup_bonus' | 'pdf_ocr' | ...
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

---

## 🔐 Row Level Security (RLS)

### 정책

1. **사용자 데이터 조회**: 자신의 데이터만 조회 가능
   ```sql
   auth.uid() = user_id
   ```

2. **서비스 롤**: 백엔드에서 모든 작업 가능
   ```sql
   auth.role() = 'service_role'
   ```

---

## 🎯 자동 트리거

### handle_new_user()

회원가입 시 자동 실행:

1. **users 테이블**에 사용자 정보 삽입
   - email, name, avatar_url

2. **user_points 테이블**에 초기 포인트 생성
   - 500P 지급

3. **point_transactions 테이블**에 거래 내역 기록
   - "회원가입 축하 보너스"

```sql
-- 트리거 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 🔧 Supabase 함수

### deduct_points()

포인트 차감 (트랜잭션 보장):

```typescript
const { data, error } = await supabase.rpc("deduct_points", {
  p_user_id: userId,
  p_amount: 100,
  p_reason: "pdf_ocr",
  p_description: "PDF OCR 처리 (5페이지)",
  p_metadata: { fileName: "lecture.pdf", pageCount: 5 }
});
```

**특징**:
- 포인트 부족 시 에러 발생
- 트랜잭션 보장 (원자성)
- 거래 내역 자동 기록

### add_points()

포인트 추가:

```typescript
const { data, error } = await supabase.rpc("add_points", {
  p_user_id: userId,
  p_amount: 1000,
  p_reason: "purchase",
  p_description: "포인트 구매 (1000P)"
});
```

---

## 🧪 테스트

### 1. 데이터베이스 확인

```sql
-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 트리거 확인
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 함수 확인
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### 2. 로그인 테스트

1. 개발 서버 실행: `npm run dev`
2. `/login` 페이지 접속
3. "구글로 로그인" 클릭
4. 구글 계정 선택 및 권한 승인
5. 메인 페이지로 리다이렉트 확인

### 3. 데이터 확인

Supabase 대시보드 → Table Editor:

```sql
-- 사용자 확인
SELECT * FROM public.users;

-- 포인트 확인
SELECT * FROM public.user_points;

-- 거래 내역 확인
SELECT * FROM public.point_transactions;
```

**예상 결과**:
- users: 1개 row (구글 계정 정보)
- user_points: 1개 row (500P)
- point_transactions: 1개 row (회원가입 보너스)

---

## 🔍 디버깅

### 로그 확인

Supabase 대시보드 → Logs:

- **Auth Logs**: 로그인/로그아웃 이벤트
- **Database Logs**: SQL 쿼리 실행 로그
- **Edge Logs**: API 요청 로그

### 일반적인 문제

#### 1. "Invalid redirect URL" 에러

**원인**: Redirect URL이 Supabase 설정에 없음

**해결**:
```
Authentication → URL Configuration → Redirect URLs
http://localhost:3000/** 추가
```

#### 2. 트리거가 실행되지 않음

**확인**:
```sql
-- 트리거 상태 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 함수 존재 확인
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

**해결**: 마이그레이션 재실행

#### 3. RLS 정책으로 데이터 조회 안 됨

**확인**:
```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

**임시 해제** (개발용):
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

---

## 📚 참고 자료

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

## 🚀 프로덕션 배포

### Vercel 환경변수 설정

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Redirect URL 업데이트

Supabase → Authentication → URL Configuration:

```
https://your-production-domain.com/**
```

### Google OAuth Redirect URI 추가

Google Cloud Console → Credentials:

```
https://your-project.supabase.co/auth/v1/callback
```

---

**에이쁠 x Supabase** - 완벽한 통합! 🎉
