import { NextRequest, NextResponse } from "next/server";
import { createSession, createTemporaryUser } from "@/lib/auth";

// Route Segment Config (Next.js 14 App Router)
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // 항상 동적 렌더링

/**
 * 임시 세션 생성 API (개발용)
 * Supabase Auth 연동 전까지 사용
 * 
 * @method POST /api/auth/session
 */
export async function POST(request: NextRequest) {
  try {
    // 임시 사용자 생성
    const userId = createTemporaryUser();

    // 세션 생성
    const sessionId = createSession(userId);

    // 쿠키 설정
    const response = NextResponse.json(
      {
        success: true,
        userId,
        message: "임시 세션이 생성되었습니다."
      },
      { status: 200 }
    );

    // 세션 쿠키 설정 (HttpOnly, Secure)
    response.cookies.set("apl_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30일
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("세션 생성 에러:", error);
    return NextResponse.json(
      {
        error: "세션 생성에 실패했습니다.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * 세션 확인 API
 * 
 * @method GET /api/auth/session
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("apl_session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "세션이 없습니다."
        },
        { status: 401 }
      );
    }

    // 세션 검증 로직 (향후 구현)
    return NextResponse.json(
      {
        authenticated: true,
        sessionId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("세션 확인 에러:", error);
    return NextResponse.json(
      {
        error: "세션 확인에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
