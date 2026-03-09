/**
 * OCR 및 이미지 처리 관련 타입 정의
 */

export interface OCRResult {
  text: string;
  containsLatex: boolean;
  confidence: number;
  pageNumber: number;
  processingTime: number;
  tokenUsed: number;
  metadata: OCRMetadata;
}

export interface OCRMetadata {
  model: string;
  temperature: number;
  timestamp: string;
  imageSize: {
    width: number;
    height: number;
  };
  hasFormulas: boolean;
  hasTables: boolean;
  hasCharts: boolean;
}

export interface PDFPageImage {
  pageNumber: number;
  imageBuffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

export interface OCRRequestOptions {
  pageNumbers?: number[]; // 특정 페이지만 처리 (미지정시 전체)
  quality?: "low" | "medium" | "high"; // 이미지 품질
  enhanceFormulas?: boolean; // 수식 인식 강화
  language?: "ko" | "en" | "mixed"; // 언어 설정
}

export interface OCRCostEstimate {
  totalPages: number;
  estimatedTokens: number;
  estimatedCost: number; // 포인트
  requiredPoints: number;
  canProcess: boolean;
}

export type OCRErrorCode =
  | "INSUFFICIENT_POINTS"
  | "PAGE_RENDER_FAILED"
  | "GEMINI_API_ERROR"
  | "INVALID_PAGE_NUMBER"
  | "PDF_PROCESSING_ERROR"
  | "IMAGE_CONVERSION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "AUTHENTICATION_REQUIRED"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE"
  | "EXTRACTION_FAILED"
  | "NO_TEXT_FOUND"
  | "PARSING_ERROR"
  | "UNKNOWN_ERROR";

export interface OCRError {
  error: string;
  code: OCRErrorCode;
  details?: string;
  requiredPoints?: number;
  currentPoints?: number;
}
