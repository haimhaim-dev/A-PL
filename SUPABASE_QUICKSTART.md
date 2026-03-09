# 🚀 Supabase 5분 설정 가이드

## 📋 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 환경변수 설정
- [ ] Database 마이그레이션
- [ ] 구글 OAuth 설정
- [ ] Redirect URLs 설정
- [ ] 테스트

---

## 1️⃣ Supabase 프로젝트 생성 (2분)

### 1. https://supabase.com 접속

- "Start your project" 또는 "New Project" 클릭

### 2. 프로젝트 정보 입력

- **Organization**: 새로 생성 또는 기존 선택
- **Name**: `a-pl` (또는 원하는 이름)
- **Database Password**: 강력한 비밀번호 (꼭 저장!)
- **Region**: `Northeast Asia (Seoul)` 선택
- **Pricing Plan**: `Free` ($0/month)

### 3. 프로젝트 생성 대기 (1-2분)

프로젝트가 생성되면 대시보드로 이동

---

## 2️⃣ 환경변수 설정 (30초)

### 1. API 키 복사

Supabase 대시보드 → **Settings** → **API**:

- **Project URL** 복사
- **anon public** 키 복사

### 2. .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini API (이미 있으면 추가하지 않아도 됨)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 3️⃣ Database 마이그레이션 (1분)

### 1. SQL 파일 열기

`supabase/migrations/20240206000001_create_users_and_points.sql` 파일 열기

### 2. Supabase SQL Editor에서 실행

1. Supabase 대시보드 → **SQL Editor** (왼쪽 메뉴)
2. **New query** 클릭
3. SQL 파일 내용 **전체 복사**
4. SQL Editor에 **붙여넣기**
5. **RUN** 버튼 클릭 (Ctrl/Cmd + Enter)

### 3. 성공 확인

```
Success. No rows returned
```

### 4. 테이블 확인

**Table Editor** → 다음 테이블이 생성되었는지 확인:
- ✅ `users`
- ✅ `user_points`
- ✅ `point_transactions`

---

## 4️⃣ 구글 OAuth 설정 (2분)

### A. Google Cloud Console 설정

#### 1. https://console.cloud.google.com 접속

#### 2. 프로젝트 선택 또는 생성

상단에서 프로젝트 선택 → "New Project"

#### 3. OAuth 동의 화면 설정

**APIs & Services** → **OAuth consent screen**:

1. User Type: **External** 선택
2. App name: `에이쁠 (A-Pl)`
3. User support email: 본인 이메일
4. Developer contact: 본인 이메일
5. **Save and Continue**
6. Scopes: 기본값 유지 (추가 불필요)
7. **Save and Continue**
8. Test users: 본인 이메일 추가
9. **Save and Continue**

#### 4. Credentials 생성

**APIs & Services** → **Credentials**:

1. **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Name: `A-Pl Web Client`
4. **Authorized redirect URIs** 추가:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   ⚠️ `xxxxx`를 본인 Supabase 프로젝트 ID로 변경!
   
5. **Create** 클릭
6. **Client ID**와 **Client Secret** 복사 (중요!)

### B. Supabase에 Google OAuth 설정

#### 1. Authentication → Providers

Supabase 대시보드 → **Authentication** → **Providers**:

1. **Google** 찾기
2. **Enable Sign in with Google** 토글 활성화
3. **Client ID** 입력 (Google에서 복사한 것)
4. **Client Secret** 입력 (Google에서 복사한 것)
5. **Save** 클릭

---

## 5️⃣ Redirect URLs 설정 (30초)

### Supabase URL Configuration

Supabase 대시보드 → **Authentication** → **URL Configuration**:

#### Site URL (메인 URL)
```
http://localhost:3000
```

#### Redirect URLs (허용할 모든 URL)
```
http://localhost:3000/**
```

⚠️ 프로덕션 배포 시 도메인 추가:
```
https://your-domain.com/**
```

**Save** 클릭

---

## 6️⃣ 테스트 (1분)

### 1. 개발 서버 실행

```bash
npm install
npm run dev
```

### 2. 로그인 테스트

1. 브라우저에서 http://localhost:3000 접속
2. 자동으로 `/login` 페이지로 리다이렉트
3. **"구글로 로그인"** 버튼 클릭
4. 구글 계정 선택
5. 권한 승인
6. 메인 페이지로 리다이렉트 ✅

### 3. 데이터 확인

Supabase 대시보드 → **Table Editor**:

#### ✅ users 테이블
| id | email | name | avatar_url |
|----|-------|------|------------|
| xxx-xxx | your@gmail.com | Your Name | https://... |

#### ✅ user_points 테이블
| user_id | total_points | remaining_points |
|---------|--------------|------------------|
| xxx-xxx | 500 | 500 |

#### ✅ point_transactions 테이블
| user_id | amount | type | reason | description |
|---------|--------|------|--------|-------------|
| xxx-xxx | 500 | earn | signup_bonus | 회원가입 축하 보너스 |

### 4. UI 확인

메인 페이지 상단에서 확인:
- ✅ 이메일 표시
- ✅ 프로필 사진
- ✅ **500P** 표시 (노란색 배지)
- ✅ 로그아웃 버튼

---

## 🐛 문제 해결

### "Invalid Redirect URL" 에러

**원인**: Redirect URL 미설정

**해결**:
```
Authentication → URL Configuration
→ Redirect URLs에 http://localhost:3000/** 추가
```

### "Unable to verify state" 에러

**원인**: 쿠키 문제 또는 브라우저 설정

**해결**:
1. 브라우저 쿠키 삭제
2. 시크릿 모드에서 테스트
3. 브라우저 재시작

### 트리거 실행 안 됨 (포인트 0P)

**확인**:
```sql
-- SQL Editor에서 실행
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**해결**: 마이그레이션 SQL 다시 실행

### 로그인 후 빈 화면

**확인**: 
1. 브라우저 콘솔에서 에러 확인
2. `middleware.ts` 파일 존재 확인
3. Supabase URL/KEY 환경변수 확인

---

## ✅ 최종 확인

### 메인 페이지 (/)
- [x] 이메일 표시
- [x] 포인트 표시 (500P)
- [x] 프로필 사진
- [x] 로그아웃 버튼
- [x] PDF 업로드 버튼 활성화

### 업로드 페이지 (/upload)
- [x] 로그인 안 하면 "로그인 필요" 표시
- [x] 로그인 하면 업로드 가능

### OCR 페이지 (/ocr)
- [x] 로그인 안 하면 "로그인 필요" 표시
- [x] 로그인 하면 OCR 처리 가능

---

## 🎉 완료!

이제 에이쁠은:
- ✅ 구글 소셜 로그인
- ✅ 자동 유저 생성
- ✅ 회원가입 보너스 500P
- ✅ 포인트 시스템
- ✅ 로그인 필수 기능 보호

**다음 단계**: AI 문제 생성 또는 포인트 충전 기능 구현! 🚀
