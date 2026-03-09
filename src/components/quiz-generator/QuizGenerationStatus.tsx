/**
 * 퀴즈 생성 상태 표시 컴포넌트
 * 4단계 완성된 로직: 분석 데이터 시각화, 예외 처리, LaTeX 지원
 */

import * as React from "react";
import { Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PageState = "upload" | "analyzing" | "settings" | "generating";

interface QuizGenerationStatusProps {
  state: PageState;
  isGenerating: boolean;
  warning?: string | null;
}

export function QuizGenerationStatus({ 
  state, 
  isGenerating, 
  warning 
}: QuizGenerationStatusProps) {
  if (state === "upload") return null;

  return (
    <div className="space-y-4">
      {/* 분석 중 상태 */}
      {state === "analyzing" && (
        <Card className="p-6 bg-gradient-to-br from-primary-deep/20 to-blue-500/10 border-primary-deep/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary-deep/20 blur-xl animate-pulse" />
              <Loader2 className="h-8 w-8 text-primary-deep animate-spin relative" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI 문서 분석 중...</h3>
              <p className="text-sm text-slate-400">
                PDF 내용을 분석하여 최적의 문제 유형을 결정하고 있습니다
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 생성 중 상태 */}
      {state === "generating" && (
        <Card className="p-6 bg-gradient-to-br from-green-600/20 to-emerald-500/10 border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
              <Sparkles className="h-8 w-8 text-green-400 animate-pulse relative" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">퀴즈 생성 중...</h3>
              <p className="text-sm text-slate-400">
                분석 결과를 바탕으로 LaTeX 수식이 포함된 맞춤 문제를 생성하고 있습니다
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 경고 메시지 (4단계 예외 처리 로직) */}
      {warning && state === "settings" && (
        <Card className="p-4 bg-gradient-to-br from-orange-600/20 to-yellow-500/10 border-orange-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-orange-300">알림</p>
              <p className="text-xs text-orange-200/80 mt-1 leading-relaxed">
                {warning}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 분석 완료 상태 - 숨김 처리 (AnalysisReport에서 처리) */}
    </div>
  );
}