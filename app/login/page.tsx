"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

// 동적 렌더링 강제 (Supabase 클라이언트 사용으로 인한 prerender 에러 방지)
export const dynamic = 'force-dynamic';
import { Card } from "@/components/ui/card";
import { LogoBadge } from "@/components/home/logo-badge";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { showError, showInfo } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  // Supabase 클라이언트 생성 시 환경변수 체크
  let supabase;
  try {
    supabase = createClient();
  } catch (error) {
    // 환경변수가 없으면 설정 페이지로 리다이렉트
    if (typeof window !== 'undefined') {
      router.push('/setup-required');
    }
    return null;
  }

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  React.useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    showInfo("구글 로그인", "구글 로그인 페이지로 이동합니다...");

    try {
      const isApp = typeof window !== "undefined" && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

      if (isApp) {
        // 앱: 딥링크 기반 PKCE — 브라우저에서 로그인 후 appl://auth/callback 으로 돌아오면 앱이 열림
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            skipBrowserRedirect: true,
            redirectTo: "appl://auth/callback",
            queryParams: {
              access_type: "offline",
              prompt: "consent"
            }
          }
        });

        if (error) throw error;
        if (data?.url) {
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: data.url });
        }
        // 로딩 유지 — 브라우저에서 돌아오면 app-callback 페이지에서 처리
      } else {
        // 웹: 기존 플로우
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/`,
            queryParams: {
              access_type: "offline",
              prompt: "consent"
            }
          }
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("❌ 구글 로그인 에러:", error);
      showError(
        "로그인 실패",
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      );
      setIsLoading(false);
    }
  };

  if (user) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 mobile-page py-8 sm:py-10">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 로고 */}
        <div className="flex justify-center">
          <LogoBadge />
        </div>

        {/* 타이틀 */}
        <div className="space-y-2 sm:space-y-3 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">로그인</h1>
          <p className="text-sm leading-relaxed text-slate-400">
            에이쁠과 함께 시험 준비를 시작하세요
            <br />
            <span className="text-slate-300">AI가 문제를 만들어드립니다</span>
          </p>
        </div>

        {/* 로그인 카드 */}
        <Card className="p-4 sm:p-6 rounded-2xl">
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              size="lg"
              className="group relative w-full gap-3 overflow-hidden text-base h-12 sm:h-14 touch-target"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>로그인 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>구글로 로그인</span>
                  </>
                )}
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-500">
                  간편하고 안전한 로그인
                </span>
              </div>
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              로그인하면{" "}
              <a href="/terms" className="underline hover:text-slate-400">
                이용약관
              </a>{" "}
              및{" "}
              <a href="/privacy" className="underline hover:text-slate-400">
                개인정보처리방침
              </a>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </Card>

        {/* 첫 로그인 혜택 안내 */}
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-4 sm:p-5">
          <div className="absolute -right-6 -top-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-yellow-500/10 blur-2xl" />
          <div className="relative flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-yellow-400" />
            <p className="text-sm sm:text-base font-bold text-white">
              첫 로그인 시 5회 생성 무료!
            </p>
          </div>
        </div>

        {/* 서비스 소개 */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 sm:p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <span className="text-sm">📄</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200">
                강의자료 업로드
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                PDF 파일을 업로드하면 AI가 자동 분석
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 sm:p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <span className="text-sm">🤖</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200">AI 문제 생성</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                핵심 개념을 문제로 자동 변환
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 sm:p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <span className="text-sm">✍️</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200">시험 대비</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                객관식·서술형 문제로 완벽 준비
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
