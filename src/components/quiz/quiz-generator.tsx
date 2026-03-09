"use client";

import * as React from "react";
import { FileUp, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { PDFExtractResult } from "@/types/pdf";
import type { QuizSet } from "@/types/quiz";

interface QuizGeneratorProps {
  pdfResult: PDFExtractResult;
  onQuizGenerated: (quizSet: QuizSet) => void;
  onBack: () => void;
}

export function QuizGenerator({ pdfResult, onQuizGenerated, onBack }: QuizGeneratorProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { credits, refreshCredits } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const handleGenerateQuiz = async () => {
    // 포인트 확인
    if (credits < 1) {
      showWarning("크레딧 부족", "문제 생성에 1 크레딧이 필요합니다.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 전체 텍스트 결합
      const fullText = pdfResult.chunks.join("\n\n");

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfText: fullText,
          questionCount: 5,
          difficulty: "medium"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문제 생성 실패");
      }

      showSuccess("문제 생성 완료!", `${data.quizSet.totalQuestions}개의 문제가 생성되었습니다.`);
      
      // 크레딧 새로고침
      await refreshCredits();
      
      // 부모 컴포넌트로 전달
      onQuizGenerated(data.quizSet);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMsg);
      showError("문제 생성 실패", errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PDF 정보 카드 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FileUp className="h-5 w-5 text-blue-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                PDF 업로드 완료
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {pdfResult.metadata.pageCount}페이지, {pdfResult.chunks.length}개 섹션으로 분석됨
              </p>
            </div>
          </div>

          {/* 텍스트 미리보기 */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400 mb-2">텍스트 미리보기</p>
            <p className="text-sm text-slate-300 line-clamp-3">
              {pdfResult.chunks[0]?.substring(0, 200)}...
            </p>
          </div>
        </div>
      </Card>

      {/* AI 문제 생성 카드 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                AI 문제 생성
              </h3>
              <p className="text-sm text-slate-400">
                Gemini AI가 5개의 객관식 문제를 만듭니다
              </p>
            </div>
          </div>

          {/* 비용 안내 */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-yellow-400">
                💰 소요 크레딧: 1P
              </span>
              <span className="text-xs text-yellow-500/80">
                (현재 보유: {credits}P)
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isGenerating}
              className="flex-1"
            >
              뒤로 가기
            </Button>
            <Button
              onClick={handleGenerateQuiz}
              disabled={isGenerating || credits < 1}
              className="flex-1 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  문제 생성하기
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
