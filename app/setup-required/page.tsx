"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function SetupRequiredPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const envTemplate = `# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# 기타 API 키
GEMINI_API_KEY="your-gemini-api-key"`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-white/10 backdrop-blur-sm border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            환경변수 설정이 필요합니다
          </h1>
          <p className="text-slate-300">
            Supabase 환경변수가 설정되지 않아 로그인 기능을 사용할 수 없습니다.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Supabase 프로젝트에서 API 키 확인
            </h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <p className="text-slate-300">
                1. <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  Supabase 대시보드 <ExternalLink className="h-4 w-4" />
                </a>에 접속
              </p>
              <p className="text-slate-300">2. 프로젝트 선택</p>
              <p className="text-slate-300">3. Settings → API 메뉴로 이동</p>
              <p className="text-slate-300">4. Project URL과 anon public key 복사</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. .env.local 파일 생성/수정
            </h2>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">프로젝트 루트에 .env.local 파일:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(envTemplate, 'env')}
                  className="text-xs"
                >
                  {copied === 'env' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="text-green-400 text-sm overflow-x-auto">
                {envTemplate}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. 개발 서버 재시작
            </h2>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">터미널에서 실행:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard('npm run dev', 'cmd')}
                  className="text-xs"
                >
                  {copied === 'cmd' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="text-green-400 text-sm">npm run dev</pre>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <p className="text-slate-400 text-sm text-center">
              환경변수 설정 후 페이지를 새로고침하면 정상적으로 로그인할 수 있습니다.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}