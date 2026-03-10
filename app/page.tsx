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
        {/* 모바일 우선 메인 콘텐츠 */}
        <main className="w-full mobile-page py-6 sm:py-8 lg:py-12 animate-in fade-in duration-1000">
          {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
          <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start lg:space-y-0 max-w-7xl mx-auto">
            
            {/* 메인 슬로건 및 업로드 (모바일에서 상단) */}
            <div className="space-y-6 lg:space-y-12">
              <div className="text-center lg:text-left space-y-4 lg:space-y-6">
                <h1 className="text-2xl sm:text-3xl lg:text-6xl font-black leading-tight lg:leading-[1.2] tracking-tight">
                  강의 <span className="text-blue-500">PDF만 올리면</span>
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  시험 문제가 완성돼요.
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                  벼락치기로 밤 세우지 마세요. 에이쁠이 강의 자료에서 중요한 개념들만 뽑아 문제를 만들어 드릴게요.
                </p>
              </div>

              {/* 업로드 버튼 - 모바일에 최적화 */}
              <div className="relative group">
                <button 
                  onClick={() => router.push("/simple-quiz")}
                  className="w-full h-32 sm:h-40 lg:aspect-[4/3] lg:h-auto rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 sm:gap-4 lg:gap-6 transition-all duration-500 hover:border-primary-deep/50 hover:bg-white/[0.07] group-hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] touch-target"
                >
                  <div className="flex h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-primary-deep/10 text-primary-deep group-hover:scale-110 group-hover:bg-primary-deep/20 transition-all duration-500">
                    <FileUp className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-200">파일 업로드하기</p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">PDF, DOCX, HWP (최대 50MB)</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 서비스 플로우 (모바일에서 하단) */}
            <div className="space-y-6 lg:space-y-10 lg:pl-10">
              {/* 모바일에서는 간단한 제목 */}
              <div className="text-center lg:text-left">
                <h2 className="text-lg sm:text-xl lg:text-sm font-bold lg:font-black text-blue-500 lg:uppercase lg:tracking-[0.2em]">
                  <span className="lg:hidden">3단계로 간단하게</span>
                  <span className="hidden lg:block">Service Flow</span>
                </h2>
              </div>

              {/* 모바일: 컴팩트한 스텝, 데스크톱: 기존 스타일 */}
              <div className="space-y-3 lg:space-y-4">
                {[
                  { 
                    step: "1", 
                    title: "PDF 업로드", 
                    desc: "강의안 또는 교재를 업로드하세요.",
                    icon: <FileUp className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400" />
                  },
                  { 
                    step: "2", 
                    title: "AI 정밀 분석", 
                    desc: "문서의 핵심 개념을 심층 분석합니다.",
                    icon: <Cpu className="h-4 w-4 lg:h-5 lg:w-5 text-purple-400" />
                  },
                  { 
                    step: "3", 
                    title: "시험 문제 생성", 
                    desc: "최적화된 맞춤 문항을 생성합니다.",
                    icon: <ClipboardCheck className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-400" />
                  },
                ].map((item) => (
                  <div key={item.step} className="group relative rounded-xl lg:rounded-3xl border border-white/5 bg-white/[0.03] p-3 sm:p-4 lg:p-6 transition-all hover:bg-white/[0.06] hover:border-white/10">
                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg lg:rounded-2xl bg-white/5 text-sm sm:text-base lg:text-xl font-black text-slate-500 group-hover:text-white transition-colors shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1 space-y-0.5 lg:space-y-1 min-w-0">
                        <h3 className="text-sm sm:text-base lg:text-base font-bold text-slate-200 group-hover:text-white transition-colors">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-tight">{item.desc}</p>
                      </div>
                      <div className="hidden lg:group-hover:block animate-in fade-in zoom-in duration-300 shrink-0">
                        {item.icon}
                      </div>
                      {/* 모바일에서는 항상 표시 */}
                      <div className="lg:hidden shrink-0">
                        {item.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 추천 태그 - 모바일에서 더 컴팩트하게 */}
              <div className="space-y-3 lg:space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center lg:text-left">추천 문서 타입</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                  {["전공 서적", "기말고사 요약본", "강의 슬라이드"].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 팁 박스 - 모바일에서는 간소화 */}
              <div className="rounded-xl lg:rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-4 lg:p-8 text-center">
                <p className="text-xs sm:text-sm text-slate-500 italic font-medium leading-relaxed">
                  <span className="lg:hidden">"강의자료를 먼저 업로드 해보세요!"</span>
                  <span className="hidden lg:block">"어떤 파일을 올릴지 고민되시나요? 강의자료를 먼저 업로드 해보세요."</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}