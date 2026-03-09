"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";

interface ProfilePopoverProps {
  children: React.ReactNode;
}

export function ProfilePopover({ children }: ProfilePopoverProps) {
  const router = useRouter();
  const { user, credits, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const userName = user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email?.split('@')[0] || 
                  '사용자';
  
  const userImageUrl = user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture;

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handlePayments = () => {
    setIsOpen(false);
    router.push('/payments');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-slate-800 border-slate-700 shadow-xl" 
        side="top" 
        align="center"
        sideOffset={8}
      >
        <div className="p-4">
          {/* 상단: 사용자 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {userImageUrl ? (
                <img 
                  src={userImageUrl} 
                  alt={`${userName}의 프로필`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">
                {userName}
              </h3>
              <p className="text-sm text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* 중단: 크레딧 정보 */}
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">보유 포인트</p>
                <p className="text-lg font-bold text-orange-400">
                  {credits.toLocaleString()} P
                </p>
              </div>
              <Button
                onClick={handlePayments}
                size="sm"
                variant="outline"
                className="bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30 hover:text-orange-300"
              >
                <Plus className="w-3 h-3 mr-1" />
                충전
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* 하단: 로그아웃 버튼 */}
          <div className="pt-3">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}