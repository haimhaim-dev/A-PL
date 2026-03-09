"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreditSectionProps {
  currentCredits: number;
}

export function CreditSection({ currentCredits }: CreditSectionProps) {
  const router = useRouter();
  const FORMATTED_CREDITS = currentCredits.toLocaleString();

  const handleCreditRecharge = () => {
    router.push("/payments");
  };

  return (
    <Card className="w-full bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-200/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Coins className="w-5 h-5" />
          보유 포인트
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 크레딧 표시 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {FORMATTED_CREDITS}
            </span>
            <span className="text-lg text-muted-foreground">P</span>
          </div>
          <p className="text-sm text-muted-foreground">
            1 포인트 = 5문제 생성
          </p>
        </div>

        {/* 충전 버튼 */}
        <Button 
          onClick={handleCreditRecharge}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-none"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          포인트 충전하기
        </Button>

        {/* 포인트 사용 안내 */}
        <div className="text-xs text-muted-foreground space-y-1 bg-background/50 rounded-lg p-3">
          <p>• 퀴즈 생성: 5문제당 1포인트</p>
          <p>• 무제한 풀이 및 복습 가능</p>
          <p>• 포인트는 만료되지 않습니다</p>
        </div>
      </CardContent>
    </Card>
  );
}