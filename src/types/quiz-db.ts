/**
 * Supabase Quiz 테이블 타입 정의
 */

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
  id: string;  // uuid
  userId: string;  // uuid (FK → auth.users)
  title: string;  // text
  content: QuizContent;  // jsonb
  difficulty: string;  // text (easy, medium, hard)
  table_references?: TableReference[]; // 표 메타데이터 연결 (jsonb)
  createdAt: string;  // timestamptz
}

export interface QuizContent {
  questions: QuizQuestion[];
  generatedAt: string;
  mode?: "text" | "image" | "vision";
  quizMode?: string; // AUTO, TERM, CONCEPT, CALC
  amount?: number;
  source: string;
}

export interface QuizQuestion {
  question?: string;
  questionText?: string;  // 호환성을 위한 대체 필드
  options: string[];
  correctAnswerIndex: number;  // 1-4 인덱스 (1:A, 2:B, 3:C, 4:D)
  explanation: string;
  answer?: string;  // 정답 텍스트 (선택적)
}

export interface QuizInsert {
  id: string; // Manually generated UUID
  userId: string;
  title: string;
  content: QuizContent;
  difficulty: string;
  table_references?: TableReference[]; // 표 메타데이터 연결 (jsonb)
}

/**
 * Supabase QuizAttempt 테이블 타입 정의
 */

export interface QuizAttemptRow {
  id: string;  // uuid
  quizId: string;  // uuid (FK → Quiz)
  userId: string;  // uuid (FK → auth.users)
  userAnswers: number[] | Record<string, number>;  // jsonb (사용자가 선택한 답변)
  score: number;  // int4 (맞힌 문제 수)
  status: string;  // text (completed, in_progress)
  updatedAt: string;  // timestamptz
}

export interface QuizAttemptInsert {
  id?: string;
  quizId: string;
  userId: string;
  userAnswers: number[] | Record<string, number>;
  score: number;
  status: "completed" | "in_progress";
}
