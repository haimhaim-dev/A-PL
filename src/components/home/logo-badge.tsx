import { cn } from "@/lib/utils";

interface LogoBadgeProps {
  className?: string;
}

export function LogoBadge({ className }: LogoBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20",
        className
      )}
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-deep to-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-900/50">
        <span className="relative z-10">A+</span>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-tight text-white">
          에이쁠
        </span>
        <span className="text-[11px] text-slate-400">
          대학생을 위한 AI 시험 문제 생성
        </span>
      </div>
    </div>
  );
}
