<<<<<<< HEAD
# 🎓 에이쁠(A-Pl) - AI 시험 문제 생성 서비스

대학생을 위한 AI 기반 시험 문제 자동 생성 서비스입니다.  
강의 자료 PDF를 업로드하면 AI가 객관식 문제를 자동으로 만들어줍니다.

📘 **상세 문서**: [current_status.md](./current_status.md) ⭐ - 모든 정보가 여기 있습니다!

---

## ✨ 주요 기능

### 🤖 AI 문제 생성
- PDF 업로드 → 자동 분석 → 객관식 5문제 생성
- **일반 모드 (1P)**: 텍스트 PDF 분석
- **정밀 모드 (10P/페이지)**: 이미지/수식/손글씨 분석

### 💰 크레딧 시스템
- 회원가입 보너스: 5P
- 일반 모드: 1P
- 정밀 모드: 10P/페이지 (최대 15페이지)

### 🔒 인증 & 보안
- Google OAuth 소셜 로그인
- Supabase Auth + RLS
- 자동 환불 시스템 (실패 시)

---

## 🛠 Tech Stack

```
Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
Backend: Next.js API Routes, Supabase
AI: Google Gemini 1.5 Flash (Vision + Text)
PDF: pdfjs-dist (클라이언트), pdf-parse (서버)
```

---

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 편집 (Supabase + Gemini API 키)
```

### 3. Supabase 설정
[SUPABASE_QUICKSTART.md](./SUPABASE_QUICKSTART.md) 가이드 참고 (5분)

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 접속
```
http://localhost:3000
```

---

## 📚 문서

- **[현재 상태 문서](./current_status.md)** ⭐ - 전체 정보 통합
- [Supabase 설정](./SUPABASE_QUICKSTART.md) - DB 및 OAuth 설정
- [배포 가이드](./DEPLOYMENT_GUIDE.md) - Vercel 배포

---

## 🎯 MVP 목표

**2026년 4월 입대 전 수익화 가능한 MVP 완성**

### 완료 ✅
- [x] Google OAuth 로그인
- [x] 크레딧 시스템
- [x] AI 문제 생성 (일반 모드)
- [x] AI 문제 생성 (정밀 모드)
- [x] 퀴즈 풀이
- [x] 자동 환불
- [x] 비용 최적화

### 테스트 필요 ⏳
- [ ] 일반 모드 실전 테스트
- [ ] 정밀 모드 실전 테스트
- [ ] 대용량 파일 처리

### 추후 작업 📝
- [ ] 문제 저장/히스토리
- [ ] 포인트 구매
- [ ] 배포 (Vercel)
- [ ] Google Play Store (TWA)

---

## 📞 Quick Links

- **문제 발생 시**: [current_status.md](./current_status.md) → "트러블슈팅" 섹션
- **환경 설정**: [SUPABASE_QUICKSTART.md](./SUPABASE_QUICKSTART.md)
- **배포 준비**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

Made with ❤️ for college students

**최종 업데이트**: 2026-02-06
=======
# A-PL
apl
>>>>>>> 25095875680e08a442e3818ca4c21f7474b11ae4
