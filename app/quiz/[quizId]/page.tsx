"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/MathRenderer";
import type { QuizRow } from "@/types/quiz-db";

type PageState = "loading" | "quiz" | "result" | "error";

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { user, credits, isLoading: authLoading, supabase } = useAuth(); // useAuth 훅에서 supabase 클라이언트 가져오기
  const { showError, showInfo } = useToast();

  const [state, setState] = React.useState<PageState>("loading");
  const [quiz, setQuiz] = React.useState<QuizRow | null>(null);
  const [attemptId, setAttemptId] = React.useState<string | null>(null); // 🆔 진행 상황 추적 ID
  const [currentQ, setCurrentQ] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<boolean[]>([]);
  const [userAnswers, setUserAnswers] = React.useState<Record<string, number>>({}); // 📝 답안을 객체 형태로 저장 { "문제인덱스": 선택한답 }
  const [showAnswer, setShowAnswer] = React.useState(false);

  // 1. 퀴즈 및 기존 진행 상황 가져오기
  React.useEffect(() => {
    async function initQuiz() {
      if (!quizId || typeof quizId !== "string" || !supabase) {
        if (!supabase) {
          console.log("⏳ Supabase 클라이언트 로딩 중...");
          return; // Supabase 클라이언트가 아직 로드되지 않았으면 기다림
        }
        console.error("❌ 유효하지 않은 quizId:", quizId);
        setState("error");
        return;
      }

      try {
        setState("loading");
        
        // 1-1. 퀴즈 데이터 가져오기
        const { data: quizData, error: quizError } = await supabase
          .from("Quiz")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError) throw quizError;
        if (!quizData) throw new Error("퀴즈를 찾을 수 없습니다.");

        setQuiz(quizData);

        // 1-2. 기존 진행 상황(QuizAttempt) 확인
        if (user) {
          const { data: attemptData, error: attemptError } = await supabase
            .from("QuizAttempt")
            .select("*")
            .eq("quizId", quizId)
            .eq("userId", user.id)
            .eq("status", "in_progress")
            .order('updatedAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (attemptData) {
            console.log("✅ 기존 진행 상황 발견:", attemptData);
            setAttemptId(attemptData.id);
            
            // 객체 형태의 답안 복구
            const savedAnswers = (attemptData.userAnswers as Record<string, number>) || {};
            setUserAnswers(savedAnswers);
            
            // 마지막으로 푼 문제 다음 위치 계산
            const keys = Object.keys(savedAnswers).map(Number);
            const lastIdx = keys.length > 0 ? Math.max(...keys) : -1;
            const nextQ = Math.min(lastIdx + 1, quizData.content.questions.length - 1);
            
            setCurrentQ(nextQ);
            
            // 정오답 상태 배열 복구 (결과 화면용)
            const initialAnswersState = [];
            for (let i = 0; i <= lastIdx; i++) {
              if (savedAnswers[i] !== undefined) {
                initialAnswersState.push((savedAnswers[i] + 1) === quizData.content.questions[i].correctAnswerIndex);
              }
            }
            setAnswers(initialAnswersState);
            
            showInfo("이전 진행 상황을 불러왔습니다.", "이어서 풀이를 진행합니다.");
          }
        }

        setState("quiz");
      } catch (err: any) {
        console.error("❌ 초기화 실패:", err);
        showError("로드 실패", err.message || "오류가 발생했습니다.");
        setState("error");
      }
    }

    if (!authLoading && quizId && supabase) { // supabase 의존성 추가
      initQuiz();
    }
  }, [quizId, user, authLoading, supabase]); // supabase 의존성 추가

  // 📝 진행 상황 저장 함수
  const saveProgress = async (newAnswers: Record<string, number>, isCompleted = false) => {
    if (!quizId || !user || !supabase) return; // supabase 의존성 추가

    try {
      const questions = quiz?.content?.questions || [];
      const score = Object.entries(newAnswers).filter(([idx, ans]) => 
        (ans + 1) === questions[Number(idx)]?.correctAnswerIndex
      ).length;

      const response = await fetch("/api/quiz/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          quizAttemptId: attemptId,
          userAnswers: newAnswers,
          score,
          status: isCompleted ? "completed" : "in_progress"
        })
      });

      const data = await response.json();
      if (data.success && data.attemptId) {
        setAttemptId(data.attemptId);
      }
    } catch (err) {
      console.error("⚠️ 진행 상황 저장 실패:", err);
    }
  };

  const questions = quiz?.content?.questions || [];
  const currentQuestion = questions[currentQ];

  // 답 제출
  const handleSubmit = async () => {
    if (selectedAnswer === null || !quiz || !currentQuestion) return;
    
    const isCorrect = (selectedAnswer + 1) === currentQuestion.correctAnswerIndex;
    const newAnswersState = [...answers, isCorrect];
    setAnswers(newAnswersState);
    
    const newUserAnswers = { ...userAnswers, [currentQ]: selectedAnswer };
    setUserAnswers(newUserAnswers);
    
    setShowAnswer(true);

    // 진행 상황 실시간 저장
    await saveProgress(newUserAnswers);
  };

  // 다음 문제
  const handleNext = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      // 퀴즈 완료 저장
      await saveProgress(userAnswers, true);
      setState("result");
    }
  };

  // 나가기 버튼 (홈으로 가기)
  const handleExit = () => {
    if (state === "quiz" && answers.length < questions.length) {
      if (confirm("진행 상황이 사라질 수 있습니다. 정말 나가시겠습니까?")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  // 점수 계산
  const score = answers.filter(a => a).length;
  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // 🛡️ 가드 코드: 데이터가 로드될 때까지 로딩 화면 표시
  if (state === "loading" || !quiz) {
    if (state === "error") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-5 text-center">
          <XCircle className="h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-white">퀴즈를 불러올 수 없습니다</h1>
          <p className="mt-2 text-sm text-slate-400">네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</p>
          <Button onClick={() => router.push("/")} className="mt-6 gap-2">
            <Home className="h-4 w-4" />
            홈으로 가기
          </Button>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-deep" />
          <p className="mt-4 text-sm text-slate-400">퀴즈 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={handleExit} className="gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            나가기
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Title</p>
              {!quiz ? (
                <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
              ) : (
                <p className="text-xs font-medium text-slate-300 truncate max-w-[150px]">
                  {quiz?.title || "제목 없음"}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5">
              <span className="text-sm font-bold text-yellow-400">{credits}P</span>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main>
          {/* 1. 퀴즈 풀이 */}
          {state === "quiz" && quiz && questions.length > 0 && currentQuestion && (
            <div className="space-y-4">
              {/* 진행률 */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-slate-400">
                  문제 {currentQ + 1} / {questions.length}
                </span>
                <div className="flex gap-1">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        idx < currentQ ? "bg-green-500" : idx === currentQ ? "bg-primary-deep" : "bg-slate-700"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* 문제 */}
              <Card className="p-6">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold leading-relaxed text-white">
                    <MathText>{currentQuestion.question || currentQuestion.questionText || ""}</MathText>
                  </h2>

                  {/* 선택지 */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = (idx + 1) === currentQuestion.correctAnswerIndex;
                      const showCorrect = showAnswer && isCorrect;
                      const showWrong = showAnswer && isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => !showAnswer && setSelectedAnswer(idx)}
                          disabled={showAnswer}
                          className={cn(
                            "w-full rounded-lg border-2 p-4 text-left transition-all",
                            isSelected && !showAnswer && "border-primary-deep bg-primary-deep/10",
                            !isSelected && !showAnswer && "border-white/10 bg-white/5 hover:border-white/20",
                            showCorrect && "border-green-500 bg-green-500/10",
                            showWrong && "border-red-500 bg-red-500/10",
                            showAnswer && !showCorrect && !showWrong && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                isSelected && !showAnswer && "bg-primary-deep text-white",
                                !isSelected && !showAnswer && "bg-slate-700 text-slate-400",
                                showCorrect && "bg-green-500 text-white",
                                showWrong && "bg-red-500 text-white",
                                showAnswer && !showCorrect && !showWrong && "bg-slate-700 text-slate-500"
                              )}
                            >
                              {showCorrect ? "✓" : showWrong ? "✗" : String.fromCharCode(65 + idx)}
                            </div>
                            <span className="text-sm text-slate-300">
                              <MathText>{option}</MathText>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 해설 */}
                  {showAnswer && currentQuestion.explanation && (
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                      <p className="text-xs font-semibold text-blue-400">💡 해설</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        <MathText>{currentQuestion.explanation}</MathText>
                      </p>
                    </div>
                  )}

                  {/* 버튼 */}
                  <Button
                    onClick={showAnswer ? handleNext : handleSubmit}
                    disabled={!showAnswer && selectedAnswer === null}
                    className="w-full"
                    size="lg"
                  >
                    {showAnswer 
                      ? (currentQ < questions.length - 1 ? "다음 문제" : "결과 보기") 
                      : "정답 확인"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 2. 결과 화면 */}
          {state === "result" && quiz && questions.length > 0 && (
            <Card className="p-8">
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary-deep bg-gradient-to-br from-primary-deep/20 to-blue-500/20">
                  <span className="text-4xl font-bold text-white">{percentage}</span>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {percentage >= 80 ? "🎉 훌륭해요!" : percentage >= 60 ? "👍 잘했어요!" : "💪 조금만 더!"}
                  </h2>
                  <p className="mt-2 text-slate-400">
                    {total}문제 중 {score}문제 정답
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />
                    <p className="mt-2 text-2xl font-bold text-green-400">{score}</p>
                    <p className="text-xs text-green-500/80">정답</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <XCircle className="mx-auto h-8 w-8 text-red-400" />
                    <p className="mt-2 text-2xl font-bold text-red-400">{total - score}</p>
                    <p className="text-xs text-red-500/80">오답</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => {
                    setCurrentQ(0);
                    setSelectedAnswer(null);
                    setAttemptId(null);
                    setAnswers([]);
                    setUserAnswers({});
                    setShowAnswer(false);
                    setState("quiz");
                  }} size="lg" className="flex-1">
                    다시 풀기
                  </Button>
                  <Button onClick={() => router.push("/")} variant="outline" size="lg" className="flex-1">
                    홈으로
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 3. 예외 처리: 데이터 없음 */}
          {quiz && questions.length === 0 && state !== "error" && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-bold text-white">데이터를 표시할 수 없습니다</h2>
              <p className="mt-2 text-sm text-slate-400">
                퀴즈 데이터가 비어있거나 올바르지 않은 형식입니다.
              </p>
              <Button onClick={() => router.push("/")} className="mt-6 gap-2">
                <Home className="h-4 w-4" />
                홈으로 가기
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}