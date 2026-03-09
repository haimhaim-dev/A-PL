# 에러 핸들링 시스템 가이드

## 개요

에이쁠의 에러 핸들링 시스템은 사용자에게 친절하고 명확한 에러 메시지를 제공하며, 자동 재시도 로직을 통해 일시적인 네트워크 문제나 API 제한을 처리합니다.

## 🎯 핵심 기능

### 1. 사용자 친화적 에러 메시지
- HTTP 상태 코드별 맞춤 메시지
- **429 (Rate Limit)**: "현재 사용자가 많아 잠시 후 다시 시도해 주세요"
- 재시도 가능 여부 자동 판단

### 2. 자동 재시도 (Exponential Backoff)
- 일시적 에러 자동 재시도
- 지수 백오프 전략
- 최대 3회 재시도

### 3. Toast 알림
- 성공/실패/경고/정보 알림
- 자동 닫힘 (5초)
- 우측 하단에 표시

## 📁 파일 구조

```
src/
├── types/
│   └── error.ts              # 에러 타입 정의
├── lib/
│   └── error-handler.ts      # 에러 핸들링 로직
├── hooks/
│   └── use-toast.tsx         # Toast Hook
└── components/
    └── ui/
        └── toast.tsx         # Toast 컴포넌트
```

## 🔧 사용 방법

### 1. API 클라이언트에서 사용

```typescript
import { extractPDFText, getErrorMessage } from "@/lib/api-client";
import { isAPIError } from "@/lib/error-handler";
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { showError, showSuccess } = useToast();

  const handleUpload = async (file: File) => {
    try {
      const result = await extractPDFText(file);
      showSuccess("성공!", "PDF 텍스트를 추출했습니다.");
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      
      if (isAPIError(error)) {
        showError(error.message, error.userMessage);
        
        // Rate Limit 에러 특별 처리
        if (error.code === "RATE_LIMIT_EXCEEDED" && error.retryAfter) {
          showWarning(
            "잠시 후 다시 시도해 주세요",
            `약 ${error.retryAfter}초 후에 다시 시도할 수 있습니다.`
          );
        }
      } else {
        showError("오류 발생", errorMsg);
      }
    }
  };
}
```

### 2. Toast 사용

```typescript
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // 성공 메시지
  showSuccess("성공!", "작업이 완료되었습니다.");

  // 에러 메시지 (7초 표시)
  showError("오류 발생", "파일을 처리할 수 없습니다.");

  // 경고 메시지
  showWarning("주의", "파일 크기가 큽니다.");

  // 정보 메시지
  showInfo("안내", "처리 중입니다...");
}
```

## 📊 에러 코드 및 메시지

### HTTP 상태 코드별 메시지

| 코드 | 제목 | 메시지 | 재시도 가능 |
|------|------|--------|------------|
| 400 | 잘못된 요청 | 요청 형식이 올바르지 않습니다. | ❌ |
| 401 | 인증 필요 | 로그인이 필요한 서비스입니다. | ❌ |
| 402 | 포인트 부족 | 보유 포인트가 부족합니다. | ❌ |
| 408 | 요청 시간 초과 | 요청 시간이 초과되었습니다. | ✅ |
| **429** | **너무 많은 요청** | **현재 사용자가 많아 잠시 후 다시 시도해 주세요.** | ✅ |
| 500 | 서버 오류 | 일시적인 서버 오류가 발생했습니다. | ✅ |
| 503 | 서비스 점검 중 | 현재 서비스 점검 중입니다. | ✅ |

### 커스텀 에러 코드

```typescript
INSUFFICIENT_POINTS: "보유 포인트가 부족합니다. 포인트를 충전해 주세요."
RATE_LIMIT_EXCEEDED: "현재 사용자가 많아 잠시 후 다시 시도해 주세요."
GEMINI_API_ERROR: "AI 서비스에 일시적인 문제가 발생했습니다."
PDF_PROCESSING_ERROR: "PDF 파일 처리 중 오류가 발생했습니다."
FILE_TOO_LARGE: "파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해 주세요."
INVALID_FILE_TYPE: "지원하지 않는 파일 형식입니다. PDF 파일만 업로드 가능합니다."
NO_TEXT_FOUND: "PDF에서 텍스트를 추출할 수 없습니다. OCR 기능을 사용해 주세요."
NETWORK_ERROR: "네트워크 연결을 확인해 주세요."
```

## 🔄 자동 재시도 로직

### Exponential Backoff

```typescript
// 기본 설정
{
  maxRetries: 3,              // 최대 3회 재시도
  initialDelay: 1000,         // 초기 대기: 1초
  maxDelay: 10000,            // 최대 대기: 10초
  backoffMultiplier: 2,       // 2배씩 증가
  retryableErrors: [
    "RATE_LIMIT_EXCEEDED",    // 429
    "TIMEOUT",                // 408
    "SERVER_ERROR",           // 500
    "SERVICE_UNAVAILABLE"     // 503
  ]
}
```

### 재시도 흐름

```
1차 시도 실패 (429) → 1초 대기 → 2차 시도
2차 시도 실패 (429) → 2초 대기 → 3차 시도
3차 시도 실패 (429) → 4초 대기 → 4차 시도
4차 시도 실패 → 에러 반환
```

### Retry-After 헤더 지원

서버에서 `Retry-After` 헤더를 보내면 해당 시간만큼 대기:

```typescript
// 서버 응답 예시
{
  status: 429,
  headers: {
    "Retry-After": "60" // 60초 후 재시도
  }
}
```

## 🎨 Toast UI

### 타입별 스타일

```typescript
// Success (초록색)
showSuccess("성공!", "작업 완료");

// Error (빨간색, 7초 표시)
showError("오류", "처리 실패");

// Warning (노란색)
showWarning("주의", "경고 메시지");

// Info (파란색)
showInfo("안내", "정보 메시지");
```

### 표시 위치
- 우측 하단 (모바일: 하단 중앙)
- 여러 개 동시 표시 가능 (스택)
- 애니메이션: 우측에서 슬라이드

## 📝 API Route에서 에러 반환

### 올바른 에러 응답 형식

```typescript
// app/api/example/route.ts
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ... 처리 로직
  } catch (error) {
    // 429 Rate Limit
    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error: "현재 사용자가 많아 잠시 후 다시 시도해 주세요.",
          code: "RATE_LIMIT_EXCEEDED",
          details: error.message
        },
        { 
          status: 429,
          headers: {
            "Retry-After": "60" // 60초 후 재시도
          }
        }
      );
    }

    // 402 Insufficient Points
    if (isInsufficientPoints(error)) {
      return NextResponse.json(
        {
          error: "포인트가 부족합니다.",
          code: "INSUFFICIENT_POINTS",
          requiredPoints: 100,
          currentPoints: 50
        },
        { status: 402 }
      );
    }

    // 500 Server Error
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        code: "SERVER_ERROR",
        details: error.message
      },
      { status: 500 }
    );
  }
}
```

## 🧪 테스트 시나리오

### 1. Rate Limit 테스트 (429)

```typescript
// API Route에서 429 반환하도록 설정
return NextResponse.json(
  { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
  { status: 429, headers: { "Retry-After": "5" } }
);
```

**기대 결과**:
- Toast: "현재 사용자가 많아 잠시 후 다시 시도해 주세요"
- 5초 후 자동 재시도
- 최대 3회 재시도

### 2. 포인트 부족 테스트 (402)

```typescript
return NextResponse.json(
  {
    error: "포인트 부족",
    code: "INSUFFICIENT_POINTS",
    requiredPoints: 100,
    currentPoints: 50
  },
  { status: 402 }
);
```

**기대 결과**:
- Toast: "포인트가 부족합니다. 포인트를 충전해 주세요."
- 재시도 안 함 (retryable: false)

### 3. 네트워크 에러 테스트

```typescript
// 인터넷 연결 끊기
```

**기대 결과**:
- Toast: "네트워크 연결을 확인해 주세요."
- 자동 재시도 (최대 3회)

## 🚀 향후 개선 계획

- [ ] Sentry 연동 (에러 추적)
- [ ] 에러 통계 대시보드
- [ ] 재시도 전략 최적화
- [ ] 오프라인 모드 지원
- [ ] 에러 로그 저장 (Supabase)

## 📚 참고 자료

- [HTTP 상태 코드](https://developer.mozilla.org/ko/docs/Web/HTTP/Status)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Retry-After 헤더](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)

---

**에이쁠 에러 핸들링** - 사용자 경험 최우선! 🚀
