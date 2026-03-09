/**
 * 에이쁠(A-Pl) 전역 상수 정의
 */

export const APP_NAME = "에이쁠 (A-Pl)" as const;
export const APP_SHORT_NAME = "A-Pl" as const;
export const APP_DESCRIPTION =
  "대학생을 위한 AI 시험 문제 생성 서비스" as const;

export const COLORS = {
  primary: {
    deep: "#1E3A8A",
    default: "#3B82F6"
  },
  accent: {
    red: "#EF4444"
  },
  background: {
    dark: "#020617" // slate-950
  }
} as const;

export const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_QUESTIONS_PER_EXAM = 30;
export const MIN_QUESTIONS_PER_EXAM = 10;

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export const QUESTION_TYPES = ["multiple_choice", "essay", "mixed"] as const;

export const ROUTES = {
  home: "/",
  exams: "/exams",
  profile: "/profile",
  upload: "/upload"
} as const;
