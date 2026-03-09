/**
 * 인증 및 세션 관리
 * 
 * 현재는 간단한 세션 기반 인증
 * 향후 Supabase Auth로 교체 예정
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "apl_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30일

/**
 * 세션 데이터
 */
export interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// 메모리 기반 세션 저장소 (개발용)
// 프로덕션에서는 Redis 또는 Supabase 사용
const sessions = new Map<string, Session>();

/**
 * 세션 생성
 */
export function createSession(userId: string): string {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: Session = {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE * 1000
  };

  sessions.set(sessionId, session);

  return sessionId;
}

/**
 * 세션 조회
 */
export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // 만료 확인
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * 세션 삭제
 */
export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Request에서 현재 사용자 추출
 */
export function getCurrentUser(request: NextRequest): string | null {
  const cookieStore = request.cookies;
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const session = getSession(sessionId);
  return session?.userId || null;
}

/**
 * 세션 ID 생성 (보안 강화)
 */
function generateSessionId(): string {
  // crypto.randomUUID()를 사용하여 보안 강화
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback (Node.js 환경)
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 임시 사용자 생성 (개발용)
 * Supabase Auth 연동 전까지 사용
 */
export function createTemporaryUser(): string {
  const userId = `temp_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return userId;
}

/**
 * 인증 미들웨어 헬퍼
 */
export function requireAuth(request: NextRequest): { userId: string } | null {
  const userId = getCurrentUser(request);

  if (!userId) {
    return null;
  }

  return { userId };
}

/**
 * 만료된 세션 정리
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();

  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

// 10분마다 정리
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

/**
 * 세션 통계 (모니터링용)
 */
export function getSessionStats() {
  return {
    totalSessions: sessions.size,
    activeSessions: Array.from(sessions.values()).filter(
      (s) => Date.now() < s.expiresAt
    ).length
  };
}
