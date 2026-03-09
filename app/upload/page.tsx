"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PDFUploader } from "@/components/upload/pdf-uploader";
import { LoginRequired } from "@/components/upload/login-required";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { PDFExtractResult } from "@/types/pdf";

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [extractedData, setExtractedData] = React.useState<PDFExtractResult | null>(
    null
  );

  const handleExtractComplete = (result: PDFExtractResult) => {
    setExtractedData(result);
    console.log("PDF 추출 완료:", result);
    // TODO: 다음 단계로 이동 (문제 생성 설정 페이지)
  };

  const handleError = (error: string) => {
    console.error("PDF 추출 에러:", error);
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
        <h1 className="text-2xl font-bold text-white">PDF 업로드</h1>
        <p className="mt-2 text-sm text-slate-400">
          강의 자료 PDF를 업로드하면 AI가 자동으로 텍스트를 추출합니다.
        </p>
      </header>

      {/* 업로더 또는 로그인 필요 */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-deep border-t-transparent" />
            <p className="mt-4 text-sm text-slate-400">로딩 중...</p>
          </div>
        </div>
      ) : user ? (
        <PDFUploader
          onExtractComplete={handleExtractComplete}
          onError={handleError}
        />
      ) : (
        <LoginRequired />
      )}

      {/* 추출된 텍스트 미리보기 (개발용) */}
      {extractedData && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">추출된 텍스트 미리보기</h2>
          <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <pre className="whitespace-pre-wrap text-xs text-slate-300">
              {extractedData.text.slice(0, 2000)}
              {extractedData.text.length > 2000 && "\n\n... (생략)"}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">청크 정보</h3>
            <div className="space-y-2">
              {extractedData.chunks.slice(0, 3).map((chunk, idx) => (
                <details
                  key={idx}
                  className="rounded-lg border border-white/10 bg-slate-900/30 p-3"
                >
                  <summary className="cursor-pointer text-xs font-medium text-slate-300">
                    청크 {idx + 1} ({chunk.length.toLocaleString()} 문자)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">
                    {chunk.slice(0, 500)}
                    {chunk.length > 500 && "..."}
                  </pre>
                </details>
              ))}
              {extractedData.chunks.length > 3 && (
                <p className="text-center text-xs text-slate-500">
                  ... 외 {extractedData.chunks.length - 3}개 청크
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
