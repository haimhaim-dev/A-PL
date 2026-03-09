/**
 * 서버 사이드 입력 검증
 */

import type { PDFErrorCode } from "@/types/pdf";

/**
 * 파일 크기 제한
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 지원 MIME 타입
 */
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/x-pdf"
];

/**
 * 파일 매직 넘버 (PDF 시그니처)
 */
const PDF_MAGIC_NUMBER = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

/**
 * 서버 사이드 파일 검증 (보안 강화)
 */
export async function validateFileOnServer(
  file: File
): Promise<{ valid: boolean; error?: string; code?: PDFErrorCode }> {
  // 1. 파일 존재 확인
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: "파일이 비어있습니다.",
      code: "INVALID_FILE_TYPE"
    };
  }

  // 2. 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.`,
      code: "FILE_TOO_LARGE"
    };
  }

  // 3. MIME 타입 검증
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "PDF 파일만 업로드 가능합니다.",
      code: "INVALID_FILE_TYPE"
    };
  }

  // 4. 파일 매직 넘버 검증 (실제 파일 내용 확인)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PDF 시그니처 확인
    const header = buffer.subarray(0, 4);
    const isPDF = header.equals(PDF_MAGIC_NUMBER);

    if (!isPDF) {
      return {
        valid: false,
        error: "유효하지 않은 PDF 파일입니다.",
        code: "INVALID_FILE_TYPE"
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: "파일을 읽을 수 없습니다.",
      code: "INVALID_FILE_TYPE"
    };
  }

  // 5. 파일명 검증 (보안)
  if (hasUnsafeCharacters(file.name)) {
    return {
      valid: false,
      error: "파일명에 허용되지 않는 문자가 포함되어 있습니다.",
      code: "INVALID_FILE_TYPE"
    };
  }

  return { valid: true };
}

/**
 * 파일명에 위험한 문자 포함 여부 확인
 */
function hasUnsafeCharacters(filename: string): boolean {
  // 경로 탐색 방지
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return true;
  }

  // NULL 바이트 공격 방지
  if (filename.includes("\0")) {
    return true;
  }

  return false;
}

/**
 * 페이지 번호 배열 검증
 */
export function validatePageNumbers(
  pageNumbers: unknown,
  maxPages: number = 1000
): { valid: boolean; error?: string } {
  if (!Array.isArray(pageNumbers)) {
    return { valid: false, error: "페이지 번호는 배열이어야 합니다." };
  }

  if (pageNumbers.length === 0) {
    return { valid: false, error: "최소 1개의 페이지를 지정해야 합니다." };
  }

  if (pageNumbers.length > 100) {
    return { valid: false, error: "한 번에 최대 100페이지까지 처리 가능합니다." };
  }

  for (const page of pageNumbers) {
    if (typeof page !== "number" || page < 1 || page > maxPages) {
      return {
        valid: false,
        error: `유효하지 않은 페이지 번호: ${page}`
      };
    }
  }

  return { valid: true };
}

/**
 * 사용자 ID 검증 (형식 검사)
 */
export function validateUserId(userId: unknown): { valid: boolean; error?: string } {
  if (typeof userId !== "string") {
    return { valid: false, error: "사용자 ID는 문자열이어야 합니다." };
  }

  if (userId.length === 0 || userId.length > 100) {
    return { valid: false, error: "사용자 ID 길이가 유효하지 않습니다." };
  }

  // 기본적인 형식 검증 (영숫자, 언더스코어, 하이픈만 허용)
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return { valid: false, error: "사용자 ID 형식이 유효하지 않습니다." };
  }

  return { valid: true };
}

/**
 * 정수 범위 검증
 */
export function validateIntegerInRange(
  value: unknown,
  min: number,
  max: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { valid: false, error: `${fieldName}는 정수여야 합니다.` };
  }

  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName}는 ${min}에서 ${max} 사이여야 합니다.`
    };
  }

  return { valid: true };
}
