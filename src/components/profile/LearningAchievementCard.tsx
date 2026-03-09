"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Target } from "lucide-react";

interface LearningAchievementCardProps {
  achievementPercentage: number;
  totalQuestions: number;
  streak: number;
}

export function LearningAchievementCard({ 
  achievementPercentage, 
  totalQuestions, 
  streak 
}: LearningAchievementCardProps) {
  
  const ACHIEVEMENT_LEVEL = React.useMemo(() => {
    if (achievementPercentage >= 90) return { level: "마스터", color: "text-yellow-500", bgColor: "bg-yellow-500/20" };
    if (achievementPercentage >= 70) return { level: "고급", color: "text-purple-500", bgColor: "bg-purple-500/20" };
    if (achievementPercentage >= 50) return { level: "중급", color: "text-blue-500", bgColor: "bg-blue-500/20" };
    if (achievementPercentage >= 30) return { level: "초급", color: "text-green-500", bgColor: "bg-green-500/20" };
    return { level: "입문", color: "text-gray-500", bgColor: "bg-gray-500/20" };
  }, [achievementPercentage]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Target className="w-5 h-5" />
          학습 성취도
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 원형 프로그레스 영역 */}
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24">
            {/* 배경 원 */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted-foreground/20"
              />
              {/* 진행률 원 */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - achievementPercentage / 100)}`}
                className="text-green-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            {/* 중앙 텍스트 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-green-500">
                {achievementPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* 성취도 레벨 */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${ACHIEVEMENT_LEVEL.bgColor} ${ACHIEVEMENT_LEVEL.color}`}>
            <Award className="w-4 h-4" />
            {ACHIEVEMENT_LEVEL.level}
          </div>
          <p className="text-xs text-muted-foreground">
            총 {totalQuestions}문제 해결
          </p>
        </div>

        {/* 연속 학습 일수 */}
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-orange-500">{streak}일</p>
          <p className="text-xs text-muted-foreground">연속 학습</p>
        </div>

        {/* 다음 목표까지 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>다음 레벨까지</span>
            <span>{Math.max(0, Math.ceil((achievementPercentage + 20) / 20) * 20 - achievementPercentage)}% 남음</span>
          </div>
          <Progress 
            value={achievementPercentage % 20 === 0 ? 100 : (achievementPercentage % 20) * 5} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}