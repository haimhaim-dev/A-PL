"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export function AccountSettingsSection() {
  const router = useRouter();
  const { credits } = useAuth();

  const handlePointManagement = () => {
    // 포인트 이용 내역 페이지로 이동
    router.push("/payments/history");
  };

  const handlePointCharge = () => {
    router.push("/payments");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          계정 설정
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* 포인트 관리 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-slate-200">
                  포인트 관리
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    보유 포인트: <span className="font-bold text-orange-400">{credits}P</span>
                  </span>
                  <Button
                    onClick={handlePointCharge}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 p-1 h-auto"
                  >
                    [충전]
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={handlePointManagement}
              variant="outline"
              size="sm"
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              이용 내역
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}