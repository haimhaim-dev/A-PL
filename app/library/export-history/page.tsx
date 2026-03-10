"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MainLayout } from "@/components/layout/MainLayout";

// 동적 렌더링 강제 (Supabase 클라이언트 사용으로 인한 prerender 에러 방지)
export const dynamic = 'force-dynamic';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { ExportHistory } from "@/types/export-history";

export default function ExportHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [exportHistory, setExportHistory] = React.useState<ExportHistory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // 내보내기 기록 조회
  const fetchExportHistory = React.useCallback(async (pageNum: number = 1) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/export-history?page=${pageNum}&limit=20`);
      const result = await response.json();

      if (result.success) {
        setExportHistory(result.data);
        setTotalPages(result.pagination.totalPages);
        setPage(pageNum);
      } else {
        showError("기록을 불러올 수 없습니다.", result.error);
      }
    } catch (error) {
      console.error('내보내기 기록 조회 실패:', error);
      showError("오류 발생", "기록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [user, showError]);

  // 파일 다시 다운로드
  const handleReDownload = async (exportItem: ExportHistory) => {
    try {
      // TODO: 실제 파일 다운로드 로직 구현
      // 현재는 임시로 성공 메시지만 표시
      showSuccess("다운로드 시작", `${exportItem.file_name} 파일을 다운로드합니다.`);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      showError("다운로드 실패", "파일을 찾을 수 없거나 다운로드 중 오류가 발생했습니다.");
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').slice(0, -1);
  };

  React.useEffect(() => {
    fetchExportHistory();
  }, [fetchExportHistory]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>로그인이 필요합니다</CardTitle>
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
              onClick={() => router.push("/library")}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 self-start touch-target min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              라이브러리로 돌아가기
            </Button>
            <div className="text-left sm:text-right">
              <h1 className="text-xl sm:text-2xl font-bold text-white">내보내기 기록</h1>
              <p className="text-sm text-slate-400 mt-1">이전에 다운로드한 파일들을 확인하세요</p>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">기록을 불러오는 중...</p>
                  </div>
                </div>
              ) : exportHistory.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="w-16 h-16 text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">
                    아직 내보낸 기록이 없습니다
                  </h3>
                  <p className="text-slate-500 mb-6">
                    퀴즈를 생성하고 PDF로 내보내면 여기에 기록이 표시됩니다.
                  </p>
                  <Button
                    onClick={() => router.push("/library")}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    라이브러리로 돌아가기
                  </Button>
                </div>
              ) : (
                // 데이터 테이블 (모바일 가로 스크롤)
                <div className="mobile-table-wrap">
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">날짜</TableHead>
                      <TableHead className="text-slate-300">파일명</TableHead>
                      <TableHead className="text-slate-300 hidden md:table-cell">퀴즈 제목</TableHead>
                      <TableHead className="text-slate-300 text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportHistory.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {formatDate(item.exported_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-200 font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="truncate max-w-[200px]">{item.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 hidden md:table-cell">
                          <span className="truncate max-w-[300px] block">
                            {item.Quiz?.title || "제목 없음"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleReDownload(item)}
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            다시 다운로드
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                onClick={() => fetchExportHistory(page - 1)}
                disabled={page <= 1}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                이전
              </Button>
              <span className="flex items-center px-4 text-slate-400">
                {page} / {totalPages}
              </span>
              <Button
                onClick={() => fetchExportHistory(page + 1)}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                다음
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}