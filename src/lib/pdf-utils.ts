import type { ChunkingOptions, PDFChunk } from "@/types/pdf";

/**
 * 텍스트를 청크로 분할하는 유틸리티 함수
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {
    maxChunkSize: 4000,
    overlapSize: 200,
    preserveParagraphs: true
  }
): PDFChunk[] {
  const { maxChunkSize, overlapSize, preserveParagraphs } = options;
  const chunks: PDFChunk[] = [];

  // 텍스트가 없으면 빈 배열 반환
  if (!text || text.trim().length === 0) {
    return chunks;
  }

  // 텍스트를 정규화 (연속된 공백 제거, 줄바꿈 정리)
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 문단 단위로 분할 (preserveParagraphs가 true인 경우)
  if (preserveParagraphs) {
    return chunkByParagraphs(normalizedText, maxChunkSize, overlapSize);
  }

  // 단순 크기 기반 분할
  return chunkBySize(normalizedText, maxChunkSize, overlapSize);
}

/**
 * 문단 구조를 유지하면서 청크로 분할
 */
function chunkByParagraphs(
  text: string,
  maxChunkSize: number,
  overlapSize: number
): PDFChunk[] {
  const chunks: PDFChunk[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";
  let currentStartPosition = 0;
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();

    if (!paragraph) continue;

    // 현재 청크에 문단을 추가했을 때의 크기
    const potentialChunkSize =
      currentChunk.length + paragraph.length + (currentChunk ? 2 : 0);

    // 문단 하나가 maxChunkSize를 초과하는 경우
    if (paragraph.length > maxChunkSize) {
      // 현재 청크가 있으면 먼저 저장
      if (currentChunk) {
        chunks.push(createChunk(currentChunk, chunkIndex++, currentStartPosition));
        currentStartPosition += currentChunk.length;
        currentChunk = "";
      }

      // 긴 문단을 문장 단위로 분할
      const sentences = splitIntoSentences(paragraph);
      let sentenceBuffer = "";

      for (const sentence of sentences) {
        if (sentenceBuffer.length + sentence.length > maxChunkSize) {
          if (sentenceBuffer) {
            chunks.push(
              createChunk(sentenceBuffer, chunkIndex++, currentStartPosition)
            );
            currentStartPosition += sentenceBuffer.length;
          }
          sentenceBuffer = sentence;
        } else {
          sentenceBuffer += (sentenceBuffer ? " " : "") + sentence;
        }
      }

      if (sentenceBuffer) {
        currentChunk = sentenceBuffer;
      }
    }
    // 청크 크기를 초과하는 경우
    else if (potentialChunkSize > maxChunkSize) {
      // 현재 청크 저장
      chunks.push(createChunk(currentChunk, chunkIndex++, currentStartPosition));
      currentStartPosition += currentChunk.length;

      // 오버랩 적용: 이전 청크의 마지막 부분을 포함
      if (overlapSize > 0 && currentChunk.length > overlapSize) {
        const overlapText = currentChunk.slice(-overlapSize);
        currentChunk = overlapText + "\n\n" + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
    // 현재 청크에 문단 추가
    else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // 마지막 청크 저장
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk, chunkIndex, currentStartPosition));
  }

  return chunks;
}

/**
 * 단순 크기 기반 청크 분할
 */
function chunkBySize(
  text: string,
  maxChunkSize: number,
  overlapSize: number
): PDFChunk[] {
  const chunks: PDFChunk[] = [];
  let startPosition = 0;
  let chunkIndex = 0;

  while (startPosition < text.length) {
    const endPosition = Math.min(startPosition + maxChunkSize, text.length);
    const chunkContent = text.slice(startPosition, endPosition);

    chunks.push(createChunk(chunkContent, chunkIndex++, startPosition));

    // 오버랩을 적용한 다음 시작 위치
    startPosition = endPosition - overlapSize;

    // 무한 루프 방지
    if (startPosition >= text.length - overlapSize) {
      break;
    }
  }

  return chunks;
}

/**
 * 문단을 문장으로 분할
 */
function splitIntoSentences(text: string): string[] {
  // 한국어와 영어 문장 분리
  // 마침표, 물음표, 느낌표 뒤에 공백이 오는 경우를 기준으로 분리
  const sentences = text
    .split(/([.!?])\s+/)
    .reduce<string[]>((acc, part, index, array) => {
      if (index % 2 === 0) {
        const sentence = part + (array[index + 1] || "");
        if (sentence.trim()) {
          acc.push(sentence.trim());
        }
      }
      return acc;
    }, []);

  return sentences.length > 0 ? sentences : [text];
}

/**
 * PDFChunk 객체 생성 헬퍼
 */
function createChunk(
  content: string,
  index: number,
  startPosition: number
): PDFChunk {
  const trimmedContent = content.trim();
  return {
    index,
    content: trimmedContent,
    characterCount: trimmedContent.length,
    startPosition,
    endPosition: startPosition + trimmedContent.length
  };
}

/**
 * 텍스트 통계 계산
 */
export function getTextStatistics(text: string) {
  const lines = text.split("\n").length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim()).length;

  return {
    lines,
    words,
    characters,
    paragraphs
  };
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * PDF 파일 유효성 검사
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  // 파일 타입 검사
  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "PDF 파일만 업로드 가능합니다."
    };
  }

  // 파일 크기 검사 (10MB 제한)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${formatFileSize(MAX_SIZE)} 이하여야 합니다.`
    };
  }

  // 파일 이름 검사
  if (!file.name || file.name.trim() === "") {
    return {
      valid: false,
      error: "유효하지 않은 파일 이름입니다."
    };
  }

  return { valid: true };
}
