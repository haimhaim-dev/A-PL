"use client";

import * as React from "react";
import { Home, FileText, User, BookOpen } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TabItem } from "@/types";

interface BottomNavProps {
  currentTab?: TabItem;
  onTabChange?: (tab: TabItem) => void;
}

const tabs = [
  { id: "home" as const, label: "홈", icon: Home, href: "/" },
  { id: "library" as const, label: "라이브러리", icon: BookOpen, href: "/library" },
  { id: "profile" as const, label: "마이페이지", icon: User, href: "/profile" }
];

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 현재 경로에 따라 활성 탭 결정
  const getActiveTab = (): TabItem => {
    if (currentTab) return currentTab;
    
    if (pathname === "/") return "home";
    if (pathname === "/library") return "library";
    if (pathname === "/simple-quiz") return "library"; // simple-quiz도 library로 리다이렉트
    if (pathname === "/profile") return "profile";
    return "home";
  };
  
  const activeTab = getActiveTab();
  
  const handleTabClick = (tab: typeof tabs[0]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    } else {
      router.push(tab.href);
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80">
      <div className="mx-auto flex max-w-sm items-center justify-around px-8 py-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 py-2 transition-all",
                "hover:scale-105 active:scale-95",
                isActive ? "text-primary-deep" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  isActive
                    ? "bg-primary-deep/10 shadow-lg shadow-primary-deep/20"
                    : "hover:bg-white/5"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "animate-in zoom-in-50")} />
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
