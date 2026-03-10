/**
 * API 입력 검증 스키마 (Zod)
 * 보안 강화: 모든 외부 입력 검증
 */

import { z } from "zod";

/** 퀴즈 생성 API 요청 */
export const GenerateQuizSchema = z.object({
  pdfText: z.string().min(100, "PDF 텍스트가 너무 짧습니다.").max(50000, "PDF 텍스트가 너무 깁니다."),
  questionCount: z.coerce.number().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

/** 내보내기 기록 API 요청 */
export const ExportHistorySchema = z.object({
  quiz_id: z.string().min(1, "quiz_id가 필요합니다.").max(100),
  file_name: z.string().min(1, "file_name이 필요합니다.").max(255),
  file_path: z.string().min(1, "file_path가 필요합니다.").max(500),
});

/** 페이징 파라미터 */
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).max(100),
  limit: z.coerce.number().min(1).max(100),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizSchema>;
export type ExportHistoryInput = z.infer<typeof ExportHistorySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
