"use client";

import * as React from "react";
import { 
  FileUp, 
  Cpu, 
  ClipboardCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";

export default function HomePage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 text-white">
        {/* 🚀 메인 콘텐츠 영역 */}
        <main className="mx-auto w-full max-w-7xl mobile-page py-8 sm:py-10 lg:py-12 animate-in fade-in duration-1000">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
          
          {/* ⬅️ 왼쪽: 메인 슬로건 및 업로드 */}
          <div className="space-y-8 sm:space-y-12">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black leading-[1.2] tracking-tight">
                강의 <span className="text-blue-500">PDF만 올리면</span> <br />
                시험 문제가 완성돼요.
              </h1>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg">
                벼락치기로 밤 세우지 마세요. 에이쁠이 강의 자료에서 중요한 개념들만 뽑아 문제를 만들어 드릴게요.
              </p>
            </div>

            {/* 업로드 박스 버튼 */}
            <div className="relative group">
              <button 
                onClick={() => router.push("/simple-quiz")}
                className="w-full aspect-[16/9] lg:aspect-[4/3] rounded-2xl sm:rounded-[2rem] border-2 border-dashed min-h-[180px] sm:min-h-0 border-white/10 bg-white/5 flex flex-col items-center justify-center gap-6 transition-all duration-500 hover:border-primary-deep/50 hover:bg-white/[0.07] group-hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-deep/10 text-primary-deep group-hover:scale-110 group-hover:bg-primary-deep/20 transition-all duration-500">
                  <FileUp className="h-10 w-10" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold text-slate-200">여기에 파일을 업로드하세요</p>
                  <p className="text-sm text-slate-500 font-medium">PDF, DOCX, HWP (최대 50MB)</p>
                </div>
              </button>
            </div>

          </div>

          {/* ➡️ 오른쪽: SERVICE FLOW */}
          <div className="space-y-6 sm:space-y-10 lg:pl-10 animate-in slide-in-from-right-4 duration-1000 delay-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Service Flow</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {[
                { 
                  step: "1", 
                  title: "PDF 업로드", 
                  desc: "강의안 또는 교재를 업로드하세요.",
                  icon: <FileUp className="h-5 w-5 text-blue-400" />
                },
                { 
                  step: "2", 
                  title: "AI 정밀 분석", 
                  desc: "문서의 핵심 개념을 심층 분석합니다.",
                  icon: <Cpu className="h-5 w-5 text-purple-400" />
                },
                { 
                  step: "3", 
                  title: "시험 문제 생성", 
                  desc: "최적화된 맞춤 문항을 생성합니다.",
                  icon: <ClipboardCheck className="h-5 w-5 text-emerald-400" />
                },
              ].map((item) => (
                <div key={item.step} className="group relative rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.03] p-4 sm:p-6 transition-all hover:bg-white/[0.06] hover:border-white/10">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl font-black text-slate-500 group-hover:text-white transition-colors">
                      {item.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <div className="hidden group-hover:block animate-in fade-in zoom-in duration-300">
                      {item.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 팁 박스 */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-5 sm:p-8 text-center">
              <p className="text-sm text-slate-500 italic font-medium leading-relaxed">
                "어떤 파일을 올릴지 고민되시나요? 강의자료를 먼저 업로드 해보세요."
              </p>
            </div>

            {/* 추천 태그 */}
            <div className="space-y-4 mt-8">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">추천 문서 타입:</p>
              <div className="flex flex-wrap gap-2">
                {["전공 서적", "기말고사 요약본", "강의 슬라이드"].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
