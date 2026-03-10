/**
 * 실제 데이터베이스 스키마와 일치하는 타입 정의
 * 
 * 주의: 이 파일의 타입들은 실제 Supabase 테이블 구조와 정확히 일치해야 합니다.
 */

// ========== users 테이블 ==========
export interface UsersRow {
  id: string; // UUID (auth.users 참조)
  email: string;
  name: string | null;
  avatar_url: string | null;
  credits: number; // 추가 필요한 컬럼
  created_at: string;
  updated_at: string;
}

export interface UsersInsert {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  credits?: number;
}

export interface UsersUpdate {
  email?: string;
  name?: string | null;
  avatar_url?: string | null;
  credits?: number;
}

// ========== Quiz 테이블 ==========
export interface QuizContent {
  questions: QuizQuestion[];
  generatedAt: string;
  mode?: "text" | "image" | "vision";
  quizMode?: string;
  amount?: number;
  source: string;
}

export interface QuizQuestion {
  question?: string;
  questionText?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  answer?: string;
}

export interface TableReference {
  id: string;
  pageNumber: number;
  parseStatus: 'raw' | 'processed';
  metadata?: {
    rowCount: number;
    columnCount: number;
    hasHeaders: boolean;
  };
}

export interface QuizRow {
  id: string; // TEXT PRIMARY KEY
  userId: string; // TEXT (auth.uid()::text와 비교)
  title: string;
  content: QuizContent; // JSONB
  difficulty: string;
  table_references?: TableReference[] | null; // JSONB
  createdAt: string; // TIMESTAMPTZ
}

export interface QuizInsert {
  id: string;
  userId: string;
  title: string;
  content: QuizContent;
  difficulty: string;
  table_references?: TableReference[] | null;
}

// ========== QuizAttempt 테이블 ==========
export interface QuizAttemptRow {
  id: string; // TEXT PRIMARY KEY
  quizId: string; // TEXT (FK → Quiz.id)
  userId: string; // TEXT (auth.uid()::text와 비교)
  userAnswers: number[] | Record<string, number>; // JSONB
  score: number;
  status: 'completed' | 'in_progress';
  updatedAt: string; // TIMESTAMPTZ
}

export interface QuizAttemptInsert {
  id?: string;
  quizId: string;
  userId: string;
  userAnswers: number[] | Record<string, number>;
  score: number;
  status: 'completed' | 'in_progress';
}

// ========== exporthistory 테이블 ==========
export interface ExportHistoryRow {
  id: string; // TEXT PRIMARY KEY
  user_id: string; // UUID (auth.users 참조)
  quiz_id: string; // TEXT (Quiz.id 참조)
  exported_at: string; // TIMESTAMPTZ
  file_name: string;
  file_path: string;
}

export interface ExportHistoryInsert {
  user_id: string;
  quiz_id: string;
  file_name: string;
  file_path: string;
}

// ========== point_logs 테이블 ==========
export interface PointLogRow {
  id: string; // TEXT PRIMARY KEY
  user_id: string; // UUID (auth.users 참조)
  amount: number; // INTEGER (양수: 충전, 음수: 사용)
  type: 'charge' | 'usage';
  description: string;
  created_at: string; // TIMESTAMPTZ
}

export interface PointLogInsert {
  user_id: string;
  amount: number;
  type: 'charge' | 'usage';
  description: string;
}

// ========== RPC 함수 타입 ==========
export interface LogAndDeductCreditsParams {
  p_user_id: string; // UUID
  p_amount: number; // 음수 = 차감, 양수 = 충전
  p_description: string;
  p_quiz_id?: string | null;
  p_type: 'usage' | 'charge';
}

export interface LogAndDeductCreditsResult {
  success: boolean;
  remaining_credits: number;
  amount_deducted: number;
}