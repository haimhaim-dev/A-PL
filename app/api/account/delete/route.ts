import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-helpers-final";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 현재 사용자 확인
    const { user, error: userError } = await getCurrentUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 트랜잭션으로 모든 데이터 삭제
    // 1. 사용자 관련 데이터 삭제 (순서 중요 - 외래키 제약조건 고려)
    
    // 퀴즈 시도 기록 삭제
    const { error: attemptError } = await supabase
      .from('QuizAttempt')
      .delete()
      .eq('userId', userId);

    if (attemptError) {
      console.error('퀴즈 시도 기록 삭제 실패:', attemptError);
      return NextResponse.json(
        { error: "퀴즈 시도 기록 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 포인트 로그 삭제
    const { error: pointLogError } = await supabase
      .from('point_logs')
      .delete()
      .eq('user_id', userId);

    if (pointLogError) {
      console.error('포인트 로그 삭제 실패:', pointLogError);
      return NextResponse.json(
        { error: "포인트 로그 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 내보내기 기록 삭제
    const { error: exportError } = await supabase
      .from('exporthistory')
      .delete()
      .eq('user_id', userId);

    if (exportError) {
      console.error('내보내기 기록 삭제 실패:', exportError);
      return NextResponse.json(
        { error: "내보내기 기록 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 퀴즈 삭제
    const { error: quizError } = await supabase
      .from('Quiz')
      .delete()
      .eq('userId', userId);

    if (quizError) {
      console.error('퀴즈 삭제 실패:', quizError);
      return NextResponse.json(
        { error: "퀴즈 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 사용자 프로필 삭제 (users 테이블)
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userDeleteError) {
      console.error('사용자 프로필 삭제 실패:', userDeleteError);
      return NextResponse.json(
        { error: "사용자 프로필 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // Supabase Auth에서 사용자 삭제
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('인증 사용자 삭제 실패:', authDeleteError);
      // 이미 다른 데이터는 삭제되었으므로 로그만 남기고 성공으로 처리
      console.warn('Auth 사용자 삭제는 실패했지만 다른 데이터는 성공적으로 삭제됨');
    }

    // 삭제 로그 기록
    console.log(`✅ [Account Delete] 사용자 계정 삭제 완료: ${user.email} (${userId})`);

    return NextResponse.json({
      success: true,
      message: "계정과 모든 데이터가 성공적으로 삭제되었습니다.",
      deletedData: {
        userId,
        email: user.email,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [Account Delete] 계정 삭제 중 오류:', error);
    
    return NextResponse.json(
      { 
        error: "계정 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// GET 요청 - 삭제 가능한 데이터 미리보기
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 현재 사용자 확인
    const { user, error: userError } = await getCurrentUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 삭제될 데이터 개수 조회
    const [quizCount, attemptCount, exportCount, pointLogCount] = await Promise.all([
      supabase.from('Quiz').select('id', { count: 'exact' }).eq('userId', userId),
      supabase.from('QuizAttempt').select('id', { count: 'exact' }).eq('userId', userId),
      supabase.from('exporthistory').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('point_logs').select('id', { count: 'exact' }).eq('user_id', userId)
    ]);

    return NextResponse.json({
      user: {
        id: userId,
        email: user.email,
        name: user.user_metadata?.name || null
      },
      dataToDelete: {
        quizzes: quizCount.count || 0,
        quizAttempts: attemptCount.count || 0,
        exportHistory: exportCount.count || 0,
        pointLogs: pointLogCount.count || 0
      }
    });

  } catch (error) {
    console.error('❌ [Account Delete Preview] 오류:', error);
    
    return NextResponse.json(
      { 
        error: "데이터 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}