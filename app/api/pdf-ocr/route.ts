import { NextRequest, NextResponse } from "next/server";
import {
  clientImagesToPDFPageImages,
  type ClientPageImage
} from "@/lib/pdf-to-image";
import { extractTextFromImage, isGeminiAvailable } from "@/lib/gemini-client";
import { calculateOCRCost } from "@/lib/points-manager";
import {
  checkIPRateLimit,
  checkUserRateLimit,
  getClientIP,
  getRetryAfter,
  RATE_LIMITS
} from "@/lib/rate-limiter";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/utils/supabase/server";
import type { OCRResult, OCRError, OCRCostEstimate } from "@/types/ocr";

// Route Segment Config (Next.js 14 App Router)
export const runtime = "nodejs";
export const maxDuration = 60; // 60초 타임아웃 (OCR은 시간이 더 걸림)
export const dynamic = "force-dynamic"; // 항상 동적 렌더링

/**
 * PDF OCR API Route (Gemini 1.5 Flash Vision) - 보안 강화
 * 
 * @method POST /api/pdf-ocr
 * @requires 인증 (세션 쿠키)
 * @requires GEMINI_API_KEY 환경변수
 * @rateLimit IP: 3회/분, 사용자: 3회/분
 * @cost 페이지당 10 포인트
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting (IP 기반)
    const clientIP = getClientIP(request);
    const ipRateLimit = checkIPRateLimit(clientIP, RATE_LIMITS.pdfOCR);

    if (!ipRateLimit.allowed) {
      const retryAfter = getRetryAfter(ipRateLimit.resetAt);
      return NextResponse.json<OCRError>(
        {
          error: "현재 사용자가 많아 잠시 후 다시 시도해 주세요.",
          code: "RATE_LIMIT_EXCEEDED",
          details: `IP: ${clientIP}`
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": RATE_LIMITS.pdfOCR.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": ipRateLimit.resetAt.toString()
          }
        }
      );
    }

    // 2. 인증 확인 (Supabase Auth)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<OCRError>(
        {
          error: "인증이 필요합니다. 로그인해 주세요.",
          code: "GEMINI_API_ERROR"
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 3. Rate Limiting (사용자 기반)
    const userRateLimit = checkUserRateLimit(userId, RATE_LIMITS.pdfOCR);
    if (!userRateLimit.allowed) {
      const retryAfter = getRetryAfter(userRateLimit.resetAt);
      return NextResponse.json<OCRError>(
        {
          error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
          code: "RATE_LIMIT_EXCEEDED"
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": RATE_LIMITS.pdfOCR.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": userRateLimit.resetAt.toString()
          }
        }
      );
    }

    // 4. Gemini API 키 확인
    if (!isGeminiAvailable()) {
      return NextResponse.json<OCRError>(
        {
          error: "AI 서비스가 일시적으로 사용 불가능합니다.",
          code: "GEMINI_API_ERROR"
        },
        { status: 503 }
      );
    }

    // 5. FormData 파싱 (클라이언트가 브라우저에서 PDF→이미지 변환 후 전송)
    const formData = await request.formData();
    const pageImagesStr = formData.get("pageImages") as string | null;
    const fileName = (formData.get("fileName") as string) || "document.pdf";
    const quality = (formData.get("quality") as "low" | "medium" | "high") || "medium";
    const enhanceFormulas = formData.get("enhanceFormulas") !== "false";

    // 6. 페이지 이미지 payload 검증
    if (!pageImagesStr || typeof pageImagesStr !== "string") {
      return NextResponse.json<OCRError>(
        { error: "페이지 이미지가 제공되지 않았습니다.", code: "PDF_PROCESSING_ERROR" },
        { status: 400 }
      );
    }

    let clientImages: ClientPageImage[];
    try {
      const parsed = JSON.parse(pageImagesStr) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("pageImages must be a non-empty array");
      }
      const maxPages = 50;
      if (parsed.length > maxPages) {
        return NextResponse.json<OCRError>(
          {
            error: `최대 ${maxPages}페이지만 처리할 수 있습니다.`,
            code: "PDF_PROCESSING_ERROR"
          },
          { status: 400 }
        );
      }
      clientImages = parsed as ClientPageImage[];
      for (let i = 0; i < clientImages.length; i++) {
        const img = clientImages[i];
        if (
          typeof img.pageNumber !== "number" ||
          typeof img.base64Image !== "string" ||
          typeof img.mimeType !== "string" ||
          typeof img.width !== "number" ||
          typeof img.height !== "number"
        ) {
          throw new Error(`Invalid page image at index ${i}`);
        }
      }
    } catch (e) {
      console.error("pageImages 파싱 실패:", e);
      return NextResponse.json<OCRError>(
        {
          error: "페이지 이미지 형식이 올바르지 않습니다.",
          code: "PDF_PROCESSING_ERROR",
          details: e instanceof Error ? e.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    // 7. 비용 계산
    const pageCount = clientImages.length;
    const requiredPoints = calculateOCRCost(pageCount);

    // 8. 크레딧 사전 확인 (선택적 - UX 향상용)
    const supabase = createClient();
    const { data: userProfile } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (userProfile && userProfile.credits < requiredPoints) {
      return NextResponse.json<OCRError>(
        {
          error: `크레딧이 부족합니다. 현재 ${userProfile.credits}P, 필요 ${requiredPoints}P`,
          code: "INSUFFICIENT_POINTS",
          requiredPoints,
          currentPoints: userProfile.credits
        },
        { status: 402 }
      );
    }

    // 9. 클라이언트 이미지 → 서버 OCR용 형식 변환 (Canvas 없음)
    const pageImages = clientImagesToPDFPageImages(clientImages);

    // 10. OCR 수행
    const ocrResults: OCRResult[] = [];
    let totalTokensUsed = 0;

    for (const pageImage of pageImages) {
      try {
        const ocrResult = await extractTextFromImage(pageImage, enhanceFormulas);
        ocrResults.push(ocrResult);
        totalTokensUsed += ocrResult.tokenUsed;
      } catch (error) {
        console.error(`페이지 ${pageImage.pageNumber} OCR 실패:`, error);
        return NextResponse.json<OCRError>(
          {
            error: `페이지 ${pageImage.pageNumber}의 OCR 처리에 실패했습니다.`,
            code: "GEMINI_API_ERROR",
            details: error instanceof Error ? error.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    }

    // 15. ✅ 안전한 크레딧 차감 (원자적 트랜잭션)
    console.log("💰 [Credits] OCR 크레딧 차감 중...");
    const { data: creditResult, error: creditError } = await supabase.rpc('log_and_deduct_credits', {
      p_user_id: userId,
      p_amount: -requiredPoints, // 차감할 금액 (음수)
      p_description: `PDF OCR 처리 (${pageCount}페이지)`,
      p_quiz_id: null, // OCR은 퀴즈와 무관
      p_type: 'usage'
    });

    if (creditError) {
      console.error("❌ [Credits] OCR 차감 실패:", creditError.message);
      
      // 크레딧 부족 에러 처리
      if (creditError.message.includes('INSUFFICIENT_CREDITS') || 
          creditError.message.includes('크레딧이 부족')) {
        return NextResponse.json<OCRError>(
          {
            error: "크레딧이 부족합니다.",
            code: "INSUFFICIENT_POINTS"
          },
          { status: 402 }
        );
      }
      
      // 기타 에러
      return NextResponse.json<OCRError>(
        {
          error: "크레딧 처리 중 오류가 발생했습니다.",
          code: "UNKNOWN_ERROR"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        results: ocrResults,
        summary: {
          totalPages: ocrResults.length,
          totalTokensUsed,
          pointsUsed: requiredPoints,
          remainingPoints: creditResult?.remaining_credits || 0,
          averageProcessingTime:
            ocrResults.reduce((sum, r) => sum + r.processingTime, 0) /
            ocrResults.length
        }
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": userRateLimit.remaining.toString(),
          "X-RateLimit-Reset": userRateLimit.resetAt.toString()
        }
      }
    );
  } catch (error) {
    console.error("PDF OCR 에러:", error);
    return NextResponse.json<OCRError>(
      {
        error: "PDF OCR 처리 중 알 수 없는 오류가 발생했습니다.",
        code: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * OCR 비용 예상 API (GET)
 * @rateLimit 없음 (조회만)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<OCRError>(
        { error: "인증이 필요합니다.", code: "GEMINI_API_ERROR" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const pageCount = parseInt(searchParams.get("pageCount") || "1", 10);

    // 페이지 수 검증
    if (pageCount < 1 || pageCount > 100) {
      return NextResponse.json<OCRError>(
        { error: "페이지 수는 1~100 사이여야 합니다.", code: "PDF_PROCESSING_ERROR" },
        { status: 400 }
      );
    }

    // 비용 계산 및 크레딧 확인
    const requiredPoints = calculateOCRCost(pageCount);
    const supabase = createClient();
    const { data: userProfile } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    const canProcess = userProfile ? userProfile.credits >= requiredPoints : false;

    const estimate: OCRCostEstimate = {
      totalPages: pageCount,
      estimatedTokens: pageCount * 1000,
      estimatedCost: requiredPoints,
      requiredPoints,
      canProcess
    };

    return NextResponse.json(
      {
        estimate,
        currentPoints: userProfile?.credits || 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OCR 비용 예상 에러:", error);
    return NextResponse.json<OCRError>(
      {
        error: "비용 예상 중 오류가 발생했습니다.",
        code: "UNKNOWN_ERROR"
      },
      { status: 500 }
    );
  }
}
