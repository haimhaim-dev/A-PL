"use client";

/**
 * 퀴즈 생성 설정 컴포넌트
 * 자동/직접 설정 모드 전환 및 문항 수 설정 UI
 */

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
type QuizMode = "AUTO" | "TERM" | "CONCEPT" | "CALC";

interface QuizGenerationSettings {
  quizMode: QuizMode;
  amount: number;
}

interface GenerationSettingsProps {
  settings: QuizGenerationSettings;
  updateSettings: (updates: Partial<QuizGenerationSettings>) => void;
  onGenerateQuiz: (quizTitle: string) => Promise<void>;
  currentCredits: number;
  isGenerating: boolean;
}

export function GenerationSettings({
  settings,
  isGenerating,
  currentCredits,
  updateSettings,
  onGenerateQuiz,
}: GenerationSettingsProps) {
  const router = useRouter();
  
  // 크레딧 소모량 계산 - 단순화된 공식
  const calculateCredits = React.useMemo(() => {
    return Math.ceil(settings.amount / 5); // 5문제당 1크레딧
  }, [settings.amount]);

  return (
    <div className="space-y-4 lg:space-y-6 animate-in slide-in-from-right-4 duration-700">
      {/* 단순화된 설정 블록 */}
      <div className="relative overflow-hidden rounded-[2rem] border border-primary-deep/50 bg-white/5 p-5 lg:p-6 shadow-xl shadow-primary-deep/20">
        {/* Glow 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/10 to-blue-500/10 rounded-[2rem] animate-pulse" />
        
        <div className="relative space-y-4">
          {/* 크레딧 정보 */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">AI 자동 문제 생성</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-slate-400">보유 크레딧:</span>
              <span className="text-sm font-bold text-yellow-400">{currentCredits.toLocaleString()}P</span>
              <Button
                onClick={() => router.push("/payments")}
                variant="ghost"
                size="sm"
                className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 p-1 h-auto ml-1"
              >
                [충전]
              </Button>
              <span className="text-xs text-slate-500">
                (소모 예정: {calculateCredits}P)
              </span>
            </div>
          </div>

          {/* AI 자동 모드 안내 */}
          <div className="bg-primary-deep/10 border border-primary-deep/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary-light" />
              <div>
                <p className="text-sm font-bold text-white">AI가 문서를 분석하여 최적의 문제를 생성합니다</p>
                <p className="text-xs text-slate-300 mt-1">문서 내용과 구조에 따라 가장 적합한 문제 유형과 난이도를 자동 선택합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 문제 유형 선택 */}
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 lg:p-8 shadow-xl">
        <div className="space-y-4 lg:space-y-5 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">문제 유형 선택</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "AUTO", label: "혼합" },
              { id: "TERM", label: "용어" },
              { id: "CONCEPT", label: "개념" },
              { id: "CALC", label: "계산" }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => updateSettings({ quizMode: mode.id as QuizMode })}
                className={cn(
                  "py-3 rounded-2xl text-xs font-black border transition-all",
                  settings.quizMode === mode.id 
                    ? "bg-primary-deep text-white border-primary-deep shadow-lg" 
                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          {/* 문제 수 설정 */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
              <span>문제 수</span>
              <span className="text-primary-light">{settings.amount}문항</span>
            </div>
            <input 
              type="range" min="5" max="20" step="5"
              value={settings.amount}
              onChange={(e) => updateSettings({ amount: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-deep"
            />
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="space-y-4">
        <Button 
          onClick={() => onGenerateQuiz("")}
          disabled={isGenerating || currentCredits < calculateCredits}
          className={cn(
            "w-full h-16 rounded-[2rem] bg-gradient-to-r from-primary-deep to-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl text-lg font-black",
            currentCredits < calculateCredits && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-6 w-6 mr-2" />
          )}
          {isGenerating 
            ? "문제 생성 중..." 
            : `AI 자동 문제 생성하기 (${calculateCredits}P)`
          }
        </Button>
        
        {/* 크레딧 부족 경고 */}
        {currentCredits < calculateCredits && (
          <div className="text-center">
            <p className="text-xs text-red-400">
              크레딧이 부족합니다. (필요: {calculateCredits}P, 보유: {currentCredits}P)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}