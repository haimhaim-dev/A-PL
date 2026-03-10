import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증 필요", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { quizId, quizAttemptId, userAnswers, score, status } = await request.json();

    if (!quizId) {
      return NextResponse.json({ error: "quizId가 필요합니다.", code: "MISSING_PARAM" }, { status: 400 });
    }

    // 🆔 직접 UUID 생성 또는 기존 ID 사용
    const id = quizAttemptId || crypto.randomUUID();

    // 📝 QuizAttempt 테이블에 upsert (진행 상황 저장)
    const { data, error } = await supabase
      .from("QuizAttempt")
      .upsert({
        id,
        quizId,
        userId: user.id,
        userAnswers, // { "0": 1, "1": 2 } 형태의 JSONB
        score: score || 0,
        status: status || "in_progress",
        updatedAt: new Date().toISOString() // ⏰ 시간 갱신
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 진행 상황 저장 실패:", error);
      return NextResponse.json({ error: error.message, code: "UPSERT_ERROR" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attemptId: data.id,
      progress: data
    });

  } catch (error: any) {
    console.error("❌ API 서버 오류:", error);
    return NextResponse.json({ error: "서버 오류", details: error.message }, { status: 500 });
  }
}
