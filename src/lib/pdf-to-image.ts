/**
 * 서버 전용: 클라이언트가 렌더링한 PDF 페이지 이미지를 OCR용 형식으로 변환
 * - Canvas 제거: Vercel 등에서 node-canvas 네이티브 빌드 불필요
 * - 클라이언트는 pdf-to-image-client.ts (브라우저 Canvas)로 PDF → 이미지 변환 후 이 API로 전송
 */

import type { PDFPageImage } from "@/types/ocr";

/** 클라이언트가 보내는 페이지 이미지 payload */
export interface ClientPageImage {
  pageNumber: number;
  base64Image: string;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * 클라이언트에서 전달한 이미지 배열을 PDFPageImage[]로 변환 (Buffer 사용)
 */
export function clientImagesToPDFPageImages(
  pageImages: ClientPageImage[]
): PDFPageImage[] {
  return pageImages.map((img) => ({
    pageNumber: img.pageNumber,
    imageBuffer: Buffer.from(img.base64Image, "base64"),
    mimeType: img.mimeType,
    width: img.width,
    height: img.height
  }));
}

/**
 * 이미지 품질에 따른 scale 값 (클라이언트 참고용 / 메타데이터)
 */
export function getScaleForQuality(quality: "low" | "medium" | "high"): number {
  switch (quality) {
    case "low":
      return 1.0;
    case "medium":
      return 2.0;
    case "high":
      return 3.0;
    default:
      return 2.0;
  }
}
