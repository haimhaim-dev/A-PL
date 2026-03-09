"use client";

import * as React from "react";
import { FileUp, Loader2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { validatePDFFile, formatFileSize } from "@/lib/pdf-utils";
import { extractPDFText, getErrorMessage } from "@/lib/api-client";
import { isAPIError } from "@/lib/error-handler";
import { useToast } from "@/hooks/use-toast";
import type { PDFExtractResult } from "@/types/pdf";

interface PDFUploaderProps {
  onExtractComplete?: (result: PDFExtractResult) => void;
  onError?: (error: string) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function PDFUploader({ onExtractComplete, onError }: PDFUploaderProps) {
  const [state, setState] = React.useState<UploadState>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [result, setResult] = React.useState<PDFExtractResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showError, showSuccess, showWarning } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setState("idle");
    setErrorMessage("");
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setState("uploading");
    setErrorMessage("");

    try {
      const extractResult = await extractPDFText(file, {
        maxChunkSize: 4000,
        overlapSize: 200,
        preserveParagraphs: true
      });

      setResult(extractResult);
      setState("success");
      showSuccess("텍스트 추출 완료!", `${extractResult.metadata.pageCount}페이지에서 텍스트를 성공적으로 추출했습니다.`);
      onExtractComplete?.(extractResult);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setErrorMessage(errorMsg);
      setState("error");

      // API Error인 경우 상세 메시지 표시
      if (isAPIError(error)) {
        showError(error.message, error.userMessage);
        
        // 재시도 가능한 에러면 안내
        if (error.retryable && error.retryAfter) {
          showWarning(
            "잠시 후 다시 시도해 주세요",
            `약 ${error.retryAfter}초 후에 다시 시도할 수 있습니다.`
          );
        }
      } else {
        showError("텍스트 추출 실패", errorMsg);
      }

      onError?.(errorMsg);
    }
  };

  const handleReset = () => {
    setFile(null);
    setState("idle");
    setErrorMessage("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const validation = validatePDFFile(droppedFile);
      if (!validation.valid) {
        setErrorMessage(validation.error || "유효하지 않은 파일입니다.");
        setState("error");
        return;
      }
      setFile(droppedFile);
      setState("idle");
      setErrorMessage("");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* 파일 선택 영역 */}
      <Card
        className={cn(
          "relative p-8 transition-all",
          state === "error" && "border-accent-red/50",
          state === "success" && "border-green-500/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />

        {!file ? (
          <label
            htmlFor="pdf-upload"
            className="flex cursor-pointer flex-col items-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-deep/10">
              <FileUp className="h-8 w-8 text-primary-deep" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-100">
                PDF 파일을 업로드하세요
              </p>
              <p className="mt-1 text-sm text-slate-400">
                드래그 앤 드롭 또는 클릭하여 선택
              </p>
              <p className="mt-2 text-xs text-slate-500">
                최대 10MB, PDF 형식만 지원
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-deep/10">
                <FileText className="h-6 w-6 text-primary-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {state === "uploading" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary-deep" />
              )}
              {state === "success" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {state === "error" && (
                <XCircle className="h-5 w-5 text-accent-red" />
              )}
            </div>

            {state === "idle" && (
              <div className="flex gap-2">
                <Button onClick={handleUpload} className="flex-1">
                  <FileUp className="h-4 w-4" />
                  텍스트 추출하기
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  취소
                </Button>
              </div>
            )}

            {state === "uploading" && (
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-full animate-pulse bg-primary-deep" />
                </div>
                <p className="text-center text-xs text-slate-400">
                  PDF 텍스트 추출 중...
                </p>
              </div>
            )}

            {state === "success" && result && (
              <div className="space-y-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-sm font-semibold text-green-400">
                    텍스트 추출 완료!
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                    <p className="text-slate-400">페이지 수</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {result.metadata.pageCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                    <p className="text-slate-400">문자 수</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {result.metadata.totalCharacters.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                    <p className="text-slate-400">청크 수</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {result.metadata.chunkCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 px-3 py-2">
                    <p className="text-slate-400">추출 시간</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {new Date(result.metadata.extractedAt).toLocaleTimeString(
                        "ko-KR"
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  다른 파일 업로드
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
