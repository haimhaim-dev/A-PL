"use client";

/**
 * 분석 결과 리포트 컴포넌트
 * AI 분석 결과 시각화 및 리포트 UI
 */

import * as React from "react";
import { Sparkles, GraduationCap, ClipboardList, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SuitabilityScore {
  term: number;
  concept: number;
  calc: number;
}

interface AnalysisReportProps {
  aiAnalysisResult: {
    suitability: SuitabilityScore;
    recommendedDocType: string;
    pageCount: number;
  } | null;
  state: "upload" | "analyzing" | "settings" | "generating";
}

export function AnalysisReport({ state, aiAnalysisResult }: AnalysisReportProps) {
  // 분석 완료 후에는 심플한 완료 메시지 표시
  if (state === "settings" || state === "generating") {
    if (!aiAnalysisResult) return null;
    return (
      <div className="hidden lg:block space-y-4 animate-in slide-in-from-right-4 duration-700 ease-out">
        <Card className="p-6 bg-gradient-to-br from-emerald-600/20 to-green-500/10 border-emerald-500/30 shadow-xl backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-inner">
                <Sparkles className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-300">분석 최적화 완료</h3>
                <p className="text-sm text-emerald-200/80 mt-1 leading-relaxed">
                  문서 분석이 완료되었습니다. 맞춤형 시험 문제를 생성할 준비가 되었습니다.
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            {/* 신뢰 문구 및 정보 툴팁 */}
            <div className="pt-3 border-t border-emerald-500/20">
              <div className="flex items-start gap-2">
                <p className="text-xs text-emerald-200/70 leading-relaxed flex-1">
                  AI가 문서의 핵심 맥락과 수식 비중을 분석하여, 이용자에게 적합한 최적의 문제 세트를 구성했습니다.
                </p>
                <div className="relative group">
                  <Info className="h-3 w-3 text-emerald-400/60 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 border border-emerald-500/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      업로드된 문서의 난이도와 핵심 키워드를 추출하여, 가장 효율적인 학습 순서로 문제를 재구성합니다.
                    </p>
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (state !== "upload" && state !== "analyzing") {
    return null;
  }

  return (
    /* PC용 가이드 카드 (업로드 전) - 모바일에서는 완전히 숨김 */
    <div className="hidden lg:flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-1000 delay-200">
      <Card className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-white/10 shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative space-y-4">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold">어떤 파일을 올릴지 고민되시나요?</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            강의자료, 전공서적, 기출문제 등 학습에 필요한 PDF를 올려보세요.<br />
            AI가 내용을 분석하여 최적의 문제를 자동으로 만들어 드립니다.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/10">
          <GraduationCap className="h-6 w-6 text-blue-400" />
          <p className="text-sm font-bold">전공 수업 대비</p>
          <p className="text-xs text-slate-500 leading-relaxed">복잡한 개념과 수식도 정확하게 파악하여 출제합니다.</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/10">
          <ClipboardList className="h-6 w-6 text-purple-400" />
          <p className="text-sm font-bold">기출 문제 변형</p>
          <p className="text-xs text-slate-500 leading-relaxed">기존 시험지를 분석해 유사한 유형의 새 문제를 만듭니다.</p>
        </div>
      </div>
    </div>
  );
}
