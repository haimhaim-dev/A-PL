"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, ArrowRight, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PaymentConfirmResponse } from "@/types/payment";

export const dynamic = 'force-dynamic';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshCredits } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [result, setResult] = React.useState<PaymentConfirmResponse | null>(null);

  // URL 파라미터에서 결제 정보 추출
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  // 결제 승인 처리
  React.useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      showError('결제 정보 오류', '결제 정보가 올바르지 않습니다.');
      router.push('/payments');
      return;
    }

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  const confirmPayment = async () => {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount!)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setResult(result.data);
        showSuccess('결제 완료', '크레딧이 성공적으로 충전되었습니다!');
        
        // 크레딧 정보 새로고침
        await refreshCredits();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      showError('결제 승인 실패', error instanceof Error ? error.message : '결제 승인 중 오류가 발생했습니다.');
      router.push('/payments/fail');
    } finally {
      setIsProcessing(false);
    }
  };

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">접근 권한 없음</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/login')} className="w-full">
                로그인하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // 처리 중
  if (isProcessing) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <CardTitle className="text-2xl">결제 처리 중</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-400">결제를 승인하고 있습니다. 잠시만 기다려주세요...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // 결제 성공
  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-2xl mobile-page py-12">
          
          {/* 성공 메시지 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">결제 완료!</h1>
            <p className="text-slate-400 text-lg">크레딧이 성공적으로 충전되었습니다.</p>
          </div>

          {/* 결제 결과 */}
          {result && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-400">주문번호</div>
                      <div className="font-mono text-sm">{result.orderId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">결제금액</div>
                      <div className="text-lg font-semibold">{parseInt(amount!).toLocaleString()}원</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-400">충전된 크레딧</div>
                      <div className="text-lg font-semibold text-orange-400">+{result.creditsAdded}개</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">현재 보유 크레딧</div>
                      <div className="text-lg font-semibold text-green-400">{result.newBalance}개</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 다음 단계 안내 */}
          <Card className="mb-8 bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">이제 AI 퀴즈를 생성해보세요!</h3>
                <p className="text-slate-300">
                  충전된 크레딧으로 다양한 주제의 퀴즈를 무제한 생성할 수 있습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    퀴즈 생성하러 가기
                  </Button>
                  <Button 
                    onClick={() => router.push('/profile')}
                    variant="outline"
                  >
                    마이페이지
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 고객 지원 */}
          <Card className="bg-slate-800/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h4 className="font-medium text-slate-200">결제 관련 문의</h4>
                <div className="text-sm text-slate-400">
                  <p>결제 영수증이나 기타 문의사항이 있으시면</p>
                  <p>언제든지 <span className="text-blue-400">haimhaim.dev@gmail.com</span>으로 연락해주세요.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 홈으로 버튼 */}
          <div className="text-center mt-8">
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="text-slate-400 hover:text-slate-200"
            >
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}