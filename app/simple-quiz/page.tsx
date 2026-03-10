"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuizGeneration } from "@/hooks/useQuizGeneration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Settings, Info, RotateCcw, Sparkles, Upload, CheckCircle } from "lucide-react";
import { FileUploader } from "@/components/quiz-generator/FileUploader";
import { AnalysisReport } from "@/components/quiz-generator/AnalysisReport";
import { GenerationSettings } from "@/components/quiz-generator/GenerationSettings";
import { QuizHistory } from "@/components/quiz-generator/QuizHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoginButton } from "@/components/auth/LoginButton";

export default function SimpleQuizPage() {
  const router = useRouter();
  const { user, credits, isLoading: isAuthLoading, supabase, refreshCredits, userQuizzes, isUserQuizzesLoaded } = useAuth();
  const {
    state,
    file,
    isAnalyzing,
    isGenerating,
    aiAnalysisResult,
    settings,
    analyzeFile: analyzeFileHook,
    generateQuiz: generateQuizHook,
    resetState: resetStateFromHook,
    updateSettings: updateSettingsHook,
    handleExportToText,
  } = useQuizGeneration();

  const handleFileChange = React.useCallback(async (selectedFile: File) => {
    if (user && supabase) {
      await analyzeFileHook(selectedFile, supabase, user.id);
    } else {
      alert("로그인 후 이용해주세요.");
      router.push("/auth/signin");
    }
  }, [analyzeFileHook, user, supabase, router]);

  const handleGenerateQuiz = React.useCallback(async (quizTitle: string) => {
    if (user && supabase) {
      await generateQuizHook(quizTitle, supabase, user.id);
      refreshCredits();
    }
  }, [generateQuizHook, user, supabase, refreshCredits]);

  const handleExport = React.useCallback(async (quizId: string) => {
    if (user && supabase) {
      await handleExportToText(quizId, supabase, user.id);
    }
  }, [user, supabase, handleExportToText]);

  const updateSettings = React.useCallback((newSettings: Partial<typeof settings>) => {
    updateSettingsHook(newSettings);
  }, [updateSettingsHook]);

  const renderContent = () => {
    if (!user) {
      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">퀴즈 생성 기능</CardTitle>
            <CardDescription className="mt-2">
              AI 퀴즈 생성 기능을 이용하려면 로그인이 필요합니다.
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
      );
    }

    switch (state) {
      case "upload":
        return <FileUploader onFileChange={handleFileChange} isAnalyzing={isAnalyzing} credits={credits} />;
      case "analyzing":
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">문서 분석 중...</p>
            <Progress value={50} className="w-full max-w-md" />
            <p className="text-sm text-muted-foreground">AI가 문서의 핵심을 파악하고 있습니다.</p>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <AnalysisReport aiAnalysisResult={aiAnalysisResult} state={state} />
          </div>
        );
      case "generating":
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">시험 문제 생성 중...</p>
            <Progress value={75} className="w-full max-w-md" />
            <p className="text-sm text-muted-foreground">AI가 맞춤형 문제를 만들고 있습니다.</p>
          </div>
        );
      default:
        return <FileUploader onFileChange={handleFileChange} isAnalyzing={isAnalyzing} credits={credits} />;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-6xl mobile-page py-6 sm:py-8">
          <div className="space-y-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
            
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <Card className="w-full">
                <CardHeader className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                          나만의 시험 문제 만들기
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-slate-300 text-sm leading-relaxed">
                      PDF를 업로드하면 AI가 자동으로 분석하여 맞춤형 문제를 생성해 드립니다.
                    </CardDescription>
                    
                    {state === "settings" && (
                      <Button
                        onClick={() => {
                          resetStateFromHook();
                        }}
                        variant="outline"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border-white/20 hover:bg-white/10 text-white hover:text-white transition-all duration-200 touch-target h-12"
                      >
                        <RotateCcw className="h-4 w-4" />
                        처음부터 다시
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {renderContent()}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {state === "upload" ? (
                <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white shadow-lg border-none rounded-2xl">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">업로드한 파일에 꼭 맞는 최적의 문제를 준비했어요.</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <p className="text-sm text-gray-200 mb-4 leading-relaxed">AI가 문서의 핵심 맥락과 수식 비중을 분석하여, 이용자에게 적합한 최적의 문제 세트를 구성합니다.</p>
                    
                    <div className="flex items-start gap-2 text-gray-300 mb-6">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-xs leading-relaxed">업로드된 문서의 난이도와 핵심 키워드를 추출하여, 가장 효율적인 학습 순서로 문제를 재구성합니다.</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-purple-300" />
                        <span className="text-xs sm:text-sm">1. PDF 업로드</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-300" />
                        <span className="text-xs sm:text-sm">2. AI 분석</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-300" />
                        <span className="text-xs sm:text-sm">3. 맞춤 퀴즈 생성</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {state === "settings" && (
                    <Card className="w-full rounded-2xl">
                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-lg sm:text-xl">문제 생성 설정</CardTitle>
                        <CardDescription className="text-sm">AI 자동 생성 또는 직접 설정을 선택하여 맞춤형 문제를 생성하세요.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <GenerationSettings
                          settings={settings}
                          updateSettings={updateSettings}
                          onGenerateQuiz={handleGenerateQuiz}
                          currentCredits={credits}
                          isGenerating={isGenerating}
                        />
                      </CardContent>
                    </Card>
                  )}

                  <Card className="w-full rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">최근 생성한 문제</CardTitle>
                      <CardDescription className="text-sm">최근에 생성한 퀴즈 목록입니다. 다시 풀거나 내보낼 수 있습니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {user && isUserQuizzesLoaded ? (
                        <QuizHistory
                          quizHistory={userQuizzes}
                          displayMode="compact"
                          onQuizSelect={(quizId: string) => {
                            router.push(`/quiz/${quizId}`);
                          }}
                          onExportClick={handleExport}
                          supabaseClient={supabase}
                          userId={user.id}
                        />
                      ) : (
                        <div className="space-y-3">
                          <Skeleton className="h-14 w-full rounded-xl" />
                          <Skeleton className="h-14 w-full rounded-xl" />
                          <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}