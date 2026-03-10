"use client";

import * as React from "react";
import { Clock, Play, FileText, Zap, Shield, Sparkles, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { QuizRow } from "@/types/quiz-db";
import type { SupabaseClient } from "@supabase/supabase-js";

interface QuizHistoryItem extends QuizRow {}

type DisplayMode = "compact" | "full";

interface QuizHistoryProps {
  quizHistory: QuizHistoryItem[];
  displayMode: DisplayMode;
  onQuizSelect: (quizId: string) => void;
  onExportClick: (quizId: string) => void;
  supabaseClient: SupabaseClient | null;
  userId: string;
}

export function QuizHistory({ quizHistory, displayMode, onQuizSelect, onExportClick, supabaseClient, userId }: QuizHistoryProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "방금 전";
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  const getPresetInfo = (preset?: string, content?: any) => {
    if (!preset) {
      return { 
        label: "기본", 
        color: "text-slate-400 bg-slate-500/20",
        tags: []
      };
    }
    
    const isDefenseMode = content?.adaptationInfo?.defenseLevel === "STEEL_DEFENSE";
    const isBridgeMode = content?.adaptationInfo?.bridgeModeActivated;
    const isCreativePivot = content?.adaptationInfo?.creativePivotActivated;
    
    let label = "";
    let color = "";
    
    if (preset.startsWith("AUTO_")) {
      const type = preset.replace("AUTO_", "");
      if (type === "CALC") {
        label = "AI 계산";
        color = "text-blue-400 bg-blue-500/20";
      } else if (type === "CONCEPT") {
        label = "AI 개념";
        color = "text-purple-400 bg-purple-500/20";
      } else if (type === "TERM") {
        label = "AI 용어";
        color = "text-green-400 bg-green-500/20";
      } else {
        label = "AI 혼합";
        color = "text-amber-400 bg-amber-500/20";
      }
    } else {
      label = "수동";
      color = "text-orange-400 bg-orange-500/20";
    }
    
    const tags = [];
    if (isDefenseMode) {
      if (isBridgeMode) {
        tags.push({ label: "🛡️ 브릿지", color: "text-red-400 bg-red-500/20" });
      } else if (isCreativePivot) {
        tags.push({ label: "🚀 전천후", color: "text-cyan-400 bg-cyan-500/20" });
      } else {
        tags.push({ label: "🛡️ 강철방어", color: "text-gray-400 bg-gray-500/20" });
      }
    }
    
    return { label, color, tags };
  };

  // cn 함수 인자들을 미리 변수로 선언하여 가독성 및 잠재적 에러 방지
  const containerClasses = cn(
    displayMode === "full" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3 max-h-64 overflow-y-auto",
    "mt-4"
  );

  return (
    <div className={containerClasses}>
      {quizHistory.map((quiz) => {
        const cardBaseClasses = "relative flex flex-col p-4 bg-white/5 border border-white/10 shadow-lg rounded-xl";
        const cardDisplayClasses = displayMode === "full" ? "min-h-[140px]" : "min-h-[60px] flex-row items-center gap-3";
        const cardCombinedClasses = cn(cardBaseClasses, cardDisplayClasses);

        const headerClasses = cn(
          "flex items-center gap-3",
          displayMode === "full" ? "mb-3" : ""
        );

        const presetInfo = getPresetInfo((quiz as any).document_preset || null, quiz.content);
        
        return (
          <Card key={quiz.id} className={cardCombinedClasses}>
            {displayMode === "compact" ? (
              // 컴팩트 모드: 가로 레이아웃
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-lg bg-primary-deep/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {quiz.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {formatDate(quiz.createdAt)}
                    </span>
                    {/* 태그들을 제목 아래에 인라인으로 표시 */}
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      presetInfo.color
                    )}>
                      {presetInfo.label}
                    </span>
                    {presetInfo.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          tag.color
                        )}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        onQuizSelect(quiz.id);
                      } catch (error) {
                        console.error('퀴즈 이동 중 오류:', error);
                      }
                    }}
                    className="min-h-[44px] px-3 sm:px-4 bg-primary-deep/20 hover:bg-primary-deep/30 text-primary-light border-primary-deep/30 transition-all duration-200 whitespace-nowrap"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    다시 풀기
                  </Button>
                </div>
              </div>
            ) : (
              // 풀 모드: 세로 레이아웃
              <div className="flex flex-col flex-1">
                <div className={headerClasses}>
                  <div className="h-10 w-10 rounded-lg bg-primary-deep/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {quiz.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatDate(quiz.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 태그들 */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      presetInfo.color
                    )}>
                      {presetInfo.label}
                    </span>
                    
                    {presetInfo.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          tag.color
                        )}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </>
                </div>

                <div className="flex gap-1.5 sm:gap-2 justify-end items-center pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      try {
                        onExportClick(quiz.id);
                      } catch (error) {
                        console.error('내보내기 중 오류:', error);
                      }
                    }}
                    className="min-h-[44px] px-3 sm:px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all duration-200 whitespace-nowrap"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    내보내기
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        onQuizSelect(quiz.id);
                      } catch (error) {
                        console.error('퀴즈 이동 중 오류:', error);
                      }
                    }}
                    className="min-h-[44px] px-3 sm:px-4 bg-primary-deep hover:bg-primary-deep/90 text-white transition-all duration-200 whitespace-nowrap"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    풀기
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}