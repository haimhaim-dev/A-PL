import { NextRequest, NextResponse } from "next/server";
import { validateFileOnServer, validatePageNumbers } from "@/lib/server-validation";
import {
  renderPDFPageToImage,
  renderPDFPagesToImages,
  getScaleForQuality
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
import { getCurrentUser, getUserPoints, deductPoints } from "@/lib/supabase/auth-helpers";
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

    // 5. FormData 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pageNumbersStr = formData.get("pageNumbers") as string | null;
    const quality = (formData.get("quality") as "low" | "medium" | "high") || "medium";
    const enhanceFormulas = formData.get("enhanceFormulas") !== "false";

    // 6. 파일 검증
    if (!file) {
      return NextResponse.json<OCRError>(
        { error: "파일이 제공되지 않았습니다.", code: "PDF_PROCESSING_ERROR" },
        { status: 400 }
      );
    }

    // 7. 서버 사이드 파일 검증 (보안 강화)
    const fileValidation = await validateFileOnServer(file);
    if (!fileValidation.valid) {
      return NextResponse.json<OCRError>(
        {
          error: fileValidation.error!,
          code: fileValidation.code || "PDF_PROCESSING_ERROR"
        },
        { status: 400 }
      );
    }

    // 8. PDF를 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // 9. 페이지 번호 검증
    const pageNumbers = pageNumbersStr ? JSON.parse(pageNumbersStr) : undefined;
    if (pageNumbers) {
      const pageValidation = validatePageNumbers(pageNumbers);
      if (!pageValidation.valid) {
        return NextResponse.json<OCRError>(
          {
            error: pageValidation.error!,
            code: "INVALID_PAGE_NUMBER"
          },
          { status: 400 }
        );
      }
    }

    // 10. 비용 계산
    const pageCount = pageNumbers ? pageNumbers.length : 1;
    const requiredPoints = calculateOCRCost(pageCount);

    // 11. 포인트 확인
    const userPoints = await getUserPoints(userId);
    if (userPoints.remaining_points < requiredPoints) {
      return NextResponse.json<OCRError>(
        {
          error: `포인트가 부족합니다. 현재 ${userPoints.remaining_points}P, 필요 ${requiredPoints}P`,
          code: "INSUFFICIENT_POINTS",
          requiredPoints,
          currentPoints: userPoints.remaining_points
        },
        { status: 402 }
      );
    }

    // 12. 이미지 품질 설정
    const scale = getScaleForQuality(quality);

    // 13. PDF 페이지를 이미지로 렌더링
    let pageImages;
    try {
      if (pageNumbers && Array.isArray(pageNumbers)) {
        pageImages = await renderPDFPagesToImages(pdfBuffer, pageNumbers, scale);
      } else {
        const firstPage = await renderPDFPageToImage(pdfBuffer, 1, scale);
        pageImages = [firstPage];
      }
    } catch (error) {
      console.error("PDF 페이지 렌더링 실패:", error);
      return NextResponse.json<OCRError>(
        {
          error: "PDF 페이지를 이미지로 변환하는데 실패했습니다.",
          code: "PAGE_RENDER_FAILED",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // 14. OCR 수행
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

    // 15. 포인트 차감 (Supabase 함수 호출 - 트랜잭션 보장)
    try {
      await deductPoints(
        userId,
        requiredPoints,
        "pdf_ocr",
        `PDF OCR 처리 (${pageCount}페이지)`,
        {
          fileName: file.name,
          pageCount,
          tokensUsed: totalTokensUsed,
          quality,
          enhanceFormulas,
          clientIP
        }
      );
    } catch (error) {
      console.error("포인트 차감 실패:", error);
      
      if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
        return NextResponse.json<OCRError>(
          {
            error: "포인트가 부족합니다.",
            code: "INSUFFICIENT_POINTS"
          },
          { status: 402 }
        );
      }
      
      return NextResponse.json<OCRError>(
        {
          error: "포인트 차감에 실패했습니다.",
          code: "UNKNOWN_ERROR"
        },
        { status: 500 }
      );
    }

    // 16. 성공 응답 (업데이트된 포인트 포함)
    const updatedPoints = await getUserPoints(userId);

    return NextResponse.json(
      {
        success: true,
        results: ocrResults,
        summary: {
          totalPages: ocrResults.length,
          totalTokensUsed,
          pointsUsed: requiredPoints,
          remainingPoints: updatedPoints.remaining_points,
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

    // 비용 계산
    const requiredPoints = calculateOCRCost(pageCount);
    const userPoints = await getUserPoints(user.id);
    const canProcess = userPoints.remaining_points >= requiredPoints;

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
        currentPoints: userPoints.remaining_points
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
