"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, BookOpen } from "lucide-react"; // BookOpen 아이콘 추가
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // useRouter 추가

interface WeeklyDataPoint {
  day: string; // 예: "03/06"
  questions: number;
}

interface WeeklyLearningChartProps {
  weeklyData: WeeklyDataPoint[];
}

export function WeeklyLearningChart({ weeklyData }: WeeklyLearningChartProps) {
  const router = useRouter();
  const MAX_QUESTIONS = React.useMemo(() => Math.max(...weeklyData.map(d => d.questions), 0), [weeklyData]);
  const TOTAL_WEEKLY_QUESTIONS = React.useMemo(() => weeklyData.reduce((sum, d) => sum + d.questions, 0), [weeklyData]);
  const AVERAGE_DAILY_QUESTIONS = React.useMemo(() => Math.round(TOTAL_WEEKLY_QUESTIONS / weeklyData.length) || 0, [TOTAL_WEEKLY_QUESTIONS, weeklyData.length]);

  const TODAY_DATE_FORMATTED = new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '/').slice(0, -1);

  // 모든 questions 값이 0인지 확인
  const isEmptyState = weeklyData.every(d => d.questions === 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          주간 학습 리포트
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>최근 7일</span>
          </div>
          <span>총 {TOTAL_WEEKLY_QUESTIONS}문제 해결</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 차트 영역 */}
        {isEmptyState ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-40 relative">
            {/* 하단 날짜축 유지 */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
              {weeklyData.map(data => (
                <div key={data.day} className="flex-1 text-center text-xs text-muted-foreground opacity-70">
                  {data.day}
                </div>
              ))}
            </div>
            {/* 점선 박스 배경 */}
            <div className="absolute inset-0 flex justify-between items-end pb-8 px-2 opacity-20">
              {weeklyData.map(data => (
                <div key={data.day} className="flex-1 h-full flex flex-col items-center justify-end">
                  <div className="w-full h-32 border-2 border-dashed border-gray-600/50 rounded-md" />
                </div>
              ))}
            </div>

            <BookOpen className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
            <p className="text-sm text-muted-foreground mb-4">
              아직 학습 기록이 없습니다. 첫 퀴즈를 생성하고 기록을 채워보세요!
            </p>
            <Button onClick={() => router.push("/simple-quiz")} variant="outline">
              퀴즈 생성하러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-end h-40 gap-2">
              {weeklyData.map((data, index) => {
                const HEIGHT_PERCENTAGE = MAX_QUESTIONS > 0 ? (data.questions / MAX_QUESTIONS) * 100 : 0;
                const IS_TODAY = data.day === TODAY_DATE_FORMATTED; 
                
                return (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                    {/* 바 차트 */}
                    <div className="w-full flex flex-col justify-end h-32">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          IS_TODAY 
                            ? 'bg-gradient-to-t from-indigo-500 to-indigo-400' 
                            : 'bg-gradient-to-t from-blue-600/70 to-blue-500/70'
                        }`}
                        style={{ height: `${HEIGHT_PERCENTAGE}%` }}
                      />
                    </div>
                    
                    {/* 값 표시 */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {data.questions}
                      </p>
                      <p className={`text-xs ${IS_TODAY ? 'text-indigo-400 font-medium' : 'text-muted-foreground'}`}>
                        {data.day}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-indigo-500">{TOTAL_WEEKLY_QUESTIONS}</p>
            <p className="text-xs text-muted-foreground">총 문제 생성 수</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-500">{AVERAGE_DAILY_QUESTIONS}</p>
            <p className="text-xs text-muted-foreground">일평균</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-500">{MAX_QUESTIONS}</p>
            <p className="text-xs text-muted-foreground">최고기록</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}