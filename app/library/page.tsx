"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuizGeneration } from "@/hooks/useQuizGeneration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Loader2, Home, BookOpen, Search, Filter, History } from "lucide-react";
import { QuizHistory } from "@/components/quiz-generator/QuizHistory";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoginButton } from "@/components/auth/LoginButton";

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, supabase, allUserQuizzes, isAllUserQuizzesLoaded } = useAuth();
  const { handleExportToText } = useQuizGeneration();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredAllQuizzes = React.useMemo(() => {
    if (!searchTerm) return allUserQuizzes;
    return allUserQuizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUserQuizzes, searchTerm]);

  const handleExport = React.useCallback(async (quizId: string) => {
    if (user && supabase) {
      await handleExportToText(quizId, supabase, user.id);
    }
  }, [user, supabase, handleExportToText]);

  const currentIsLoading = !isAllUserQuizzesLoaded;
  const totalQuizCount = filteredAllQuizzes.length;

  // 로그인되지 않은 경우
  if (!user && !isAuthLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Card className="w-full max-w-md mx-4 sm:mx-auto">
            <CardHeader className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">라이브러리 접근</CardTitle>
              <CardDescription className="mt-2">
                생성한 퀴즈를 확인하려면 로그인이 필요합니다.
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
        </div>
      </MainLayout>
    );
  }

  // 로딩 상태
  if (isAuthLoading || currentIsLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-6xl mobile-page py-6 sm:py-8">
        {/* 헤더 섹션 - 로딩 상태 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                라이브러리
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg text-slate-300">
                  총 <Skeleton className="inline-block h-5 w-8" />개의 문제집이 소장 중입니다
                </span>
              </div>
            </div>
          </div>
          
          {/* 버튼 그룹 - 로딩 상태 */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
        </div>
      </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl mobile-page py-6 sm:py-8">
      {/* 헤더 섹션 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              라이브러리
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm sm:text-lg text-slate-300 truncate">
                총 <span className="font-bold text-emerald-400">{totalQuizCount}</span>개의 문제집이 소장 중입니다
              </span>
            </div>
          </div>
        </div>
        
        {/* 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            onClick={() => router.push("/library/export-history")}
            variant="outline"
            className="flex items-center gap-2 bg-white/5 border-white/20 hover:bg-white/10 text-white hover:text-white transition-all duration-200"
          >
            <History className="h-4 w-4" />
            내보내기 기록
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="flex items-center gap-2 bg-white/5 border-white/20 hover:bg-white/10 text-white hover:text-white transition-all duration-200"
          >
            <Home className="h-4 w-4" />
            홈으로
          </Button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="문제집 제목으로 검색..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {filteredAllQuizzes.length === 0 ? (
        <Card className="w-full text-center py-12 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="mb-2 text-xl">
              {searchTerm ? "검색 결과가 없습니다" : "아직 생성된 퀴즈가 없습니다"}
            </CardTitle>
            <CardDescription className="mb-6 text-slate-300">
              {searchTerm ? "다른 키워드로 검색해보세요" : "첫 번째 PDF를 업로드하여 학습을 시작해 보세요!"}
            </CardDescription>
            {!searchTerm && (
              <Button 
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-200"
              >
                퀴즈 만들러 가기
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <QuizHistory
          quizHistory={filteredAllQuizzes}
          displayMode="full"
          onQuizSelect={(quizId: string) => {
            router.push(`/quiz/${quizId}`);
          }}
          onExportClick={handleExport}
          supabaseClient={supabase}
          userId={user.id}
        />
      )}
    </div>
    </MainLayout>
  );
}