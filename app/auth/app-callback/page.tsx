"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * 모바일 전용 PKCE 딥링크 콜백 페이지
 *
 * - 안드로이드 앱에서 딥링크(appl://auth/callback?code=...)를 받으면
 *   WebView 를 이 페이지(https://a-pl.vercel.app/auth/app-callback?code=...)로 열어 주면 됩니다.
 * - 이 페이지는 쿼리 스트링의 code 값을 사용해
 *   supabase.auth.exchangeCodeForSession(code)를 호출합니다.
 */
export default function AppAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      // code가 없으면 에러 페이지로 이동
      router.replace("/auth/auth-code-error");
      return;
    }

    const run = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("❌ [AppAuthCallback] 세션 교환 실패:", error);
          router.replace("/auth/auth-code-error");
          return;
        }

        if (data?.session) {
          console.log("✅ [AppAuthCallback] 세션 교환 성공");
          router.replace("/");
        } else {
          console.error("❌ [AppAuthCallback] 세션 데이터 없음");
          router.replace("/auth/auth-code-error");
        }
      } catch (err) {
        console.error("❌ [AppAuthCallback] 예외 발생:", err);
        router.replace("/auth/auth-code-error");
      }
    };

    void run();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-100">
            로그인 처리를 완료하는 중입니다...
          </p>
          <p className="text-xs text-slate-400">
            잠시만 기다려 주세요. 자동으로 메인 화면으로 이동합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

