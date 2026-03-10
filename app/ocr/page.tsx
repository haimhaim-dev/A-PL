"use client";

import * as React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

// 동적 렌더링 강제 (Supabase 클라이언트 사용으로 인한 prerender 에러 방지)
export const dynamic = 'force-dynamic';
import { PDFOCRUploader } from "@/components/upload/pdf-ocr-uploader";
import { LoginRequired } from "@/components/upload/login-required";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { OCRResult } from "@/types/ocr";

export default function OCRPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [ocrResults, setOCRResults] = React.useState<OCRResult[] | null>(null);

  const handleOCRComplete = (results: OCRResult[]) => {
    setOCRResults(results);
    console.log("OCR 완료:", results);
    // TODO: 다음 단계 (문제 생성)로 이동
  };

  const handleError = (error: string) => {
    console.error("OCR 에러:", error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5 py-6">
      {/* 헤더 */}
      <header className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">AI OCR (수식 인식)</h1>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          이미지 기반 PDF에서 텍스트와 수식을 LaTeX 형태로 추출합니다.
        </p>
        <p className="mt-1 text-xs text-yellow-500">
          ⚡ Gemini 1.5 Flash Vision 사용 • 페이지당 10P
        </p>
      </header>

      {/* OCR 업로더 또는 로그인 필요 */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-400">로딩 중...</p>
          </div>
        </div>
      ) : user ? (
        <PDFOCRUploader
          onOCRComplete={handleOCRComplete}
          onError={handleError}
        />
      ) : (
        <LoginRequired />
      )}

      {/* OCR 결과 상세 보기 */}
      {ocrResults && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">추출된 텍스트</h2>
          {ocrResults.map((result, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-xl border border-white/10 bg-slate-900/50 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">
                  페이지 {result.pageNumber}
                </h3>
                <div className="flex gap-2 text-xs text-slate-400">
                  {result.containsLatex && (
                    <span className="rounded bg-purple-500/10 px-2 py-0.5 text-purple-400">
                      LaTeX
                    </span>
                  )}
                  {result.metadata.hasTables && (
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-400">
                      표
                    </span>
                  )}
                  {result.metadata.hasCharts && (
                    <span className="rounded bg-green-500/10 px-2 py-0.5 text-green-400">
                      차트
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/50 p-4">
                <pre className="whitespace-pre-wrap text-xs text-slate-300">
                  {result.text}
                </pre>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <p className="text-slate-400">처리 시간</p>
                  <p className="mt-0.5 font-semibold text-slate-100">
                    {(result.processingTime / 1000).toFixed(2)}초
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <p className="text-slate-400">토큰 사용</p>
                  <p className="mt-0.5 font-semibold text-slate-100">
                    {result.tokenUsed.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                  <p className="text-slate-400">신뢰도</p>
                  <p className="mt-0.5 font-semibold text-slate-100">
                    {(result.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
