"use client";

import * as React from "react";
import { LogOut, Coins, User, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function UserHeader() {
  const { user, credits, isLoadingCredits, creditsError, refreshCredits, signOut } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSignOut = async () => {
    await signOut();
    showSuccess("로그아웃 완료", "안전하게 로그아웃되었습니다.");
  };

  const handleRefreshCredits = async () => {
    console.log("🔄 [UserHeader] 수동 새로고침 시작");
    showSuccess("새로고침", "포인트를 다시 불러오는 중...");
    await refreshCredits();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
        {/* 유저 정보 */}
        <div className="flex items-center gap-3">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.email || "User"}
              className="h-10 w-10 rounded-full border-2 border-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 bg-slate-800">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white">
              {user.user_metadata?.name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* 포인트 & 로그아웃 */}
        <div className="flex items-center gap-2">
          {/* 포인트 (로딩/에러 상태 포함) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5">
            <Coins className="h-4 w-4 text-yellow-400" />
            {isLoadingCredits ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
                <span className="text-xs text-yellow-500/80">로딩...</span>
              </div>
            ) : creditsError ? (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">오류</span>
              </div>
            ) : (
              <>
                <span className="text-sm font-bold text-yellow-400 tabular-nums">
                  {credits.toLocaleString()}
                </span>
                <span className="text-xs text-yellow-500/80">P</span>
              </>
            )}
          </div>

          {/* 로그아웃 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-9 gap-1.5 px-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </Button>
        </div>
      </div>

      {/* 에러 메시지 & 새로고침 버튼 */}
      {creditsError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-red-400">
                  포인트를 불러올 수 없습니다
                </p>
                <p className="mt-1 text-xs text-red-300/80">
                  {creditsError}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshCredits}
                className="w-full gap-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <RefreshCw className="h-3 w-3" />
                새로고침
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
