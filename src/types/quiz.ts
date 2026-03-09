/**
 * 퀴즈/문제 관련 타입 정의
 */

// 객관식 문제
export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[]; // A, B, C, D 선택지
  correctAnswer: number; // 정답 인덱스 (0-3)
  explanation?: string; // 해설
  difficulty?: "easy" | "medium" | "hard";
}

// 퀴즈 세트
export interface QuizSet {
  id: string;
  title: string;
  questions: MultipleChoiceQuestion[];
  totalQuestions: number;
  createdAt: Date;
  pdfFileName?: string;
  pdfPageCount?: number;
}

// 사용자 답안
export interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  answeredAt: Date;
}

// 퀴즈 결과
export interface QuizResult {
  quizId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number; // 점수 (0-100)
  answers: UserAnswer[];
  completedAt: Date;
}

// API 요청/응답
export interface GenerateQuizRequest {
  pdfText: string;
  questionCount?: number; // 기본 5문제
  difficulty?: "easy" | "medium" | "hard";
}

export interface GenerateQuizResponse {
  success: boolean;
  quizSet: QuizSet;
  creditsUsed: number;
  remainingCredits: number;
}

export interface GenerateQuizError {
  error: string;
  code: string;
  details?: string;
}
