import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PaginationSchema } from "@/lib/api-validation";
import { checkIPRateLimit, getClientIP, getRetryAfter } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const ipLimit = checkIPRateLimit(getClientIP(request), { windowMs: 60000, maxRequests: 30 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다." },
        { status: 429, headers: { "Retry-After": getRetryAfter(ipLimit.resetAt).toString() } }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const parseResult = PaginationSchema.safeParse({
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "50",
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "잘못된 페이지네이션 파라미터입니다." }, { status: 400 });
    }

    const { page, limit } = parseResult.data;
    const offset = (page - 1) * limit;

    // 기본 쿼리 구성
    let query = supabase
      .from('point_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 타입 필터 적용
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    // 페이지네이션 적용
    const { data: pointLogs, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('포인트 로그 조회 실패:', error);
      return NextResponse.json({ error: "내역을 불러올 수 없습니다." }, { status: 500 });
    }

    // 전체 개수 조회
    let countQuery = supabase
      .from('point_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (type !== 'all') {
      countQuery = countQuery.eq('type', type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('전체 개수 조회 실패:', countError);
    }

    return NextResponse.json({
      success: true,
      data: pointLogs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('포인트 로그 API 오류:', error);
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

    const { amount, type, description } = await request.json();

    if (!amount || !type || !description) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    if (!['charge', 'usage'].includes(type)) {
      return NextResponse.json({ error: "유효하지 않은 타입입니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('point_logs')
      .insert({
        user_id: user.id,
        amount,
        type,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('포인트 로그 저장 실패:', error);
      return NextResponse.json({ error: "기록 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('포인트 로그 저장 API 오류:', error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}