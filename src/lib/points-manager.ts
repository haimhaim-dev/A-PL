import type {
  UserPoints,
  PointTransaction,
  PointTransactionReason,
  PointCost
} from "@/types/user";
import { DEFAULT_POINT_COSTS } from "@/types/user";

/**
 * 포인트 관리 시스템
 * 
 * 실제 프로덕션에서는 Supabase DB와 연동
 * 현재는 메모리 기반 임시 스토리지
 */

// 임시 메모리 스토리지 (개발용)
const userPointsStore = new Map<string, UserPoints>();
const transactionStore = new Map<string, PointTransaction[]>();

/**
 * 사용자 포인트 조회
 */
export async function getUserPoints(userId: string): Promise<UserPoints> {
  // TODO: Supabase에서 조회
  const existing = userPointsStore.get(userId);

  if (existing) {
    return existing;
  }

  // 신규 사용자: 기본 포인트 500 지급
  const newUserPoints: UserPoints = {
    userId,
    totalPoints: 500,
    usedPoints: 0,
    remainingPoints: 500,
    lastUpdated: new Date().toISOString()
  };

  userPointsStore.set(userId, newUserPoints);
  return newUserPoints;
}

/**
 * 포인트가 충분한지 확인
 */
export async function hasEnoughPoints(
  userId: string,
  requiredPoints: number
): Promise<boolean> {
  const userPoints = await getUserPoints(userId);
  return userPoints.remainingPoints >= requiredPoints;
}

/**
 * 포인트 차감
 */
export async function deductPoints(
  userId: string,
  amount: number,
  reason: PointTransactionReason,
  description: string,
  metadata?: Record<string, unknown>
): Promise<UserPoints> {
  const userPoints = await getUserPoints(userId);

  if (userPoints.remainingPoints < amount) {
    throw new Error(
      `포인트가 부족합니다. 현재: ${userPoints.remainingPoints}P, 필요: ${amount}P`
    );
  }

  // 포인트 차감
  userPoints.usedPoints += amount;
  userPoints.remainingPoints -= amount;
  userPoints.lastUpdated = new Date().toISOString();

  // 거래 내역 기록
  const transaction: PointTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amount: -amount, // 차감이므로 음수
    type: "spend",
    reason,
    description,
    createdAt: new Date().toISOString(),
    metadata
  };

  const userTransactions = transactionStore.get(userId) || [];
  userTransactions.push(transaction);
  transactionStore.set(userId, userTransactions);

  // 업데이트된 포인트 저장
  userPointsStore.set(userId, userPoints);

  // TODO: Supabase에 저장

  return userPoints;
}

/**
 * 포인트 추가 (보상, 구매 등)
 */
export async function addPoints(
  userId: string,
  amount: number,
  reason: PointTransactionReason,
  description: string
): Promise<UserPoints> {
  const userPoints = await getUserPoints(userId);

  // 포인트 추가
  userPoints.totalPoints += amount;
  userPoints.remainingPoints += amount;
  userPoints.lastUpdated = new Date().toISOString();

  // 거래 내역 기록
  const transaction: PointTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amount: amount,
    type: "earn",
    reason,
    description,
    createdAt: new Date().toISOString()
  };

  const userTransactions = transactionStore.get(userId) || [];
  userTransactions.push(transaction);
  transactionStore.set(userId, userTransactions);

  // 업데이트된 포인트 저장
  userPointsStore.set(userId, userPoints);

  // TODO: Supabase에 저장

  return userPoints;
}

/**
 * OCR 비용 계산
 */
export function calculateOCRCost(
  pageCount: number,
  costs: PointCost = DEFAULT_POINT_COSTS
): number {
  return pageCount * costs.ocrPerPage;
}

/**
 * 문제 생성 비용 계산
 */
export function calculateQuestionGenerationCost(
  questionCount: number,
  costs: PointCost = DEFAULT_POINT_COSTS
): number {
  // 기본적으로 1회당 고정 비용
  return costs.questionGeneration;
}

/**
 * 포인트 거래 내역 조회
 */
export async function getPointTransactions(
  userId: string,
  limit: number = 10
): Promise<PointTransaction[]> {
  const transactions = transactionStore.get(userId) || [];
  return transactions.slice(-limit).reverse(); // 최근 거래 먼저
}

/**
 * 포인트 시스템 초기화 (테스트용)
 */
export function resetPointsStore(): void {
  userPointsStore.clear();
  transactionStore.clear();
}
