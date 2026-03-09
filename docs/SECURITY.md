# 보안 가이드

## 🔒 보안 강화 내용

에이쁠 서비스의 주요 보안 취약점을 분석하고 보완한 내용입니다.

## 🚨 발견된 취약점 및 해결

### 1. 유저 데이터 접근 제어 부재 (치명적)

#### ❌ 이전 코드 (취약)
```typescript
// 클라이언트에서 userId를 받아서 그대로 사용
const userId = formData.get("userId") as string;
await deductPoints(userId, 100, ...);
// → 다른 사람의 userId를 보내면 그 사람의 포인트 차감 가능!
```

#### ✅ 해결 방법
```typescript
// 1. 세션 기반 인증
import { requireAuth } from "@/lib/auth";

const auth = requireAuth(request);
if (!auth) {
  return NextResponse.json({ error: "인증 필요" }, { status: 401 });
}

const userId = auth.userId; // 서버에서 세션으로 확인된 userId만 사용
```

**보안 강화 포인트**:
- ✅ 클라이언트에서 userId 전달 불가
- ✅ 세션 쿠키로만 인증 (HttpOnly, Secure)
- ✅ 세션 만료 시간 관리 (30일)
- ✅ 다른 사용자의 데이터 접근 불가능

---

### 2. Rate Limiting 부재 (비용 폭탄 위험)

#### ❌ 이전 코드 (취약)
```typescript
// Rate Limiting이 전혀 없음
// → 무한정 API 호출 가능 → Gemini API 비용 폭탄
```

#### ✅ 해결 방법
```typescript
import { checkIPRateLimit, checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";

// IP 기반 Rate Limiting
const clientIP = getClientIP(request);
const ipRateLimit = checkIPRateLimit(clientIP, RATE_LIMITS.pdfOCR);

if (!ipRateLimit.allowed) {
  return NextResponse.json(
    { error: "현재 사용자가 많아 잠시 후 다시 시도해 주세요." },
    { 
      status: 429,
      headers: { "Retry-After": "60" }
    }
  );
}

// 사용자 기반 Rate Limiting
const userRateLimit = checkUserRateLimit(userId, RATE_LIMITS.pdfOCR);
```

**Rate Limit 설정**:
- **PDF 텍스트 추출 (무료)**: IP당 5회/분
- **OCR 처리 (유료)**: IP당 3회/분, 사용자당 3회/분
- **전역**: IP당 20회/분

**비용 절감 효과**:
- Gemini API 호출 제한 → 비용 통제
- DDoS 공격 방어
- 서비스 안정성 향상

---

### 3. 서버 사이드 파일 검증 부족

#### ❌ 이전 코드 (취약)
```typescript
// 클라이언트에서만 파일 검증
// → MIME 타입 조작 가능
// → 악성 파일 업로드 가능
```

#### ✅ 해결 방법
```typescript
import { validateFileOnServer } from "@/lib/server-validation";

// 1. MIME 타입 검증
// 2. 파일 크기 검증 (10MB)
// 3. 파일 매직 넘버 검증 (실제 PDF인지 확인)
// 4. 파일명 보안 검증 (경로 탐색 공격 방지)

const validation = await validateFileOnServer(file);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

**보안 강화 포인트**:
- ✅ PDF 매직 넘버 검증 (%PDF)
- ✅ 파일명 경로 탐색 방지 (../, /, \)
- ✅ NULL 바이트 공격 방지 (\0)
- ✅ 크기 제한 (10MB)

---

### 4. API 키 노출 위험

#### ✅ 현재 상태 (안전)
```bash
# .gitignore
.env*.local
.env

# .env.local (git에 업로드 안 됨)
GEMINI_API_KEY=your_api_key
```

**추가 보안 조치**:
- ✅ 환경변수로만 관리
- ✅ 서버 사이드에서만 사용
- ✅ 클라이언트에서 직접 API 호출 불가
- ✅ .gitignore에 .env 파일 등록

**권장 사항**:
```typescript
// 환경변수 확인
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}
```

---

## 🛡️ 보안 아키텍처

### 인증 흐름
```
클라이언트
    ↓
1. POST /api/auth/session (임시 세션 생성)
    ↓
2. HttpOnly 쿠키로 sessionId 저장
    ↓
3. API 요청 시 쿠키 자동 전송
    ↓
4. 서버: requireAuth(request) → userId 추출
    ↓
5. 세션 검증 + 사용자 확인
    ↓
6. API 처리 (포인트 차감 등)
```

### Rate Limiting 흐름
```
API 요청
    ↓
1. IP 추출 (X-Forwarded-For, X-Real-IP)
    ↓
2. IP Rate Limit 체크
    ↓
3. 사용자 Rate Limit 체크
    ↓
4. 한도 초과 시 429 반환
    ↓
5. 정상 처리
```

---

## 📋 보안 체크리스트

### API 엔드포인트

- [x] **Rate Limiting 적용**
  - [x] IP 기반 제한
  - [x] 사용자 기반 제한
  - [x] 429 응답 + Retry-After 헤더

- [x] **인증/인가**
  - [x] 세션 기반 인증
  - [x] HttpOnly 쿠키
  - [x] 세션 만료 관리
  - [ ] Supabase Auth 연동 (향후)

- [x] **입력 검증**
  - [x] 파일 매직 넘버 검증
  - [x] 파일명 보안 검증
  - [x] 파라미터 타입 검증
  - [x] 범위 검증

- [x] **에러 처리**
  - [x] 상세 에러 로깅
  - [x] 사용자 친화적 메시지
  - [x] 민감 정보 노출 방지

### 환경 설정

- [x] **API 키 관리**
  - [x] .env 파일 사용
  - [x] .gitignore 등록
  - [x] 서버 사이드만 접근

- [ ] **HTTPS 설정** (프로덕션)
  - [ ] SSL/TLS 인증서
  - [ ] Secure 쿠키 플래그

- [ ] **CORS 설정** (향후)
  - [ ] 허용 도메인 제한
  - [ ] Credentials 허용 설정

### 데이터 보호

- [x] **포인트 시스템**
  - [x] 서버에서만 차감
  - [x] 트랜잭션 로그
  - [x] 잔액 검증

- [ ] **개인정보 보호** (향후)
  - [ ] PDF 파일 자동 삭제
  - [ ] 사용자 데이터 암호화
  - [ ] 로그 마스킹

---

## 🔧 보안 설정 가이드

### 1. 환경변수 설정

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production

# Supabase (향후)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 프로덕션 배포 시

```bash
# Vercel 환경변수 설정
vercel env add GEMINI_API_KEY

# HTTPS 강제
# next.config.mjs
{
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
}
```

### 3. 세션 보안 강화

```typescript
// 쿠키 옵션
{
  httpOnly: true,           // JavaScript 접근 불가
  secure: true,             // HTTPS만 (프로덕션)
  sameSite: "strict",       // CSRF 방지
  maxAge: 30 * 24 * 60 * 60 // 30일
}
```

---

## 🚀 향후 보안 개선 계획

### Phase 1: 인증 강화
- [ ] Supabase Auth 완전 연동
- [ ] JWT 토큰 기반 인증
- [ ] 리프레시 토큰 구현
- [ ] 2FA (이메일 인증)

### Phase 2: 인프라 보안
- [ ] Redis로 Rate Limiting 이전
- [ ] WAF (Web Application Firewall)
- [ ] DDoS 보호 (Cloudflare)
- [ ] 로그 모니터링 (Sentry, LogRocket)

### Phase 3: 데이터 보호
- [ ] PDF 파일 자동 삭제 (24시간 후)
- [ ] 사용자 데이터 암호화 (AES-256)
- [ ] 감사 로그 (Audit Log)
- [ ] GDPR 준수

### Phase 4: 고급 보안
- [ ] API 키 로테이션
- [ ] IP 화이트리스트
- [ ] Rate Limit per API Key
- [ ] 이상 행동 감지 (AI 기반)

---

## 📚 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## 🆘 보안 이슈 발견 시

보안 취약점을 발견하신 경우:
1. **공개하지 마세요** (책임 있는 공개)
2. security@a-pl.com으로 이메일
3. 상세한 재현 방법 제공
4. 48시간 내 응답 보장

---

**에이쁠 보안팀** - 사용자 데이터 보호 최우선! 🔒
