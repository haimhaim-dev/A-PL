"use client";

/**
 * PDF 파일 업로더 컴포넌트
 * 파일 업로드 UI 및 유효성 검사 로직
 */

import * as React from "react";
import { FileUp, Loader2, BookOpen, ChevronRight, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FileUploaderProps {
  onFileChange: (file: File) => void;
  isAnalyzing: boolean;
  credits?: number; // 크레딧 정보 추가
}

export function FileUploader({
  onFileChange,
  isAnalyzing,
  credits = 0,
}: FileUploaderProps) {
  const router = useRouter();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="lg:col-span-5 space-y-6">
      <Card className="relative overflow-hidden border-none bg-white/5 backdrop-blur-xl shadow-2xl group">
        {isAnalyzing ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary-deep/20 blur-xl animate-pulse" />
              <Loader2 className="h-12 w-12 text-primary-deep animate-spin relative" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">문서 분석 중...</h2>
              <p className="text-sm text-slate-400">AI가 파일의 내용을 파악하고 있습니다</p>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black tracking-tight">PDF 업로드</h1>
              <p className="text-sm text-slate-400">시험 문제를 만들 파일을 선택해주세요</p>
              
              {/* 포인트 정보 표시 */}
              <div className="flex items-center justify-center gap-2 mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Coins className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-300">
                  현재 보유 포인트: <span className="font-bold">{credits}P</span>
                </span>
                <Button
                  onClick={() => router.push("/payments")}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 p-1 h-auto"
                >
                  [충전하기]
                </Button>
              </div>
            </div>

            <div className="relative">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileInputChange}
                className="hidden" 
                id="quiz-file-upload"
              />
              <label 
                htmlFor="quiz-file-upload"
                className="flex flex-col items-center justify-center aspect-video rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 cursor-pointer transition-all hover:border-primary-deep/50 hover:bg-white/[0.08]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-deep/10 text-primary-deep mb-4">
                  <FileUp className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-slate-300">클릭하여 파일 업로드</p>
                <p className="mt-1 text-xs text-slate-500">PDF (최대 15MB)</p>
              </label>
            </div>

            {/* 모바일용 가이드 */}
            <div className="lg:hidden rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">PDF 업로드</div>
              <ChevronRight className="h-3 w-3" />
              <div className="flex items-center gap-2">AI 분석</div>
              <ChevronRight className="h-3 w-3" />
              <div className="flex items-center gap-2">퀴즈 생성</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
