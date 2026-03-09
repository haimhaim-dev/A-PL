/**
 * 시험 문제 관련 타입 정의
 */

export type DifficultyLevel = "easy" | "medium" | "hard";
export type QuestionType = "multiple_choice" | "essay" | "mixed";

export interface Question {
  id: string;
  type: "multiple_choice" | "essay";
  question: string;
  options?: string[]; // 객관식인 경우
  correctAnswer?: string; // 객관식인 경우
  expectedAnswer?: string; // 서술형인 경우 모범 답안
  points: number;
  difficulty: DifficultyLevel;
  keywords: string[];
  explanation?: string;
}

export interface ExamSet {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  pdfFileName: string;
  pdfUrl: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  questions: Question[];
  type: QuestionType;
  estimatedTime: number; // 예상 소요 시간 (분)
  status: "draft" | "completed" | "archived";
}

export interface CreateExamSetInput {
  title: string;
  pdfFile: File;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionType: QuestionType;
}

export interface ExamSetSummary {
  id: string;
  title: string;
  createdAt: Date;
  questionCount: number;
  difficulty: DifficultyLevel;
  type: QuestionType;
}
