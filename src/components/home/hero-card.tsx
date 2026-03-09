import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeatureCard } from "@/types";

const features: FeatureCard[] = [
  {
    label: "자동 요약",
    value: "핵심 개념",
    description: "강의 자료 핵심 추출"
  },
  {
    label: "난이도",
    value: "초·중·고",
    description: "3단계 난이도 설정"
  },
  {
    label: "문제 타입",
    value: "객·서술 혼합",
    description: "다양한 유형 지원"
  }
];

interface HeroCardProps {
  todayExamCount?: number;
}

export function HeroCard({ todayExamCount = 0 }: HeroCardProps) {
  return (
    <Card className="relative overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 배경 글로우 효과 */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary-deep/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 right-6 h-24 w-24 rounded-full bg-accent-red/40 blur-3xl" />

      {/* 컨텐츠 */}
      <div className="relative space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Smart Exam Builder
            </p>
            <p className="text-base font-semibold text-slate-100">
              PDF 한 개로, 시험 대비 끝.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400">오늘 만든 문제</span>
            <span className="text-lg font-bold text-white tabular-nums">
              {todayExamCount}
              <span className="ml-0.5 text-xs font-medium text-slate-400">
                세트
              </span>
            </span>
          </div>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid grid-cols-3 gap-2">
          {features.map((feature, idx) => (
            <div
              key={feature.label}
              className={cn(
                "group relative rounded-xl border border-white/5 bg-slate-900/60 px-3 py-3 backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-white/10",
                "animate-in fade-in slide-in-from-bottom-2 duration-500",
                `delay-${(idx + 1) * 100}`
              )}
            >
              <p className="text-[10px] font-medium text-slate-400 transition-colors group-hover:text-slate-300">
                {feature.label}
              </p>
              <p className="mt-1.5 text-xs font-semibold leading-tight text-slate-50">
                {feature.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
