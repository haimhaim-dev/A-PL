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
          {/* 모바일 최적화 헤더 */}
          <div className="space-y-4 mb-6 sm:mb-8">
            {/* 뒤로가기 버튼 */}
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 self-start touch-target h-12 px-4"
            >
              <ArrowLeft className="w-4 h-4" />
              돌아가기
            </Button>
            
            {/* 제목과 설명 */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                포인트 충전
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                AI 퀴즈 생성을 위한 포인트를 충전하세요
              </p>
            </div>
            
            {/* 사용 내역 버튼 */}
            <Button
              onClick={() => router.push("/payments/history")}
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center gap-2 touch-target h-12"
            >
              <History className="w-4 h-4" />
              사용 내역
            </Button>
          </div>

          {/* 충전 옵션 - 모바일에서 세로 배치 */}
          <div className="space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0 lg:gap-6">
            {[
              { amount: 100, price: 1000, bonus: 0 },
              { amount: 500, price: 4500, bonus: 50 },
              { amount: 1000, price: 8500, bonus: 150 },
            ].map((option) => (
              <Card key={option.amount} className="relative rounded-2xl">
                {option.bonus > 0 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                    +{option.bonus}P 보너스
                  </div>
                )}
                <CardHeader className="text-center p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-bold">
                    {(option.amount + option.bonus).toLocaleString()}P
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    {option.price.toLocaleString()}원
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  <Button className="w-full h-12 touch-target" disabled>
                    <CreditCard className="w-4 h-4 mr-2" />
                    준비 중
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    약 {Math.floor((option.amount + option.bonus) / 5)}개 퀴즈 생성 가능
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 안내 사항 */}
          <Card className="mt-6 sm:mt-8 rounded-2xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">포인트 이용 안내</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <p>1포인트로 5문제 생성이 가능합니다</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <p>충전된 포인트는 만료되지 않습니다</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <p>생성된 퀴즈는 무제한 풀이 및 다운로드가 가능합니다</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <p>결제 시스템은 현재 준비 중입니다</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}