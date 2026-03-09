/**
 * 에러 핸들링 관련 타입 정의
 */

export type APIErrorCode =
  | "RATE_LIMIT_EXCEEDED" // 429
  | "INSUFFICIENT_POINTS" // 402
  | "INVALID_REQUEST" // 400
  | "UNAUTHORIZED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "SERVER_ERROR" // 500
  | "SERVICE_UNAVAILABLE" // 503
  | "TIMEOUT" // 408
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface APIError {
  code: APIErrorCode;
  message: string;
  userMessage: string; // 사용자에게 표시할 친절한 메시지
  details?: string;
  retryable: boolean; // 재시도 가능 여부
  retryAfter?: number; // 재시도 권장 시간 (초)
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
  retryAfter?: number;
}

/**
 * HTTP 상태 코드별 사용자 친화적 메시지
 */
export const ERROR_MESSAGES: Record<number, { title: string; message: string; retryable: boolean }> = {
  // 400번대 - 클라이언트 에러
  400: {
    title: "잘못된 요청",
    message: "요청 형식이 올바르지 않습니다. 다시 시도해 주세요.",
    retryable: false
  },
  401: {
    title: "인증 필요",
    message: "로그인이 필요한 서비스입니다.",
    retryable: false
  },
  402: {
    title: "포인트 부족",
    message: "보유 포인트가 부족합니다. 포인트를 충전해 주세요.",
    retryable: false
  },
  403: {
    title: "접근 권한 없음",
    message: "이 기능을 사용할 권한이 없습니다.",
    retryable: false
  },
  404: {
    title: "찾을 수 없음",
    message: "요청하신 데이터를 찾을 수 없습니다.",
    retryable: false
  },
  408: {
    title: "요청 시간 초과",
    message: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
    retryable: true
  },
  429: {
    title: "너무 많은 요청",
    message: "현재 사용자가 많아 잠시 후 다시 시도해 주세요.",
    retryable: true
  },

  // 500번대 - 서버 에러
  500: {
    title: "서버 오류",
    message: "일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    retryable: true
  },
  502: {
    title: "게이트웨이 오류",
    message: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    retryable: true
  },
  503: {
    title: "서비스 점검 중",
    message: "현재 서비스 점검 중입니다. 잠시 후 다시 시도해 주세요.",
    retryable: true
  },
  504: {
    title: "게이트웨이 시간 초과",
    message: "서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
    retryable: true
  }
};

/**
 * 특정 에러 코드별 메시지
 */
export const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_POINTS: "보유 포인트가 부족합니다. 포인트를 충전해 주세요.",
  RATE_LIMIT_EXCEEDED: "현재 사용자가 많아 잠시 후 다시 시도해 주세요.",
  GEMINI_API_ERROR: "AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  PDF_PROCESSING_ERROR: "PDF 파일 처리 중 오류가 발생했습니다. 다른 파일을 시도해 주세요.",
  FILE_TOO_LARGE: "파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해 주세요.",
  INVALID_FILE_TYPE: "지원하지 않는 파일 형식입니다. PDF 파일만 업로드 가능합니다.",
  NO_TEXT_FOUND: "PDF에서 텍스트를 추출할 수 없습니다. 이미지 PDF인 경우 OCR 기능을 사용해 주세요.",
  NETWORK_ERROR: "네트워크 연결을 확인해 주세요."
};
