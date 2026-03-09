/**
 * Process API 관련 타입 정의
 * /api/quiz/process와 관련된 모든 인터페이스를 중앙 집중 관리
 */

export interface ProcessAPIResponse {
  success: boolean;
  refinedText: string;
  tableIds: string[]; // 빈 배열로 반환되므로 유지
  tablesMetadata: any[]; // 빈 배열로 반환되므로 any[]로 변경
  suitability: { term: number; concept: number; calc: number }; // 0으로 고정되지만 구조는 유지
  autoQuizMode: "TERM" | "CONCEPT" | "CALC" | "AUTO"; // AUTO 추가
  recommendedDocType: "LECTURE" | "TEXTBOOK" | "EXAM" | "AUTO"; // AUTO 추가
  pageCount: number;
  analysisResult?: AIAnalysisResult; // 분석 결과를 포함할 수 있도록 옵셔널 유지
}

export interface AIAnalysisResult {
  refinedText: string;
  summary: string; // 더 이상 서버에서 생성하지 않지만 클라이언트에서 사용될 수 있으므로 유지
  tableReferences: any[]; // 빈 배열로 반환되므로 any[]로 변경
  suitability: { term: number; concept: number; calc: number }; // 0으로 고정되지만 구조는 유지
  recommendedDocType: "LECTURE" | "TEXTBOOK" | "EXAM" | "AUTO"; // AUTO 추가
  autoQuizMode: "TERM" | "CONCEPT" | "CALC" | "AUTO"; // AUTO 추가
  pageCount: number;
}

export interface ProcessAPIError {
  error: string;
  details?: string;
}

export interface PDFParsingResult {
  pages: string[];
  fullText: string;
  pageCount: number;
  validation?: {
    isValid: boolean;
    reason: string;
    stats: {
      originalLength: number;
      cleanedLength: number;
      hasKorean: boolean;
      hasEnglish: boolean;
      hasNumbers: boolean;
      hasSymbols: boolean;
      lineCount: number;
    };
  };
}
