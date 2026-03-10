"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { CreditSection } from "@/components/profile/CreditSection";
import { WeeklyLearningChart } from "@/components/profile/WeeklyLearningChart";
import { LearningAchievementCard } from "@/components/profile/LearningAchievementCard";
import { RecentActivityCard } from "@/components/profile/RecentActivityCard";
import { AccountSettingsSection } from "@/components/profile/AccountSettingsSection";
import { LoginButton } from "@/components/auth/LoginButton";

export default function ProfilePage() {
  const router = useRouter();
  const { user, credits, userQuizzes, isUserQuizzesLoaded, userQuizAttempts, isUserQuizAttemptsLoaded } = useAuth();

  // 학습 통계 계산 (훅 이후에 정의)
  const TOTAL_QUESTIONS_SOLVED = React.useMemo(() => {
    if (!isUserQuizzesLoaded) return 0; // 데이터 로딩 중이면 0 반환
    return userQuizzes.reduce((total, quiz) => {
      return total + (quiz.content?.questions?.length || 0);
    }, 0);
  }, [userQuizzes, isUserQuizzesLoaded]);

  const LEARNING_ACHIEVEMENT_PERCENTAGE = React.useMemo(() => {
    if (TOTAL_QUESTIONS_SOLVED === 0) return 0; // 문제 풀이 수가 0이면 0% 반환
    return Math.min(Math.floor((TOTAL_QUESTIONS_SOLVED / 100) * 100), 100);
  }, [TOTAL_QUESTIONS_SOLVED]);

  // 주간 학습 데이터 (실시간 데이터) - 7일간의 완료된 퀴즈 수
  const WEEKLY_LEARNING_DATA = React.useMemo(() => {
    if (!isUserQuizAttemptsLoaded) return []; // 데이터 로딩 중이면 빈 배열 반환

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // 오늘 포함 7일 전

    const dataMap: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dataMap[formattedDate] = 0;
    }

    // userQuizAttempts를 기반으로 각 날짜별 완료된 퀴즈 수 계산
    userQuizAttempts.forEach(attempt => {
      if (attempt.status === 'completed') {
        const attemptDate = new Date(attempt.updatedAt).toISOString().split('T')[0];
        if (dataMap[attemptDate] !== undefined) {
          dataMap[attemptDate]++;
        }
      }
    });

    // { day: 'MM-DD', questions: N } 형식으로 변환
    return Object.keys(dataMap).sort().map(dateString => ({
      day: new Date(dateString).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '/').slice(0, -1),
      questions: dataMap[dateString]
    }));
  }, [userQuizAttempts, isUserQuizAttemptsLoaded]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Card className="w-full max-w-md mx-4 sm:mx-auto">
            <CardHeader className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">마이페이지 접근</CardTitle>
              <CardDescription className="mt-2">
                개인정보와 학습 통계를 확인하려면 로그인이 필요합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <LoginButton 
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              />
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                홈으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-7xl mobile-page py-6">
          {/* 모바일 우선 레이아웃 */}
          <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            
            {/* 프로필 및 크레딧 섹션 (모바일에서 상단) */}
            <div className="space-y-4 lg:space-y-6 lg:col-span-1">
              <ProfileCard 
                user={user}
                totalQuizzes={userQuizzes.length}
              />
              <CreditSection 
                currentCredits={credits}
              />
            </div>

            {/* 통계 및 설정 섹션 (모바일에서 하단) */}
            <div className="space-y-4 lg:space-y-6 lg:col-span-2">
              {/* 학습 성취도와 최근 활동 - 모바일에서 세로 배치 */}
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                <LearningAchievementCard 
                  achievementPercentage={LEARNING_ACHIEVEMENT_PERCENTAGE}
                  totalQuestions={TOTAL_QUESTIONS_SOLVED}
                  streak={12}
                />
                <RecentActivityCard 
                  recentQuizzes={userQuizzes.slice(0, 3)}
                  userQuizAttempts={userQuizAttempts}
                />
              </div>

              {/* 주간 학습 차트 */}
              <WeeklyLearningChart 
                weeklyData={WEEKLY_LEARNING_DATA}
              />

              {/* 계정 설정 */}
              <AccountSettingsSection />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}