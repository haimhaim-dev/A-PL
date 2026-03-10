"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Library, 
  User, 
  Sparkles,
  Menu,
  X 
} from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LoginButton } from "@/components/auth/LoginButton";
import { ProfilePopover } from "@/components/profile/ProfilePopover";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    id: "home",
    label: "홈",
    icon: Home,
    href: "/",
    description: "메인 대시보드"
  },
  {
    id: "quiz",
    label: "퀴즈 생성",
    icon: Sparkles,
    href: "/simple-quiz",
    description: "새로운 퀴즈 만들기"
  },
  {
    id: "library",
    label: "라이브러리",
    icon: Library,
    href: "/library",
    description: "생성한 퀴즈 목록"
  },
  {
    id: "profile",
    label: "마이페이지",
    icon: User,
    href: "/profile",
    description: "개인정보 및 설정"
  }
];

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // 현재 활성 메뉴 결정
  const getActiveMenuItem = (path: string) => {
    if (path === "/") return "home";
    if (path.startsWith("/simple-quiz")) return "quiz";
    if (path.startsWith("/library")) return "library";
    if (path.startsWith("/profile")) return "profile";
    return "";
  };

  const activeMenuItem = getActiveMenuItem(pathname);

  const handleMenuClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  // 사용자 정보 표시용 컴포넌트
  const UserInfo = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-slate-400">로딩 중...</span>
        </div>
      );
    }

    if (user) {
      const userName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      '사용자';
      const userImageUrl = user.user_metadata?.avatar_url || 
                          user.user_metadata?.picture;

      return (
        <ProfilePopover>
          <div className="flex items-center cursor-pointer hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {userImageUrl ? (
                <img 
                  src={userImageUrl} 
                  alt={`${userName}의 프로필`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </ProfilePopover>
      );
    }

    return (
      <LoginButton 
        variant="default"
        size="sm"
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-none"
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <div className="flex flex-col flex-1 min-h-0 bg-slate-900 border-r border-slate-800">
          {/* Logo Section */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-900 border-b border-slate-800">
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <AppLogo size={32} rounded="lg" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  에이쁠
                </h1>
                <p className="text-xs text-slate-400 -mt-1">A-Pl</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenuItem === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => handleMenuClick(item.href)}
                  className={cn(
                    "group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      isActive ? "text-purple-400" : "text-slate-400 group-hover:text-slate-300"
                    )}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-left">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-slate-500 group-hover:text-slate-400">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User Info Section */}
          <div className="flex-shrink-0 p-4 border-t border-slate-800">
            <UserInfo />
          </div>
        </div>
      </aside>

      {/* Mobile Header (고정 + safe-area, 네비게이션 바로부터 여유 확보) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 safe-top bg-slate-900/95 border-b border-slate-800 backdrop-blur">
        <div className="flex items-center justify-between h-14 min-h-[48px] px-4">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer touch-target"
          >
            <AppLogo size={32} rounded="lg" className="flex-shrink-0" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              에이쁠
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-11 w-11 touch-target text-slate-300 hover:text-white shrink-0"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu: 하단 시트 형태 (화면 절반 정도만 덮도록) */}
      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden
          />
          <div className="md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col bg-slate-900 safe-bottom rounded-t-2xl shadow-2xl max-h-[70vh]">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-700" />
            </div>
            <nav className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenuItem === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMenuClick(item.href)}
                    className={cn(
                      "flex items-center min-h-[48px] touch-target w-full px-4 py-3 text-base font-medium rounded-xl transition-all cursor-pointer",
                      isActive
                        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30"
                        : "text-slate-300 active:bg-slate-800/50"
                    )}
                  >
                    <Icon
                      className={cn("mr-4 h-5 w-5 shrink-0", isActive ? "text-purple-400" : "text-slate-400")}
                    />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </nav>
            <div className="flex-shrink-0 p-4 border-t border-slate-800">
              <UserInfo />
              {/* 개인정보처리방침 링크 */}
              <div className="mt-3 pt-3 border-t border-slate-800/50 text-center">
                <a 
                  href="/privacy"
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors duration-200"
                >
                  개인정보처리방침
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content (모바일: 고정 헤더 + 하단 네비게이션 영역 여유) */}
      <main className={cn(
        "flex-1 overflow-hidden flex flex-col",
        "pt-14 md:pt-0", // 모바일 헤더 높이
        "md:ml-64"
      )}>
        <div className="flex-1 overflow-y-auto safe-bottom pb-4">
          {children}
        </div>
      </main>
    </div>
  );
}