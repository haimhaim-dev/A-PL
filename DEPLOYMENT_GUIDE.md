# 배포 가이드

## 🚀 Vercel 배포

### 1단계: Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 배포
vercel
```

또는 [Vercel Dashboard](https://vercel.com) 에서:
1. "New Project" 클릭
2. GitHub 저장소 연결
3. Import

### 2단계: 환경변수 설정

Vercel Dashboard → Settings → Environment Variables:

```bash
# Site URL (자동 설정되지만 명시적으로 추가 권장)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

또는 CLI:
```bash
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
```

**중요**: `NEXT_PUBLIC_SITE_URL`은 Vercel이 자동으로 설정하지만, 명시적으로 추가하면 로컬/프리뷰/프로덕션 환경을 더 정확하게 제어할 수 있습니다.

### 3단계: Supabase Redirect URL 추가

Supabase Dashboard → Authentication → URL Configuration:

**Site URL**:
```
https://your-app.vercel.app
```

**Redirect URLs**:
```
https://your-app.vercel.app/**
```

### 4단계: Google OAuth Redirect URI 추가

Google Cloud Console → Credentials → OAuth 2.0 Client:

**Authorized redirect URIs** 추가:
```
https://xxxxx.supabase.co/auth/v1/callback
```

### 5단계: 배포

```bash
vercel --prod
```

---

## 📱 TWA (Google Play Store) 배포

### 사전 준비

1. **도메인**: HTTPS 커스텀 도메인 필수
2. **PWA**: manifest.json 및 서비스 워커
3. **Digital Asset Links**: 도메인 소유권 증명

### 1단계: Bubblewrap 설치

```bash
npm install -g @bubblewrap/cli
```

### 2단계: TWA 프로젝트 초기화

```bash
bubblewrap init --manifest https://your-domain.com/manifest.json
```

### 3단계: Digital Asset Links 설정

`assetlinks.json` 생성 → `public/.well-known/` 폴더:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.apl.app",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

### 4단계: APK 빌드

```bash
bubblewrap build
```

### 5단계: Google Play Console 업로드

1. [Google Play Console](https://play.google.com/console) 접속
2. "Create app" 클릭
3. APK 업로드
4. 스토어 리스팅 작성
5. 심사 제출

---

## 🔒 프로덕션 보안 설정

### 1. HTTPS 강제

`next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        }
      ]
    }
  ];
}
```

### 2. Rate Limiting

프로덕션에서는 Redis 사용 권장:

```bash
# Upstash Redis (무료 티어)
REDIS_URL=redis://...
```

### 3. 모니터링

```bash
# Sentry
SENTRY_DSN=https://...

# LogRocket
LOGROCKET_APP_ID=your-app-id
```

---

## 📊 성능 최적화

### 1. 이미지 최적화

```javascript
// next.config.mjs
images: {
  domains: ['lh3.googleusercontent.com'], // Google 프로필 이미지
  formats: ['image/avif', 'image/webp']
}
```

### 2. 번들 크기 분석

```bash
npm run build
npx @next/bundle-analyzer
```

### 3. Lighthouse 점수

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

---

## 🎯 배포 체크리스트

### 환경 설정
- [ ] Vercel 환경변수 설정
- [ ] Supabase Redirect URL 추가
- [ ] Google OAuth Redirect URI 추가
- [ ] 커스텀 도메인 연결

### 보안
- [ ] HTTPS 강제
- [ ] 보안 헤더 설정
- [ ] Rate Limiting (Redis)
- [ ] API 키 로테이션

### 성능
- [ ] 이미지 최적화
- [ ] 번들 크기 최적화
- [ ] CDN 설정
- [ ] 캐싱 전략

### 모니터링
- [ ] 에러 추적 (Sentry)
- [ ] 사용자 분석 (Google Analytics)
- [ ] 성능 모니터링
- [ ] 로그 수집

---

## 📚 참고 자료

- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [TWA Quick Start](https://github.com/GoogleChromeLabs/bubblewrap)

---

**에이쁠 배포 준비 완료!** 🚀
