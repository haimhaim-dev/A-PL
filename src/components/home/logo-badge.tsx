import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/app-logo";

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
      <AppLogo size={36} rounded="lg" />
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
