"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Plus, Minus, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { PointLog, PointLogType } from "@/types/point-logs";

export default function PointHistoryPage() {
  const router = useRouter();
  const { user, credits, isCreditsLoaded } = useAuth(); // credits와 isCreditsLoaded는 useAuth에서 가져옴
  const { showError } = useToast();
  const [pointLogs, setPointLogs] = React.useState<PointLog[]>([]);
  const [isPointLogsLoading, setIsPointLogsLoading] = React.useState(true); // pointLogs 전용 로딩 상태
  const [activeTab, setActiveTab] = React.useState<PointLogType>('all');
  const [totalChargeAmount, setTotalChargeAmount] = React.useState(0);
  const [totalUsageAmount, setTotalUsageAmount] = React.useState(0);

  // 포인트 로그 조회 (useAuth의 user에 의존)
  const fetchPointLogs = React.useCallback(async (type: PointLogType = 'all') => {
    if (!user) {
      console.log('User not available, skipping fetchPointLogs.');
      setIsPointLogsLoading(false); // 사용자 없으면 로딩 종료
      return;
    }

    try {
      setIsPointLogsLoading(true); // pointLogs 로딩 시작
      const response = await fetch(`/api/point-logs?type=${type}&limit=100`);
      const result = await response.json();

      if (result.success) {
        console.log('Fetched logs:', result.data);
        setPointLogs(result.data);
        
        const charges = result.data.filter((log: PointLog) => log.type === 'charge');
        const usages = result.data.filter((log: PointLog) => log.type === 'usage');
        
        setTotalChargeAmount(charges.reduce((sum: number, log: PointLog) => sum + Math.abs(log.amount), 0));
        setTotalUsageAmount(usages.reduce((sum: number, log: PointLog) => sum + Math.abs(log.amount), 0));
      } else {
        showError("내역 조회 실패", result.error);
        setPointLogs([]); // 에러 시 빈 배열
      }
    } catch (error) {
      console.error('포인트 로그 조회 실패:', error);
      showError("오류 발생", "내역을 불러오는 중 오류가 발생했습니다.");
      setPointLogs([]); // 에러 시 빈 배열
    } finally {
      setIsPointLogsLoading(false); // pointLogs 로딩 종료
    }
  }, [user, showError]); // user와 showError를 의존성에 추가

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    const tabType = value as PointLogType;
    setActiveTab(tabType);
    fetchPointLogs(tabType);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '-').replace(/\./g, '').replace(', ', ' ');
  };

  // 금액 포맷팅
  const formatAmount = (amount: number, type: 'charge' | 'usage') => {
    const displayAmount = Math.abs(amount); // 항상 절대값으로 표시
    const prefix = type === 'charge' ? '+' : '-';
    const colorClass = type === 'charge' ? 'text-blue-600' : 'text-destructive';
    return { prefix, colorClass, amount: displayAmount.toLocaleString() };
  };

  React.useEffect(() => {
    console.log("Current Credits:", credits, "Is Credits Loaded:", isCreditsLoaded);
    // 사용자가 로드되었을 때만 포인트 로그를 가져옴
    if (user) {
      fetchPointLogs(activeTab);
    } else {
      // 사용자가 없을 경우 상태 초기화
      setPointLogs([]);
      setTotalChargeAmount(0);
      setTotalUsageAmount(0);
      setIsPointLogsLoading(false);
    }
  }, [user, activeTab, fetchPointLogs, credits, isCreditsLoaded]);

  // user가 없으면 로그인 유도 UI 표시 (useAuth에서 isLoading을 가져오지 않아도 됨)
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-slate-200">로그인이 필요합니다</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push("/login")} className="w-full">
                로그인하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto max-w-6xl mobile-page py-6 sm:py-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 self-start touch-target min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            <div className="text-left sm:text-right">
              <h1 className="text-xl sm:text-2xl font-bold text-white">포인트 사용 내역</h1>
              <p className="text-sm text-slate-400 mt-1">충전 및 사용 기록을 확인하세요</p>
            </div>
          </div>

          {/* 상단 요약 섹션 - 모바일에서 세로 배치 */}
          <div className="space-y-4 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4 md:gap-6 sm:space-y-0 mb-6 sm:mb-8">
            {/* 현재 보유 포인트 */}
            <Card className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30 rounded-2xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                  현재 보유 포인트
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isCreditsLoaded ? (
                  <div className="text-2xl sm:text-3xl font-bold text-orange-300">
                    {credits.toLocaleString()}P
                  </div>
                ) : (
                  <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
                )}
              </CardContent>
            </Card>

            {/* 총 충전 금액 */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 rounded-2xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-400 text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  총 충전 금액
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isPointLogsLoading ? (
                  <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold text-blue-300">
                    +{totalChargeAmount.toLocaleString()}P
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 총 사용 금액 */}
            <Card className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30 rounded-2xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-red-400 text-sm sm:text-base">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  총 사용 금액
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isPointLogsLoading ? (
                  <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold text-red-300">
                    -{totalUsageAmount.toLocaleString()}P
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 필터 탭 및 내역 리스트 */}
          <Card className="bg-slate-900/50 border-slate-700 rounded-2xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-slate-200 text-lg sm:text-xl">
                <CreditCard className="w-5 h-5" />
                포인트 변동 내역
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-600">
                  <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                    전체
                  </TabsTrigger>
                  <TabsTrigger value="charge" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                    충전
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                    사용
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {isPointLogsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : pointLogs.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CreditCard className="w-16 h-16 text-slate-600 mb-4" />
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">
                        아직 포인트 내역이 없습니다
                      </h3>
                      <p className="text-slate-500 mb-6">
                        포인트를 충전하거나 사용하면 여기에 기록이 표시됩니다.
                      </p>
                      <Button
                        onClick={() => router.push("/payments")}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        포인트 충전하러 가기
                      </Button>
                    </div>
                  ) : (
                    // 데이터 테이블 (모바일 가로 스크롤)
                    <div className="mobile-table-wrap">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-800/50">
                          <TableHead className="text-slate-300">날짜</TableHead>
                          <TableHead className="text-slate-300">내용</TableHead>
                          <TableHead className="text-slate-300">구분</TableHead>
                          <TableHead className="text-slate-300 text-right">변동 포인트</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointLogs.map((log) => {
                          const { prefix, colorClass, amount } = formatAmount(log.amount, log.type);
                          return (
                            <TableRow 
                              key={log.id} 
                              className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                            >
                              <TableCell className="text-slate-400">
                                {formatDate(log.created_at)}
                              </TableCell>
                              <TableCell className="text-slate-200">
                                {log.description}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {log.type === 'charge' ? (
                                    <>
                                      <Plus className="w-4 h-4 text-blue-400" />
                                      <span className="text-blue-400 font-medium">충전</span>
                                    </>
                                  ) : (
                                    <>
                                      <Minus className="w-4 h-4 text-red-400" />
                                      <span className="text-red-400 font-medium">사용</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={`text-right font-bold ${colorClass}`}>
                                {prefix}{amount}P
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}