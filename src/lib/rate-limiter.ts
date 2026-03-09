/**
 * Rate Limiting 시스템
 * IP 기반 및 사용자 기반 요청 제한
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// 메모리 기반 Rate Limit 저장소 (프로덕션에서는 Redis 사용 권장)
const ipRateLimits = new Map<string, RateLimitRecord>();
const userRateLimits = new Map<string, RateLimitRecord>();

/**
 * Rate Limit 설정
 */
export interface RateLimitConfig {
  windowMs: number; // 시간 윈도우 (밀리초)
  maxRequests: number; // 최대 요청 수
}

export const RATE_LIMITS = {
  // IP 기반 제한
  global: {
    windowMs: 60 * 1000, // 1분
    maxRequests: 20 // 1분에 20회
  },
  // PDF 추출 (무료)
  pdfExtract: {
    windowMs: 60 * 1000, // 1분
    maxRequests: 5 // 1분에 5회
  },
  // OCR 처리 (유료)
  pdfOCR: {
    windowMs: 60 * 1000, // 1분
    maxRequests: 3 // 1분에 3회 (비용 때문에 더 엄격)
  },
  // AI 문제 생성
  aiGeneration: {
    windowMs: 60 * 1000, // 1분
    maxRequests: 3 // 1분에 3회
  }
} as const;

/**
 * IP 주소 추출
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}

/**
 * Rate Limit 체크 (IP 기반)
 */
export function checkIPRateLimit(
  ip: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  // 레코드가 없거나 시간 윈도우가 지났으면 초기화
  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + config.windowMs
    };
    ipRateLimits.set(ip, newRecord);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newRecord.resetAt
    };
  }

  // 요청 한도 초과
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    };
  }

  // 카운트 증가
  record.count++;
  ipRateLimits.set(ip, record);

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt
  };
}

/**
 * Rate Limit 체크 (사용자 기반)
 */
export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `user:${userId}`;
  const record = userRateLimits.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + config.windowMs
    };
    userRateLimits.set(key, newRecord);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newRecord.resetAt
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    };
  }

  record.count++;
  userRateLimits.set(key, record);

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt
  };
}

/**
 * Rate Limit 초과 시 Retry-After 헤더 계산 (초)
 */
export function getRetryAfter(resetAt: number): number {
  return Math.ceil((resetAt - Date.now()) / 1000);
}

/**
 * 정기적으로 만료된 레코드 정리 (메모리 누수 방지)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();

  // IP 레코드 정리
  for (const [key, record] of ipRateLimits.entries()) {
    if (now > record.resetAt + 60000) {
      // resetAt + 1분 후 삭제
      ipRateLimits.delete(key);
    }
  }

  // 사용자 레코드 정리
  for (const [key, record] of userRateLimits.entries()) {
    if (now > record.resetAt + 60000) {
      userRateLimits.delete(key);
    }
  }
}

// 5분마다 정리
setInterval(cleanupExpiredRecords, 5 * 60 * 1000);

/**
 * Rate Limit 통계 (모니터링용)
 */
export function getRateLimitStats() {
  return {
    ipRecords: ipRateLimits.size,
    userRecords: userRateLimits.size,
    totalRecords: ipRateLimits.size + userRateLimits.size
  };
}
