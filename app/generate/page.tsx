"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PDFUploader } from "@/components/upload/pdf-uploader";
import { QuizGenerator } from "@/components/quiz/quiz-generator";
import { QuizDisplay } from "@/components/quiz/quiz-display";
import { LoginRequired } from "@/components/upload/login-required";
import { useAuth } from "@/hooks/use-auth";
import type { PDFExtractResult } from "@/types/pdf";
import type { QuizSet } from "@/types/quiz";

type PageState = "upload" | "generate" | "quiz" | "result";

export default function GeneratePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [pageState, setPageState] = React.useState<PageState>("upload");
  const [pdfResult, setPdfResult] = React.useState<PDFExtractResult | null>(null);
  const [quizSet, setQuizSet] = React.useState<QuizSet | null>(null);
  const [finalScore, setFinalScore] = React.useState(0);

  // PDF 업로드 완료
  const handlePDFExtracted = (result: PDFExtractResult) => {
    setPdfResult(result);
    setPageState("generate");
  };

  // 퀴즈 생성 완료
  const handleQuizGenerated = (quiz: QuizSet) => {
    setQuizSet(quiz);
    setPageState("quiz");
  };

  // 퀴즈 완료
  const handleQuizComplete = (score: number) => {
    setFinalScore(score);
    setPageState("result");
  };

  // 처음으로
  const handleReset = () => {
    setPdfResult(null);
    setQuizSet(null);
    setFinalScore(0);
    setPageState("upload");
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-deep border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안 됨
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5 pt-10 pb-6">
        <header className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Button>
        </header>
        <main className="flex-1">
          <LoginRequired />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5 pt-10 pb-6">
      {/* 헤더 */}
      <header className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            if (pageState === "upload") {
              router.push("/");
            } else {
              handleReset();
            }
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {pageState === "upload" ? "홈으로" : "처음으로"}
        </Button>
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-white">AI 문제 생성</h1>
          <p className="mt-1 text-sm text-slate-400">
            {pageState === "upload" && "PDF를 업로드하면 AI가 시험 문제를 만들어드립니다"}
            {pageState === "generate" && "PDF 분석이 완료되었습니다"}
            {pageState === "quiz" && "문제를 풀어보세요"}
            {pageState === "result" && "퀴즈 완료!"}
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl">
          {pageState === "upload" && (
            <PDFUploader onExtractComplete={handlePDFExtracted} />
          )}

          {pageState === "generate" && pdfResult && (
            <QuizGenerator
              pdfResult={pdfResult}
              onQuizGenerated={handleQuizGenerated}
              onBack={handleReset}
            />
          )}

          {pageState === "quiz" && quizSet && (
            <QuizDisplay
              quizSet={quizSet}
              onComplete={handleQuizComplete}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
