import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">로그인 실패</h1>
          <p className="text-sm text-slate-400">
            인증 코드를 처리하는 중 오류가 발생했습니다.
            <br />
            다시 시도해 주세요.
          </p>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/login">다시 로그인하기</Link>
        </Button>
      </div>
    </div>
  );
}
