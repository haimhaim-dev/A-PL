/**
 * 사용자 및 포인트 시스템 타입 정의
 */

export interface UserPoints {
  userId: string;
  totalPoints: number;
  usedPoints: number;
  remainingPoints: number;
  lastUpdated: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "earn" | "spend";
  reason: PointTransactionReason;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export type PointTransactionReason =
  | "signup_bonus"
  | "pdf_ocr"
  | "question_generation"
  | "purchase"
  | "refund"
  | "admin_adjustment";

export interface PointCost {
  ocrPerPage: number; // OCR 1페이지당 포인트
  questionGeneration: number; // 문제 생성 1회당 포인트
  premiumFeature: number; // 프리미엄 기능
}

// 기본 포인트 비용 설정
export const DEFAULT_POINT_COSTS: PointCost = {
  ocrPerPage: 10, // OCR 1페이지 = 10포인트
  questionGeneration: 50, // 문제 생성 1회 = 50포인트
  premiumFeature: 100 // 프리미엄 기능 = 100포인트
};

export const SIGNUP_BONUS_POINTS = 500; // 회원가입 보너스
