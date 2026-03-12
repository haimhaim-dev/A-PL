"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, Star, Crown, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import type { PaymentProduct, PaymentStatus } from "@/types/payment";

export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  const router = useRouter();
  const { user, credits } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [products, setProducts] = React.useState<PaymentProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>('idle');

  // 상품 목록 로드
  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/payments/products');
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
      } else {
        showError('상품 로드 실패', result.error);
      }
    } catch (error) {
      showError('상품 로드 실패', '상품 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 결제 시작
  const handlePayment = async (product: PaymentProduct) => {
    if (!user) {
      showError('로그인 필요', '결제를 위해 로그인해주세요.');
      router.push('/login');
      return;
    }

    setPaymentStatus('loading');

    try {
      // 1. 주문 생성
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // 2. 토스페이먼츠 SDK 로드
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);

      // 3. 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: orderResult.data.amount,
        orderId: orderResult.data.orderId,
        orderName: `${product.name} (크레딧 ${product.credits}개)`,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerName: user.user_metadata?.name || user.email,
        customerEmail: user.email
      });

    } catch (error) {
      console.error('Payment error:', error);
      showError('결제 실패', error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.');
      setPaymentStatus('error');
    }
  };

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <CardTitle className="text-2xl">크레딧 충전</CardTitle>
              <CardDescription>
                크레딧을 충전하려면 로그인이 필요합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push('/login')}
                className="w-full"
              >
                로그인하기
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                홈으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-4xl mobile-page py-6">
          
          {/* 헤더 */}
          <div className="mb-8">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4 text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                <CreditCard className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">크레딧 충전</h1>
              <p className="text-slate-400">
                현재 보유 크레딧: <span className="font-bold text-orange-400">{credits}개</span>
              </p>
            </div>
          </div>

          {/* 상품 목록 */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-10 bg-slate-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => {
                const isPopular = index === 1; // 두 번째 상품을 인기 상품으로 설정
                const isPremium = index === products.length - 1; // 마지막 상품을 프리미엄으로 설정
                
                return (
                  <Card 
                    key={product.id} 
                    className={`relative ${isPopular ? 'border-blue-500 bg-blue-500/5' : ''} ${isPremium ? 'border-purple-500 bg-purple-500/5' : ''}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          인기
                        </div>
                      </div>
                    )}
                    
                    {isPremium && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          프리미엄
                        </div>
                      </div>
                    )}

                    <CardHeader className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                        isPremium ? 'bg-purple-500/20' : 
                        isPopular ? 'bg-blue-500/20' : 'bg-orange-500/20'
                      }`}>
                        <Zap className={`w-6 h-6 ${
                          isPremium ? 'text-purple-400' : 
                          isPopular ? 'text-blue-400' : 'text-orange-400'
                        }`} />
                      </div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="text-center space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {product.price.toLocaleString()}원
                        </div>
                        <div className="text-sm text-slate-400">
                          크레딧 {product.credits}개
                        </div>
                        <div className="text-xs text-green-400 mt-1">
                          개당 {Math.round(product.price / product.credits)}원
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handlePayment(product)}
                        disabled={paymentStatus === 'loading'}
                        className={`w-full ${
                          isPremium ? 'bg-purple-600 hover:bg-purple-700' :
                          isPopular ? 'bg-blue-600 hover:bg-blue-700' : 
                          'bg-orange-600 hover:bg-orange-700'
                        }`}
                      >
                        {paymentStatus === 'loading' ? '처리 중...' : '구매하기'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 안내 사항 */}
          <Card className="mt-8 bg-slate-800/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h4 className="font-medium text-slate-200">결제 안내</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>• 결제는 토스페이먼츠를 통해 안전하게 처리됩니다</p>
                  <p>• 구매한 크레딧은 즉시 계정에 충전됩니다</p>
                  <p>• 크레딧은 AI 퀴즈 생성에 사용됩니다 (1크레딧 = 1퀴즈)</p>
                  <p>• 결제 관련 문의: <span className="text-blue-400">haimhaim.dev@gmail.com</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}