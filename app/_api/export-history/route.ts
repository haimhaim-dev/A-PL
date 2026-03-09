import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 내보내기 기록 조회 (퀴즈 정보 포함)
    const { data: exportHistory, error } = await supabase
      .from('exporthistory')
      .select(`
        id,
        user_id,
        quiz_id,
        exported_at,
        file_name,
        file_path,
        Quiz!inner(
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('exported_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('내보내기 기록 조회 실패:', error);
      return NextResponse.json({ error: "기록을 불러올 수 없습니다." }, { status: 500 });
    }

    // 전체 개수 조회
    const { count, error: countError } = await supabase
      .from('exporthistory')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('전체 개수 조회 실패:', countError);
    }

    return NextResponse.json({
      success: true,
      data: exportHistory || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('내보내기 기록 API 오류:', error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { quiz_id, file_name, file_path } = await request.json();

    if (!quiz_id || !file_name || !file_path) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('exporthistory')
      .insert({
        user_id: user.id,
        quiz_id,
        file_name,
        file_path
      })
      .select()
      .single();

    if (error) {
      console.error('내보내기 기록 저장 실패:', error);
      return NextResponse.json({ error: "기록 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('내보내기 기록 저장 API 오류:', error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}