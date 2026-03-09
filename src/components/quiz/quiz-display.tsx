"use client";

import * as React from "react";
import { CheckCircle2, XCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuizSet, UserAnswer } from "@/types/quiz";

interface QuizDisplayProps {
  quizSet: QuizSet;
  onComplete: (score: number) => void;
  onReset: () => void;
}

export function QuizDisplay({ quizSet, onComplete, onReset }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [showResult, setShowResult] = React.useState(false);
  const [isAnswered, setIsAnswered] = React.useState(false);

  const currentQuestion = quizSet.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizSet.questions.length - 1;

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const userAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      answeredAt: new Date()
    };

    setAnswers([...answers, userAnswer]);
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // 퀴즈 완료
      const correctCount = [...answers, {
        questionId: currentQuestion.id,
        selectedAnswer: selectedAnswer!,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
        answeredAt: new Date()
      }].filter(a => a.isCorrect).length;
      
      const score = Math.round((correctCount / quizSet.totalQuestions) * 100);
      setShowResult(true);
      onComplete(score);
    } else {
      // 다음 문제로
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  // 최종 결과 화면
  if (showResult) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const incorrectCount = answers.length - correctCount;
    const score = Math.round((correctCount / quizSet.totalQuestions) * 100);

    return (
      <Card className="p-8">
        <div className="space-y-6 text-center">
          {/* 점수 */}
          <div className="space-y-3">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary-deep bg-gradient-to-br from-primary-deep/20 to-blue-500/20">
              <span className="text-4xl font-bold text-white">{score}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {score >= 80 ? "🎉 훌륭해요!" : score >= 60 ? "👍 잘했어요!" : "💪 다시 도전!"}
            </h2>
            <p className="text-slate-400">
              {quizSet.totalQuestions}문제 중 {correctCount}문제 정답
            </p>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">{correctCount}</span>
              </div>
              <p className="mt-1 text-xs text-green-500/80">정답</p>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{incorrectCount}</span>
              </div>
              <p className="mt-1 text-xs text-red-500/80">오답</p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onReset} className="flex-1 gap-2">
              <Home className="h-4 w-4" />
              처음으로
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1 gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 풀기
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // 문제 풀이 화면
  return (
    <div className="space-y-4">
      {/* 진행 상황 */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            문제 {currentQuestionIndex + 1} / {quizSet.totalQuestions}
          </span>
          <div className="flex gap-1">
            {quizSet.questions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 w-2 rounded-full",
                  idx < currentQuestionIndex
                    ? "bg-green-500"
                    : idx === currentQuestionIndex
                    ? "bg-primary-deep"
                    : "bg-slate-700"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 문제 카드 */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* 문제 */}
          <div>
            <p className="text-lg font-semibold leading-relaxed text-white">
              {currentQuestion.question}
            </p>
          </div>

          {/* 선택지 */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              const showCorrectAnswer = isAnswered && isCorrect;
              const showWrongAnswer = isAnswered && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full rounded-xl border-2 p-4 text-left transition-all",
                    isSelected && !isAnswered && "border-primary-deep bg-primary-deep/10",
                    !isSelected && !isAnswered && "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                    showCorrectAnswer && "border-green-500 bg-green-500/10",
                    showWrongAnswer && "border-red-500 bg-red-500/10",
                    isAnswered && !showCorrectAnswer && !showWrongAnswer && "border-white/10 bg-white/5 opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold",
                        isSelected && !isAnswered && "bg-primary-deep text-white",
                        !isSelected && !isAnswered && "bg-slate-700 text-slate-400",
                        showCorrectAnswer && "bg-green-500 text-white",
                        showWrongAnswer && "bg-red-500 text-white",
                        isAnswered && !showCorrectAnswer && !showWrongAnswer && "bg-slate-700 text-slate-500"
                      )}
                    >
                      {showCorrectAnswer ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : showWrongAnswer ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        showCorrectAnswer && "font-semibold text-green-400",
                        showWrongAnswer && "text-red-400",
                        !showCorrectAnswer && !showWrongAnswer && "text-slate-300"
                      )}
                    >
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 해설 (정답 제출 후) */}
          {isAnswered && currentQuestion.explanation && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-xs font-semibold text-blue-400 mb-1">해설</p>
              <p className="text-sm text-slate-300">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* 버튼 */}
          <div>
            {!isAnswered ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="w-full"
                size="lg"
              >
                정답 확인
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="w-full" size="lg">
                {isLastQuestion ? "결과 보기" : "다음 문제"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
