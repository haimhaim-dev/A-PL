"use client";

import * as React from "react";
import {
  FileUp,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Coins,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { validatePDFFile, formatFileSize } from "@/lib/pdf-utils";
import { getPDFPageCount } from "@/lib/pdf-to-image-client";
import { extractPDFWithOCR, estimateOCRCost, getErrorMessage } from "@/lib/api-client";
import { isAPIError } from "@/lib/error-handler";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { OCRResult } from "@/types/ocr";

interface PDFOCRUploaderProps {
  onOCRComplete?: (results: OCRResult[]) => void;
  onError?: (error: string) => void;
}

type UploadState = "idle" | "estimating" | "processing" | "success" | "error";

interface CostEstimate {
  totalPages: number;
  estimatedCost: number;
  requiredPoints: number;
  canProcess: boolean;
}

export function PDFOCRUploader({ onOCRComplete, onError }: PDFOCRUploaderProps) {
  const [state, setState] = React.useState<UploadState>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [results, setResults] = React.useState<OCRResult[] | null>(null);
  const [estimate, setEstimate] = React.useState<CostEstimate | null>(null);
  const [userPoints, setUserPoints] = React.useState<number>(500); // 초기값
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showError, showSuccess, showWarning, showInfo } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // 파일 유효성 검사
    const validation = validatePDFFile(selectedFile);
    if (!validation.valid) {
      setErrorMessage(validation.error || "유효하지 않은 파일입니다.");
      setState("error");
      onError?.(validation.error || "유효하지 않은 파일입니다.");
      return;
    }

    setFile(selectedFile);
    setState("estimating");
    setErrorMessage("");
    setResults(null);

    // 비용 예상 요청 (실제 PDF 페이지 수 사용)
    try {
      const pageCount = await getPDFPageCount(selectedFile);
      const data = await estimateOCRCost(pageCount);

      setEstimate(data.estimate);
      setUserPoints(data.currentPoints);
      setState("idle");

      showInfo(
        "비용 예상 완료",
        `${pageCount}페이지 처리에 ${data.estimate.requiredPoints}P가 필요합니다.`
      );
    } catch (error) {
      console.error("비용 예상 실패:", error);
      setState("idle");

      const errorMsg = getErrorMessage(error);
      showWarning("비용 예상 실패", errorMsg);
    }
  };

  const handleOCRProcess = async () => {
    if (!file || !estimate) return;

    if (!estimate.canProcess) {
      const insufficientMsg = `포인트가 부족합니다. 현재 ${userPoints}P, 필요 ${estimate.requiredPoints}P`;
      setErrorMessage(insufficientMsg);
      setState("error");
      showError("포인트 부족", insufficientMsg);
      return;
    }

    setState("processing");
    setErrorMessage("");

    try {
      const data = await extractPDFWithOCR(file, {
        quality: "high",
        enhanceFormulas: true
      });

      setResults(data.results);
      setUserPoints(data.summary.remainingPoints);
      setState("success");
      
      showSuccess(
        "OCR 처리 완료!",
        `${data.results.length}페이지를 성공적으로 처리했습니다. (${data.summary.pointsUsed}P 사용)`
      );
      
      onOCRComplete?.(data.results);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setErrorMessage(errorMsg);
      setState("error");

      // API Error인 경우 상세 메시지 표시
      if (isAPIError(error)) {
        showError(error.message, error.userMessage);
        
        // Rate Limit인 경우 특별 처리
        if (error.code === "RATE_LIMIT_EXCEEDED") {
          showWarning(
            "현재 사용자가 많습니다",
            error.retryAfter
              ? `약 ${error.retryAfter}초 후에 다시 시도해 주세요.`
              : "잠시 후 다시 시도해 주세요."
          );
        }
      } else {
        showError("OCR 처리 실패", errorMsg);
      }

      onError?.(errorMsg);
    }
  };

  const handleReset = () => {
    setFile(null);
    setState("idle");
    setErrorMessage("");
    setResults(null);
    setEstimate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* 포인트 표시 */}
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium text-slate-300">보유 포인트</span>
        </div>
        <span className="text-lg font-bold text-white">{userPoints}P</span>
      </Card>

      {/* 파일 업로드 */}
      <Card
        className={cn(
          "relative p-8 transition-all",
          state === "error" && "border-accent-red/50",
          state === "success" && "border-green-500/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-ocr-upload"
        />

        {!file ? (
          <label
            htmlFor="pdf-ocr-upload"
            className="flex cursor-pointer flex-col items-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
              <FileUp className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-100">
                이미지형 PDF 업로드
              </p>
              <p className="mt-1 text-sm text-slate-400">
                수식/특수문자 포함 강의자료
              </p>
              <p className="mt-3 flex items-center justify-center gap-1 text-xs text-yellow-500">
                <Coins className="h-3 w-3" />
                페이지당 10P 차감
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {state === "processing" && (
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              )}
              {state === "success" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {state === "error" && (
                <XCircle className="h-5 w-5 text-accent-red" />
              )}
            </div>

            {/* 비용 예상 */}
            {estimate && state === "idle" && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-yellow-400">
                      OCR 처리 비용
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">처리 페이지</p>
                        <p className="font-semibold text-slate-100">
                          {estimate.totalPages}페이지
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">필요 포인트</p>
                        <p className="font-semibold text-yellow-500">
                          {estimate.requiredPoints}P
                        </p>
                      </div>
                    </div>
                    {!estimate.canProcess && (
                      <p className="text-xs text-accent-red">
                        포인트가 부족합니다. 포인트를 충전해주세요.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {state === "idle" && estimate && (
              <div className="flex gap-2">
                <Button
                  onClick={handleOCRProcess}
                  className="flex-1"
                  disabled={!estimate.canProcess}
                >
                  <FileText className="h-4 w-4" />
                  OCR 처리 시작
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  취소
                </Button>
              </div>
            )}

            {state === "processing" && (
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-full animate-pulse bg-purple-500" />
                </div>
                <p className="text-center text-xs text-slate-400">
                  Gemini Vision으로 텍스트 추출 중...
                </p>
              </div>
            )}

            {state === "success" && results && (
              <div className="space-y-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-sm font-semibold text-green-400">
                    OCR 완료!
                  </p>
                </div>
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-slate-900/50 p-3 text-xs"
                    >
                      <p className="font-semibold text-slate-300">
                        페이지 {result.pageNumber}
                      </p>
                      <p className="mt-1 text-slate-400">
                        {result.containsLatex ? "✓ LaTeX 수식 포함" : "일반 텍스트"}
                      </p>
                      <p className="mt-2 line-clamp-3 text-slate-300">
                        {result.text.slice(0, 150)}...
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  다른 파일 처리
                </Button>
              </div>
            )}

            {state === "error" && (
              <div className="space-y-3 rounded-xl border border-accent-red/20 bg-accent-red/5 p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 shrink-0 text-accent-red" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-400">오류 발생</p>
                    <p className="mt-1 text-xs text-slate-300">{errorMessage}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  다시 시도
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
