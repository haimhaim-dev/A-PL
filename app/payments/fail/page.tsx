"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home, HelpCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 오류 정보 추출
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // 오류 메시지 매핑
  const getErrorDetails = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return {
          title: '결제가 취소되었습니다',
          description: '사용자에 의해 결제가 취소되었습니다.',
          canRetry: true
        };
      case 'PAY_PROCESS_ABORTED':
        return {
          title: '결제가 중단되었습니다',
          description: '결제 과정에서 오류가 발생하여 중단되었습니다.',
          canRetry: true
        };
      case 'REJECT_CARD_COMPANY':
        return {
          title: '카드사에서 승인을 거절했습니다',
          description: '카드 한도 초과 또는 카드사 정책에 의해 결제가 거절되었습니다.',
          canRetry: true
        };
      case 'EXCEED_MAX_CARD_INSTALLMENT_PLAN':
        return {
          title: '할부 개월 수 초과',
          description: '선택한 할부 개월 수가 카드사 정책을 초과했습니다.',
          canRetry: true
        };
      case 'INVALID_CARD_INSTALLMENT_PLAN':
        return {
          title: '유효하지 않은 할부 정보',
          description: '할부 정보가 올바르지 않습니다.',
          canRetry: true
        };
      case 'NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT':
        return {
          title: '할부 결제 미지원',
          description: '해당 카드 또는 가맹점에서 할부 결제를 지원하지 않습니다.',
          canRetry: true
        };
      case 'INVALID_CARD_EXPIRATION':
        return {
          title: '카드 유효기간 오류',
          description: '카드 유효기간이 올바르지 않습니다.',
          canRetry: true
        };
      case 'INVALID_STOPPED_CARD':
        return {
          title: '정지된 카드',
          description: '사용이 정지된 카드입니다.',
          canRetry: false
        };
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return {
          title: '일일 결제 한도 초과',
          description: '하루 최대 결제 횟수를 초과했습니다.',
          canRetry: false
        };
      case 'NOT_SUPPORTED_MONTHLY_INSTALLMENT_PLAN':
        return {
          title: '월 할부 미지원',
          description: '해당 카드는 월 할부를 지원하지 않습니다.',
          canRetry: true
        };
      case 'EXCEED_MAX_PAYMENT_MONEY':
        return {
          title: '결제 금액 한도 초과',
          description: '최대 결제 가능 금액을 초과했습니다.',
          canRetry: false
        };
      default:
        return {
          title: '결제에 실패했습니다',
          description: errorMessage || '알 수 없는 오류가 발생했습니다.',
          canRetry: true
        };
    }
  };

  const errorDetails = getErrorDetails(errorCode);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-2xl mobile-page py-12">
          
          {/* 실패 메시지 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{errorDetails.title}</h1>
            <p className="text-slate-400 text-lg">{errorDetails.description}</p>
          </div>

          {/* 오류 정보 */}
          <Card className="mb-8 border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <HelpCircle className="w-5 h-5" />
                오류 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderId && (
                <div>
                  <div className="text-sm text-slate-400">주문번호</div>
                  <div className="font-mono text-sm">{orderId}</div>
                </div>
              )}
              {errorCode && (
                <div>
                  <div className="text-sm text-slate-400">오류 코드</div>
                  <div className="font-mono text-sm">{errorCode}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-slate-400">발생 시간</div>
                <div className="text-sm">{new Date().toLocaleString('ko-KR')}</div>
              </div>
            </CardContent>
          </Card>

          {/* 해결 방법 안내 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>해결 방법</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-200">다음 사항을 확인해보세요:</h4>
                  <ul className="text-sm text-slate-400 space-y-1 ml-4">
                    <li>• 카드 정보가 정확한지 확인</li>
                    <li>• 카드 한도가 충분한지 확인</li>
                    <li>• 인터넷 연결 상태 확인</li>
                    <li>• 다른 결제 수단 사용</li>
                  </ul>
                </div>
                
                {!errorDetails.canRetry && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-400">
                      ⚠️ 이 오류는 재시도로 해결되지 않을 수 있습니다. 다른 결제 수단을 이용해주세요.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="space-y-4">
            {errorDetails.canRetry && (
              <Button 
                onClick={() => router.push('/payments')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도하기
              </Button>
            )}
            
            <div className="grid gap-3 md:grid-cols-2">
              <Button 
                onClick={() => router.push('/payments')}
                variant="outline"
                className="w-full"
              >
                결제 페이지로 돌아가기
              </Button>
              <Button 
                onClick={() => router.push('/')}
                variant="ghost"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </div>
          </div>

          {/* 고객 지원 */}
          <Card className="mt-8 bg-slate-800/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h4 className="font-medium text-slate-200">문제가 계속 발생하나요?</h4>
                <div className="text-sm text-slate-400">
                  <p>결제 관련 문의나 기술적 문제가 지속되면</p>
                  <p>고객센터로 연락해주세요: <span className="text-blue-400">haimhaim.dev@gmail.com</span></p>
                  <p className="mt-2 text-xs">
                    문의 시 주문번호와 오류 코드를 함께 알려주시면 더 빠른 해결이 가능합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}