export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  userAnswers: Record<string, number>;
  score: number;
  status: 'in_progress' | 'completed';
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'quiz_created' | 'quiz_completed';
  title: string;
  timestamp: string;
  metadata: {
    // 퀴즈 생성 시
    questionCount?: number;
    difficulty?: string;
    creditsUsed?: number;
    
    // 퀴즈 완료 시
    score?: number;
    totalQuestions?: number;
    accuracy?: number;
  };
}