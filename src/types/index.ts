/**
 * 에이쁠(A-Pl) 타입 정의
 */

export type TabItem = "home" | "library" | "profile";

export interface NavigationTab {
  id: TabItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export interface ExamSet {
  id: string;
  title: string;
  createdAt: Date;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  type: "multiple_choice" | "essay" | "mixed";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  examSetsCount: number;
}

export interface FeatureCard {
  label: string;
  value: string;
  description: string;
}
