/**
 * 공통 타입 정의
 */

// Navigation
export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export type NavigationTab = "home" | "quizzes" | "mypage";

// Feature Card
export interface FeatureCard {
  label: string;
  value: string;
  description: string;
}

// Exam Set
export interface ExamSet {
  id: string;
  title: string;
  createdAt: Date;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
}
