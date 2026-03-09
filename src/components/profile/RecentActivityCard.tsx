"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, FileText, Trophy, Plus } from "lucide-react";
import type { QuizRow } from "@/types/quiz-db";
import type { ActivityItem } from "@/types/activity";

interface RecentActivityCardProps {
  recentQuizzes: QuizRow[];
  userQuizAttempts: any[];
}

export function RecentActivityCard({ recentQuizzes, userQuizAttempts }: RecentActivityCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 퀴즈 생성과 풀이 기록을 통합하여 최근 활동 목록 생성
  const getRecentActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // 퀴즈 생성 기록 추가
    recentQuizzes.forEach(quiz => {
      const questionCount = quiz.content.questions?.length || 0;
      const creditsUsed = Math.ceil(questionCount / 5); // 5문제당 1크레딧
      
      activities.push({
        id: `quiz_${quiz.id}`,
        type: 'quiz_created',
        title: quiz.title,
        timestamp: quiz.createdAt,
        metadata: {
          questionCount,
          difficulty: quiz.difficulty,
          creditsUsed
        }
      });
    });

    // 퀴즈 풀이 기록 추가
    userQuizAttempts.forEach(attempt => {
      if (attempt.Quiz && attempt.status === 'completed') {
        const totalQuestions = attempt.Quiz.content?.questions?.length || 0;
        const accuracy = totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0;
        
        activities.push({
          id: `attempt_${attempt.id}`,
          type: 'quiz_completed',
          title: attempt.Quiz.title,
          timestamp: attempt.updatedAt,
          metadata: {
            score: attempt.score,
            totalQuestions,
            accuracy
          }
        });
      }
    });

    // 시간순으로 정렬하고 최근 3개만 반환
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  };

  const recentActivities = getRecentActivities();

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quiz_created':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'quiz_completed':
        return <Trophy className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  const getActivityBadges = (activity: ActivityItem) => {
    if (activity.type === 'quiz_created') {
      return (
        <>
          <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400">
            {activity.metadata.creditsUsed}P 사용
          </Badge>
          <span className="text-xs text-muted-foreground">
            {activity.metadata.questionCount}문제
          </span>
        </>
      );
    } else if (activity.type === 'quiz_completed') {
      return (
        <>
          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600 dark:text-green-400">
            정답률 {activity.metadata.accuracy}%
          </Badge>
          <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400">
            학습 완료
          </Badge>
        </>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          최근 활동
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                {/* 아이콘 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* 활동 정보 */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActivityBadges(activity)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">아직 활동 내역이 없습니다</p>
            <p className="text-xs">첫 퀴즈를 만들어보세요!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}