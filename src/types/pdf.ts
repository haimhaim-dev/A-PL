/**
 * PDF 처리 관련 타입 정의
 */

export interface PDFExtractResult {
  text: string;
  chunks: string[];
  metadata: PDFMetadata;
}

export interface PDFMetadata {
  fileName: string;
  fileSize: number;
  pageCount: number;
  totalCharacters: number;
  chunkCount: number;
  extractedAt: string;
}

export interface PDFChunk {
  index: number;
  content: string;
  characterCount: number;
  startPosition: number;
  endPosition: number;
}

export interface PDFExtractionError {
  error: string;
  code: PDFErrorCode;
  details?: string;
}

export type PDFErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE"
  | "EXTRACTION_FAILED"
  | "NO_TEXT_FOUND"
  | "PARSING_ERROR"
  | "UNKNOWN_ERROR";

export interface ChunkingOptions {
  maxChunkSize: number; // 최대 청크 크기 (문자 수)
  overlapSize: number; // 청크 간 오버랩 크기 (문자 수)
  preserveParagraphs: boolean; // 문단 구조 유지 여부
}

// 이 타입들은 src/types/process-api.ts로 이동됨
// export type DocumentType = "LECTURE" | "TEXTBOOK" | "EXAM";
// export type ChunkClassification = "KEEP" | "SUMMARY" | "DISCARD";
// export interface ChunkAnalysis { ... }
