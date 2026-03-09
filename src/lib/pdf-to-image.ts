// 🔧 Polyfill: Promise.withResolvers (Node.js 20 호환성)
if (typeof Promise.withResolvers === "undefined") {
  (Promise as any).withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import * as pdfjsLib from "pdfjs-dist";
import { createCanvas } from "canvas";
import sharp from "sharp";
import type { PDFPageImage } from "@/types/ocr";

// PDF.js 워커 설정 (서버 사이드)
if (typeof window === "undefined") {
  // Node.js 환경에서는 워커 경로 설정 필요 없음
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * PDF 페이지를 이미지로 렌더링
 */
export async function renderPDFPageToImage(
  pdfBuffer: Buffer,
  pageNumber: number,
  scale: number = 2.0 // 해상도 (높을수록 선명, 기본 2배)
): Promise<PDFPageImage> {
  try {
    // PDF 로드 (legacy 빌드 사용)
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      isEvalSupported: false // Node.js 호환성
    });

    const pdfDocument = await loadingTask.promise;

    // 페이지 번호 유효성 검사
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(
        `Invalid page number: ${pageNumber}. PDF has ${pdfDocument.numPages} pages.`
      );
    }

    // 페이지 가져오기
    const page = await pdfDocument.getPage(pageNumber);

    // 뷰포트 설정
    const viewport = page.getViewport({ scale });

    // Canvas 생성
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    // 렌더링
    await page.render({
      canvasContext: context as any,
      viewport: viewport
    }).promise;

    // Canvas를 PNG Buffer로 변환
    const imageBuffer = canvas.toBuffer("image/png");

    // Sharp로 이미지 최적화 및 품질 향상
    const optimizedBuffer = await sharp(imageBuffer)
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();

    return {
      pageNumber,
      imageBuffer: optimizedBuffer,
      mimeType: "image/png",
      width: viewport.width,
      height: viewport.height
    };
  } catch (error) {
    console.error(`PDF 페이지 ${pageNumber} 렌더링 실패:`, error);
    throw new Error(
      `Failed to render PDF page ${pageNumber}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * PDF의 여러 페이지를 한 번에 이미지로 렌더링
 */
export async function renderPDFPagesToImages(
  pdfBuffer: Buffer,
  pageNumbers: number[],
  scale: number = 2.0
): Promise<PDFPageImage[]> {
  const results: PDFPageImage[] = [];

  for (const pageNumber of pageNumbers) {
    try {
      const pageImage = await renderPDFPageToImage(pdfBuffer, pageNumber, scale);
      results.push(pageImage);
    } catch (error) {
      console.error(`페이지 ${pageNumber} 처리 실패:`, error);
      // 실패한 페이지는 건너뛰고 계속 진행
    }
  }

  return results;
}

/**
 * PDF의 모든 페이지를 이미지로 렌더링
 */
export async function renderAllPDFPages(
  pdfBuffer: Buffer,
  scale: number = 2.0
): Promise<PDFPageImage[]> {
  // 페이지 수 확인
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer)
  });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  // 모든 페이지 번호 배열 생성
  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return renderPDFPagesToImages(pdfBuffer, pageNumbers, scale);
}

/**
 * 이미지 품질에 따른 scale 값 반환
 */
export function getScaleForQuality(quality: "low" | "medium" | "high"): number {
  switch (quality) {
    case "low":
      return 1.0; // 원본 크기
    case "medium":
      return 2.0; // 2배 (기본)
    case "high":
      return 3.0; // 3배 (고품질, 처리 시간 증가)
    default:
      return 2.0;
  }
}
