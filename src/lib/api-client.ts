import type { PDFExtractResult, PDFExtractionError } from "@/types/pdf";
import type { OCRResult } from "@/types/ocr";
import { parseAPIError, parseNetworkError, retryWithBackoff, isAPIError, logError } from "@/lib/error-handler";
import type { APIError } from "@/types/error";

/**
 * API 클라이언트 유틸리티 (에러 핸들링 강화)
 */

interface PDFExtractOptions {
  maxChunkSize?: number;
  overlapSize?: number;
  preserveParagraphs?: boolean;
}

interface PDFOCROptions {
  quality?: "low" | "medium" | "high";
  enhanceFormulas?: boolean;
  pageNumbers?: number[];
}

/**
 * PDF 텍스트 추출 API 호출 (재시도 로직 포함)
 */
export async function extractPDFText(
  file: File,
  options: PDFExtractOptions = {}
): Promise<PDFExtractResult> {
  try {
    return await retryWithBackoff(async () => {
      const formData = new FormData();
      formData.append("file", file);

      // 옵션 추가
      if (options.maxChunkSize) {
        formData.append("maxChunkSize", options.maxChunkSize.toString());
      }
      if (options.overlapSize) {
        formData.append("overlapSize", options.overlapSize.toString());
      }
      if (options.preserveParagraphs !== undefined) {
        formData.append("preserveParagraphs", options.preserveParagraphs.toString());
      }

      const response = await fetch("/api/pdf-extract", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const apiError = await parseAPIError(response);
        logError(apiError, { fileName: file.name, api: "pdf-extract" });
        throw apiError;
      }

      const result: PDFExtractResult = await response.json();
      return result;
    }, {
      maxRetries: 2,
      retryableErrors: ["RATE_LIMIT_EXCEEDED", "TIMEOUT", "SERVER_ERROR"]
    });
  } catch (error) {
    if (isAPIError(error)) {
      throw error;
    }
    const apiError = parseNetworkError(error);
    logError(apiError, { fileName: file.name, api: "pdf-extract" });
    throw apiError;
  }
}

/**
 * PDF OCR API 호출 (재시도 로직 포함)
 * 인증 쿠키 자동 전송
 */
export async function extractPDFWithOCR(
  file: File,
  options: PDFOCROptions = {}
): Promise<{ results: OCRResult[]; summary: any }> {
  try {
    return await retryWithBackoff(async () => {
      const formData = new FormData();
      formData.append("file", file);

      if (options.quality) {
        formData.append("quality", options.quality);
      }
      if (options.enhanceFormulas !== undefined) {
        formData.append("enhanceFormulas", options.enhanceFormulas.toString());
      }
      if (options.pageNumbers) {
        formData.append("pageNumbers", JSON.stringify(options.pageNumbers));
      }

      const response = await fetch("/api/pdf-ocr", {
        method: "POST",
        body: formData,
        credentials: "include" // 쿠키 자동 전송
      });

      if (!response.ok) {
        const apiError = await parseAPIError(response);
        logError(apiError, { fileName: file.name, api: "pdf-ocr" });
        throw apiError;
      }

      return await response.json();
    }, {
      maxRetries: 2,
      retryableErrors: ["RATE_LIMIT_EXCEEDED", "TIMEOUT", "SERVER_ERROR"]
    });
  } catch (error) {
    if (isAPIError(error)) {
      throw error;
    }
    const apiError = parseNetworkError(error);
    logError(apiError, { fileName: file.name, api: "pdf-ocr" });
    throw apiError;
  }
}

/**
 * OCR 비용 예상 API 호출
 */
export async function estimateOCRCost(
  pageCount: number
): Promise<{ estimate: any; currentPoints: number }> {
  try {
    const response = await fetch(
      `/api/pdf-ocr?pageCount=${pageCount}`,
      { credentials: "include" } // 쿠키 자동 전송
    );

    if (!response.ok) {
      const apiError = await parseAPIError(response);
      throw apiError;
    }

    return await response.json();
  } catch (error) {
    if (isAPIError(error)) {
      throw error;
    }
    throw parseNetworkError(error);
  }
}

/**
 * API 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * 레거시 호환성을 위한 핸들러
 */
export function handleAPIError(error: unknown): string {
  return getErrorMessage(error);
}
