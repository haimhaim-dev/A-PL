"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, FileText } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";

export default function AppInfoPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl mobile-page py-6">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="shrink-0 touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <AppLogo size={40} rounded="lg" />
              <div>
                <h1 className="text-xl font-bold text-white">앱 정보</h1>
                <p className="text-sm text-slate-400">에이쁠 (A-Pl)</p>
              </div>
            </div>
          </div>

          {/* 앱 기본 정보 */}
          <Card className="mb-6 bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <Info className="h-5 w-5" />
                앱 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p><strong className="text-slate-200">앱 이름</strong> 에이쁠 (A-Pl)</p>
              <p><strong className="text-slate-200">버전</strong> 0.1.0</p>
              <p><strong className="text-slate-200">설명</strong> 대학생을 위한 AI 시험 문제 생성 서비스. 강의 PDF를 업로드하면 AI가 자동으로 문제를 생성합니다.</p>
            </CardContent>
          </Card>

          {/* 저작권 및 오픈소스 표기 */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <FileText className="h-5 w-5" />
                저작권 및 오픈소스 표기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-slate-400">
              <section>
                <h3 className="text-slate-200 font-semibold mb-2">에이쁠 (A-Pl)</h3>
                <p>본 앱 및 로고, 서비스명 「에이쁠」「A-Pl」에 대한 저작권은 서비스 제공자에게 있습니다. 무단 전제·배포·2차 이용을 금지합니다.</p>
              </section>

              <section>
                <h3 className="text-slate-200 font-semibold mb-2">이 앱에서 사용하는 오픈소스 및 서드파티</h3>
                <p className="mb-3">아래 라이브러리 및 서비스는 각각의 라이선스에 따라 사용됩니다. 라이선스 전문은 해당 프로젝트 또는 npm 패키지에서 확인할 수 있습니다.</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong className="text-slate-300">Next.js</strong> (Vercel) – MIT License</li>
                  <li><strong className="text-slate-300">React</strong> – MIT License</li>
                  <li><strong className="text-slate-300">Supabase</strong> (Supabase, Inc.) – Apache License 2.0</li>
                  <li><strong className="text-slate-300">Tailwind CSS</strong> – MIT License</li>
                  <li><strong className="text-slate-300">Radix UI</strong> – MIT License</li>
                  <li><strong className="text-slate-300">Lucide Icons</strong> – ISC License</li>
                  <li><strong className="text-slate-300">pdfjs-dist</strong> (Mozilla) – Apache License 2.0</li>
                  <li><strong className="text-slate-300">Google Generative AI / Gemini API</strong> – Google API Terms of Service</li>
                  <li><strong className="text-slate-300">KaTeX</strong> – MIT License</li>
                  <li><strong className="text-slate-300">pdf-lib</strong> – MIT License</li>
                  <li><strong className="text-slate-300">Zod</strong> – MIT License</li>
                  <li><strong className="text-slate-300">clsx / tailwind-merge</strong> – MIT License</li>
                  <li><strong className="text-slate-300">Capacitor</strong> (Ionic) – MIT License</li>
                </ul>
              </section>

              <section>
                <h3 className="text-slate-200 font-semibold mb-2">제3자 서비스</h3>
                <p>본 앱은 Google 로그인, Supabase 인증·데이터베이스, Vercel 호스팅 등 제3자 서비스를 이용합니다. 이용 시 해당 서비스의 이용약관 및 개인정보처리방침이 적용됩니다.</p>
              </section>

              <section>
                <h3 className="text-slate-200 font-semibold mb-2">문의</h3>
                <p>저작권·라이선스 관련 문의는 앱 내 설정 또는 서비스 제공자에게 연락해 주세요.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
