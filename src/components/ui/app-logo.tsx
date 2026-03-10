"use client";

import { cn } from "@/lib/utils";

interface AppLogoProps {
  /** 아이콘 크기 (정사각 영역 기준) */
  size?: 24 | 32 | 36 | 40 | 48;
  /** 둥근 모서리 (로고를 잘라서 보여줄 때) */
  rounded?: "none" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeMap = { 24: 24, 32: 32, 36: 36, 40: 40, 48: 48 } as const;

export function AppLogo({ size = 40, rounded = "lg", className }: AppLogoProps) {
  const px = sizeMap[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-transparent",
        rounded === "full" && "rounded-full",
        rounded === "xl" && "rounded-xl",
        rounded === "lg" && "rounded-lg",
        rounded === "md" && "rounded-md",
        rounded === "none" && "rounded-none",
        className
      )}
      style={{ width: px, height: px }}
    >
      <img
        src="/icons/Icon.svg"
        alt="에이쁠"
        width={px}
        height={px}
        className="h-full w-full object-contain object-center"
      />
    </span>
  );
}
