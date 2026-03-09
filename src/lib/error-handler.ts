import type { APIError, APIErrorCode, ErrorResponse } from "@/types/error";
import { ERROR_MESSAGES, CUSTOM_ERROR_MESSAGES } from "@/types/error";

/**
 * 에러 핸들링 유틸리티
 */

/**
 * HTTP 상태 코드를 APIErrorCode로 변환
 */
function statusToErrorCode(status: number): APIErrorCode {
  switch (status) {
    case 429:
      return "RATE_LIMIT_EXCEEDED";
    case 402:
      return "INSUFFICIENT_POINTS";
    case 400:
      return "INVALID_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 408:
      return "TIMEOUT";
    case 500:
      return "SERVER_ERROR";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return status >= 500 ? "SERVER_ERROR" : "UNKNOWN_ERROR";
  }
}

/**
 * Response 객체를 APIError로 변환
 */
export async function parseAPIError(response: Response): Promise<APIError> {
  const status = response.status;
  const errorCode = statusToErrorCode(status);

  let errorData: ErrorResponse | null = null;
  try {
    errorData = await response.json();
  } catch {
    // JSON 파싱 실패 시 기본 에러 메시지 사용
  }

  // Retry-After 헤더 확인
  const retryAfter = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;

  // 사용자 친화적 메시지 생성
  const errorInfo = ERROR_MESSAGES[status];
  const customMessage = errorData?.code
    ? CUSTOM_ERROR_MESSAGES[errorData.code]
    : null;

  const userMessage =
    customMessage ||
    errorInfo?.message ||
    "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

  return {
    code: errorCode,
    message: errorData?.error || errorInfo?.title || "오류 발생",
    userMessage,
    details: errorData?.details,
    retryable: errorInfo?.retryable ?? (status >= 500 || status === 429 || status === 408),
    retryAfter: retryAfterSeconds || (status === 429 ? 60 : undefined) // 429는 기본 60초
  };
}

/**
 * 네트워크 에러를 APIError로 변환
 */
export function parseNetworkError(error: unknown): APIError {
  const message = error instanceof Error ? error.message : "Unknown error";

  // Timeout 감지
  if (
    message.includes("timeout") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNABORTED")
  ) {
    return {
      code: "TIMEOUT",
      message: "요청 시간 초과",
      userMessage: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
      retryable: true
    };
  }

  // Network 에러 감지
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("ENOTFOUND") ||
    message.includes("ECONNREFUSED")
  ) {
    return {
      code: "NETWORK_ERROR",
      message: "네트워크 에러",
      userMessage: "네트워크 연결을 확인해 주세요.",
      retryable: true
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message,
    userMessage: "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    retryable: true
  };
}

/**
 * 재시도 로직 (Exponential Backoff)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number; // ms
    maxDelay?: number; // ms
    backoffMultiplier?: number;
    retryableErrors?: APIErrorCode[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = ["RATE_LIMIT_EXCEEDED", "TIMEOUT", "SERVER_ERROR", "SERVICE_UNAVAILABLE"]
  } = options;

  let lastError: APIError | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // APIError로 변환
      if (error instanceof Response) {
        lastError = await parseAPIError(error);
      } else {
        lastError = parseNetworkError(error);
      }

      // 재시도 불가능한 에러면 즉시 throw
      if (!lastError.retryable || !retryableErrors.includes(lastError.code)) {
        throw lastError;
      }

      // 마지막 시도였으면 throw
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 재시도 대기
      const waitTime = lastError.retryAfter
        ? lastError.retryAfter * 1000 // Retry-After는 초 단위
        : Math.min(delay, maxDelay);

      console.log(
        `재시도 ${attempt + 1}/${maxRetries} - ${waitTime}ms 후 재시도...`
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // 다음 delay 계산 (Exponential Backoff)
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * API 에러인지 확인
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "userMessage" in error
  );
}

/**
 * 에러 로깅 (향후 Sentry 등 연동)
 */
export function logError(error: APIError, context?: Record<string, unknown>): void {
  console.error("[API Error]", {
    code: error.code,
    message: error.message,
    details: error.details,
    retryable: error.retryable,
    context
  });

  // TODO: Sentry 또는 다른 에러 추적 서비스로 전송
  // Sentry.captureException(error, { contexts: { custom: context } });
}
