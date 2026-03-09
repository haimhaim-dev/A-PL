"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface USER_PROFILE_CARD_Props {
  user: SupabaseUser;
  totalQuizzes: number;
}

export function ProfileCard({ user, totalQuizzes }: USER_PROFILE_CARD_Props) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };
  // 사용자 데이터 추출 (실시간 세션 데이터 우선 사용)
  const userName = React.useMemo(() => {
    // 1. 구글 로그인 시 user_metadata에서 full_name 우선 사용
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    // 2. 이메일에서 사용자명 추출
    if (user.email) {
      return user.email.split('@')[0];
    }
    // 3. 기본값
    return "익명 사용자";
  }, [user]);

  const userEmail = user.email || "이메일 없음";
  const userImageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const MEMBER_SINCE = new Date(user.created_at).toLocaleDateString('ko-KR');
  const LEARNING_WEEKS = totalQuizzes > 0 ? Math.floor(totalQuizzes / 7) + 1 : 0;

  return (
    <TooltipProvider>
      <Card className="w-full relative">
        {/* 로그아웃 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="ghost"
              className="absolute top-3 right-3 w-8 h-8 p-0 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>로그아웃</p>
          </TooltipContent>
        </Tooltip>

      <CardHeader className="text-center pb-4">
        <div className="flex flex-col items-center space-y-4">
          {/* 프로필 아바타 - 구글 이미지 또는 기본 아이콘 */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
            {userImageUrl ? (
              <img 
                src={userImageUrl} 
                alt={`${userName}의 프로필`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 아이콘으로 대체
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <User className={`w-10 h-10 text-white ${userImageUrl ? 'hidden' : ''}`} />
          </div>
          
          {/* 사용자 정보 */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {userName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {userEmail}
            </p>
            <Badge variant="secondary" className="text-xs">
              가입일: {MEMBER_SINCE}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 학습 통계 */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{totalQuizzes}</p>
            <p className="text-xs text-muted-foreground">생성한 퀴즈</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{LEARNING_WEEKS}</p>
            <p className="text-xs text-muted-foreground">학습 주차</p>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}