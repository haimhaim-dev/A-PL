import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf-parse";
import { chunkText, getTextStatistics } from "@/lib/pdf-utils";
import { validateFileOnServer } from "@/lib/server-validation";
import {
  checkIPRateLimit,
  checkUserRateLimit,
  getClientIP,
  getRetryAfter,
  RATE_LIMITS
} from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth";
import type { PDFExtractResult, PDFExtractionError } from "@/types/pdf";

// Route Segment Config (Next.js 14 App Router)
export const runtime = "nodejs";
export const maxDuration = 30; // 30초 타임아웃
export const dynamic = "force-dynamic"; // 항상 동적 렌더링

/**
 * PDF 텍스트 추출 API Route - 보안 강화
 * 
 * @method POST /api/pdf-extract
 * @requires 인증 (세션 쿠키) - 선택적 (무료 기능)
 * @rateLimit IP: 5회/분
 * @cost 무료
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting (IP 기반 - 무료 기능이므로 사용자 기반은 선택)
    const clientIP = getClientIP(request);
    const ipRateLimit = checkIPRateLimit(clientIP, RATE_LIMITS.pdfExtract);

    if (!ipRateLimit.allowed) {
      const retryAfter = getRetryAfter(ipRateLimit.resetAt);
      return NextResponse.json<PDFExtractionError>(
        {
          error: "현재 사용자가 많아 잠시 후 다시 시도해 주세요.",
          code: "EXTRACTION_FAILED",
          details: `Rate limit exceeded for IP: ${clientIP}`
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": RATE_LIMITS.pdfExtract.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": ipRateLimit.resetAt.toString()
          }
        }
      );
    }

    // 2. FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json<PDFExtractionError>(
        {
          error: "파일이 제공되지 않았습니다.",
          code: "INVALID_FILE_TYPE"
        },
        { status: 400 }
      );
    }

    // 3. 서버 사이드 파일 검증 (보안 강화)
    const validation = await validateFileOnServer(file);
    if (!validation.valid) {
      return NextResponse.json<PDFExtractionError>(
        {
          error: validation.error!,
          code: validation.code || "INVALID_FILE_TYPE"
        },
        { status: 400 }
      );
    }

    // 4. 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. PDF 파싱 및 텍스트 추출
    let pdfData;
    try {
      pdfData = await PDFParser(buffer, {
        max: 0,
        version: "default"
      });
    } catch (parseError) {
      console.error("PDF 파싱 에러:", parseError);
      return NextResponse.json<PDFExtractionError>(
        {
          error: "PDF 파일을 파싱하는 중 오류가 발생했습니다.",
          code: "PARSING_ERROR",
          details: parseError instanceof Error ? parseError.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // 6. 추출된 텍스트 확인
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json<PDFExtractionError>(
        {
          error: "PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF이거나 보호된 파일일 수 있습니다.",
          code: "NO_TEXT_FOUND"
        },
        { status: 400 }
      );
    }

    // 7. 청킹 옵션 (검증 추가)
    const maxChunkSize = Math.min(
      Math.max(parseInt(formData.get("maxChunkSize") as string) || 4000, 1000),
      10000
    );
    const overlapSize = Math.min(
      Math.max(parseInt(formData.get("overlapSize") as string) || 200, 0),
      1000
    );
    const preserveParagraphs = formData.get("preserveParagraphs") !== "false";

    // 8. 텍스트를 청크로 분할
    const chunks = chunkText(extractedText, {
      maxChunkSize,
      overlapSize,
      preserveParagraphs
    });

    // 9. 텍스트 통계 계산
    const statistics = getTextStatistics(extractedText);

    // 10. 결과 반환
    const result: PDFExtractResult = {
      text: extractedText,
      chunks: chunks.map((chunk) => chunk.content),
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        pageCount: pdfData.numpages,
        totalCharacters: statistics.characters,
        chunkCount: chunks.length,
        extractedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": ipRateLimit.remaining.toString(),
        "X-RateLimit-Reset": ipRateLimit.resetAt.toString()
      }
    });
  } catch (error) {
    console.error("PDF 추출 에러:", error);

    return NextResponse.json<PDFExtractionError>(
      {
        error: "PDF 텍스트 추출 중 알 수 없는 오류가 발생했습니다.",
        code: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
