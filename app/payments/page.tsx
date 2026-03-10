"use client";

import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, History } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-4xl mobile-page py-6 sm:py-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 self-start touch-target min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                돌아가기
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  포인트 충전
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  AI 퀴즈 생성을 위한 포인트를 충전하세요
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => router.push("/payments/history")}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto touch-target min-h-[44px] justify-center"
            >
              <History className="w-4 h-4" />
              사용 내역
            </Button>
          </div>

          {/* 충전 옵션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { amount: 100, price: 1000, bonus: 0 },
              { amount: 500, price: 4500, bonus: 50 },
              { amount: 1000, price: 8500, bonus: 150 },
            ].map((option) => (
              <Card key={option.amount} className="relative">
                {option.bonus > 0 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                    +{option.bonus}P 보너스
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    {(option.amount + option.bonus).toLocaleString()}P
                  </CardTitle>
                  <CardDescription>
                    {option.price.toLocaleString()}원
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    <CreditCard className="w-4 h-4 mr-2" />
                    준비 중
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    약 {Math.floor((option.amount + option.bonus) / 5)}개 퀴즈 생성 가능
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 안내 사항 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>포인트 이용 안내</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 1포인트로 5문제 생성이 가능합니다</p>
              <p>• 충전된 포인트는 만료되지 않습니다</p>
              <p>• 생성된 퀴즈는 무제한 풀이 및 다운로드가 가능합니다</p>
              <p>• 결제 시스템은 현재 준비 중입니다</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}