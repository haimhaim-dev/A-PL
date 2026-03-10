"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, UserX, ArrowLeft, Trash2, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

export default function AccountDeletePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [confirmText, setConfirmText] = useState("");
  const [agreedToDelete, setAgreedToDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [dataPreview, setDataPreview] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  const CONFIRM_TEXT = "계정을 삭제합니다";

  // 로그인하지 않은 경우 리다이렉트 및 데이터 미리보기 로드
  React.useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // 삭제될 데이터 미리보기 로드
    const loadDataPreview = async () => {
      try {
        const response = await fetch("/api/account/delete");
        if (response.ok) {
          const data = await response.json();
          setDataPreview(data);
        }
      } catch (error) {
        console.error("데이터 미리보기 로드 실패:", error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    loadDataPreview();
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleDeleteAccount = async () => {
    if (!agreedToDelete || confirmText !== CONFIRM_TEXT) {
      showError(
        "확인 필요",
        "모든 조건에 동의하고 확인 문구를 정확히 입력해주세요."
      );
      return;
    }

    setShowFinalConfirm(true);
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("계정 삭제에 실패했습니다.");
      }

      const result = await response.json();

      showSuccess(
        "계정 삭제 완료",
        "계정과 모든 데이터가 성공적으로 삭제되었습니다."
      );

      // 로그아웃 후 홈페이지로 이동
      await signOut();
      router.push("/");
      
    } catch (error) {
      console.error("계정 삭제 오류:", error);
      showError(
        "삭제 실패",
        "계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-4xl mobile-page py-6">
          
          {/* 헤더 */}
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4 text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <UserX className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">계정 탈퇴</h1>
              <p className="text-slate-400">계정과 모든 데이터를 영구적으로 삭제합니다</p>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* 삭제될 데이터 안내 */}
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  삭제될 데이터
                </CardTitle>
                <CardDescription className="text-slate-300">
                  계정 탈퇴 시 다음 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50">
                    <Database className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-200 mb-1">개인정보</h4>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• 이메일 주소: {user.email}</li>
                        <li>• 프로필 정보</li>
                        <li>• 로그인 기록</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50">
                    <Trash2 className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-200 mb-1">학습 데이터</h4>
                      {isLoadingPreview ? (
                        <p className="text-sm text-slate-400">데이터 로딩 중...</p>
                      ) : dataPreview ? (
                        <ul className="text-sm text-slate-400 space-y-1">
                          <li>• 생성한 퀴즈: {dataPreview.dataToDelete.quizzes}개</li>
                          <li>• 퀴즈 시도 기록: {dataPreview.dataToDelete.quizAttempts}개</li>
                          <li>• 포인트 이용 내역: {dataPreview.dataToDelete.pointLogs}개</li>
                          <li>• 내보내기 기록: {dataPreview.dataToDelete.exportHistory}개</li>
                        </ul>
                      ) : (
                        <ul className="text-sm text-slate-400 space-y-1">
                          <li>• 생성한 퀴즈</li>
                          <li>• 학습 기록</li>
                          <li>• 포인트 이용 내역</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 계정 삭제 확인 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-400" />
                  삭제 확인
                </CardTitle>
                <CardDescription>
                  계정 삭제를 위해 아래 조건들을 확인해주세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* 동의 체크박스 */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agree-delete"
                      checked={agreedToDelete}
                      onCheckedChange={(checked) => setAgreedToDelete(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="agree-delete" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        위의 모든 데이터가 영구적으로 삭제됨을 이해하고 동의합니다
                      </Label>
                      <p className="text-xs text-slate-500">
                        삭제된 데이터는 복구할 수 없으며, 관련 법령에 따라 보존해야 하는 데이터를 제외하고 모든 정보가 삭제됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 확인 문구 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-text">
                    확인을 위해 다음 문구를 정확히 입력해주세요: 
                    <span className="font-mono text-red-400 ml-2">{CONFIRM_TEXT}</span>
                  </Label>
                  <Input
                    id="confirm-text"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="위의 문구를 정확히 입력해주세요"
                    className="font-mono"
                  />
                </div>

                {/* 삭제 버튼 */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="flex-1"
                    disabled={!agreedToDelete || confirmText !== CONFIRM_TEXT}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    계정 삭제
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 최종 확인 모달 */}
            {showFinalConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md border-red-500/20 bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      최종 확인
                    </CardTitle>
                    <CardDescription>
                      정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowFinalConfirm(false)}
                        variant="outline"
                        className="flex-1"
                        disabled={isDeleting}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={handleFinalDelete}
                        variant="destructive"
                        className="flex-1"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "삭제 중..." : "삭제"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 고객 지원 안내 */}
            <Card className="bg-slate-800/30">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <h4 className="font-medium text-slate-200">도움이 필요하신가요?</h4>
                  <p className="text-sm text-slate-400">
                    계정 삭제 관련 문의사항이 있으시면 고객센터로 연락해주세요.
                  </p>
                  <div className="text-sm text-slate-300">
                    <p>이메일: <span className="text-blue-400">haimhaim.dev@gmail.com</span></p>
                    <p>전화: <span className="text-blue-400">010-2432-6174</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}