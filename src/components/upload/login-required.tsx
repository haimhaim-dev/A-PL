import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LoginRequired() {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10">
          <Lock className="h-8 w-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            로그인이 필요합니다
          </h3>
          <p className="text-sm text-slate-400">
            PDF 업로드 및 문제 생성 기능을 사용하려면
            <br />
            먼저 로그인해 주세요.
          </p>
        </div>

        <Button asChild size="lg" className="w-full gap-2">
          <Link href="/login">
            <LogIn className="h-5 w-5" />
            로그인하러 가기
          </Link>
        </Button>

        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-xs text-yellow-400">
            💡 첫 가입 시 <span className="font-bold">500P 무료</span> 지급!
          </p>
        </div>
      </div>
    </Card>
  );
}
