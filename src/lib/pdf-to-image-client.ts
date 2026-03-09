/**
 * 클라이언트(브라우저)에서 PDF 페이지를 이미지로 변환
 * - pdfjs-dist 사용
 * - 압축 전송으로 비용 절감 (quality: 0.7)
 */

// 🔧 Polyfill: Promise.withResolvers (Node.js 20 / 구형 브라우저 호환성)
// ⚠️ 주의: import 문보다 먼저 실행되어야 합니다!
// pdfjs-dist 라이브러리가 로드될 때 Promise.withResolvers를 사용하기 때문입니다.
if (typeof Promise.withResolvers === "undefined") {
  (Promise as any).withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  console.log("✅ [Polyfill] Promise.withResolvers 추가됨 (클라이언트)");
}

import * as pdfjsLib from "pdfjs-dist";

// PDF.js 워커 설정 (로컬 워커 사용 - Vercel 배포 안전)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";
  console.log("✅ [PDF.js] 로컬 워커 설정 완료:", pdfjsLib.GlobalWorkerOptions.workerSrc);
}

export interface PDFPageImageData {
  pageNumber: number;
  base64Image: string; // base64 인코딩된 이미지 (JPEG, 압축)
  mimeType: string; // "image/jpeg"
  width: number;
  height: number;
  originalSize: number; // 압축 전 크기 (bytes)
  compressedSize: number; // 압축 후 크기 (bytes)
}

/**
 * PDF 페이지를 이미지(base64)로 변환
 * @param file PDF 파일
 * @param pageNumber 페이지 번호 (1부터 시작)
 * @param quality 이미지 압축 품질 (0.0 ~ 1.0, 기본 0.7)
 * @param scale 렌더링 스케일 (기본 2.0 - 고해상도)
 */
export async function renderPageToImage(
  file: File,
  pageNumber: number,
  quality: number = 0.7,
  scale: number = 2.0
): Promise<PDFPageImageData> {
  try {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 [PDF→Image] 페이지 ${pageNumber} 변환 시작`);
    console.log(`  - Quality: ${quality}`);
    console.log(`  - Scale: ${scale}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // 1단계: PDF 로드
    console.log(`📖 [Stage 1] PDF 파일 로드 중...`);
    const arrayBuffer = await file.arrayBuffer();
    console.log(`✅ [Stage 1] ArrayBuffer 생성 완료: ${arrayBuffer.byteLength} bytes`);
    
    console.log(`📖 [Stage 2] PDF Document 파싱 중...`);
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    console.log(`✅ [Stage 2] PDF Document 로드 완료: ${pdf.numPages} 페이지`);

    // 페이지 유효성 검사
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`);
    }

    // 2단계: 페이지 가져오기
    console.log(`📄 [Stage 3] 페이지 ${pageNumber} 가져오기...`);
    const page = await pdf.getPage(pageNumber);
    console.log(`✅ [Stage 3] 페이지 로드 완료`);
    
    console.log(`📐 [Stage 4] 뷰포트 계산 중...`);
    const viewport = page.getViewport({ scale });
    console.log(`✅ [Stage 4] 뷰포트: ${viewport.width}x${viewport.height}`);

    // 3단계: Canvas 생성 (강화된 에러 처리)
    console.log(`🖼️ [Stage 5] Canvas 생성 중...`);
    
    // Canvas 요소 생성
    const canvas = document.createElement("canvas");
    
    if (!canvas) {
      console.error(`❌ [Stage 5] Canvas 요소 생성 실패!`);
      throw new Error("Canvas 요소를 생성할 수 없습니다. (document.createElement 실패)");
    }
    
    // Canvas 크기 설정
    try {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
    } catch (err) {
      console.error(`❌ [Stage 5] Canvas 크기 설정 실패!`, err);
      throw new Error(`Canvas 크기를 설정할 수 없습니다: ${viewport.width}x${viewport.height}`);
    }
    
    console.log(`✅ [Stage 5] Canvas 생성 완료: ${canvas.width}x${canvas.height}`);
    
    // Context 가져오기 (강화된 검증)
    console.log(`🎨 [Stage 6] Canvas Context 가져오기...`);
    const context = canvas.getContext("2d", {
      willReadFrequently: false, // 성능 최적화
      alpha: false // JPEG는 투명도 불필요
    });

    if (!context) {
      console.error(`❌ [Stage 6] Canvas context 생성 실패!`);
      console.error(`  - Canvas: ${canvas}`);
      console.error(`  - Canvas.width: ${canvas.width}`);
      console.error(`  - Canvas.height: ${canvas.height}`);
      console.error(`  - document.createElement 지원 여부:`, typeof document.createElement === "function");
      throw new Error("Canvas 2D context를 생성할 수 없습니다. 브라우저가 Canvas를 지원하지 않거나 메모리 부족입니다.");
    }
    
    // Context 속성 확인
    if (typeof context.fillRect !== "function" || typeof context.drawImage !== "function") {
      console.error(`❌ [Stage 6] Context의 필수 메서드가 없습니다!`);
      throw new Error("Canvas context가 손상되었습니다.");
    }
    
    console.log(`✅ [Stage 6] Canvas Context 생성 완료 (Type: ${context.constructor.name})`);

    // 4단계: 페이지 렌더링 (renderContext 에러 방지)
    console.log(`🖌️ [Stage 7] 페이지 렌더링 중...`);
    console.log(`  - Context: ${context.constructor.name}`);
    console.log(`  - Viewport: ${viewport.width}x${viewport.height}`);
    
    try {
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      });
      
      // 렌더링 타임아웃 (30초)
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("렌더링 타임아웃 (30초 초과)")), 30000)
      );
      
      await Promise.race([renderTask.promise, timeout]);
      
      console.log(`✅ [Stage 7] 페이지 렌더링 완료`);
    } catch (renderError) {
      console.error(`❌ [Stage 7] 페이지 렌더링 실패!`);
      console.error(`  - 에러 타입:`, renderError instanceof Error ? renderError.constructor.name : typeof renderError);
      console.error(`  - 에러 메시지:`, renderError instanceof Error ? renderError.message : String(renderError));
      throw new Error(`페이지 렌더링 실패: ${renderError instanceof Error ? renderError.message : "Unknown"}`);
    }

    // 5단계: Canvas를 JPEG로 변환 (압축)
    console.log(`💾 [Stage 8] JPEG 변환 중... (quality: ${quality})`);
    
    let base64Image: string;
    try {
      base64Image = canvas.toDataURL("image/jpeg", quality);
      
      if (!base64Image || !base64Image.startsWith("data:image/jpeg")) {
        throw new Error("toDataURL이 유효한 JPEG를 생성하지 못했습니다");
      }
      
      console.log(`✅ [Stage 8] JPEG 변환 완료: ${base64Image.length} 글자`);
    } catch (toDataURLError) {
      console.error(`❌ [Stage 8] toDataURL 실패!`);
      console.error(`  - 에러:`, toDataURLError);
      throw new Error(`JPEG 변환 실패: ${toDataURLError instanceof Error ? toDataURLError.message : "Unknown"}`);
    }
    
    // Base64 데이터 크기 계산
    const compressedSize = Math.ceil((base64Image.length * 3) / 4); // base64 디코딩 후 크기
    const originalSize = Math.ceil(viewport.width * viewport.height * 4); // RGBA 픽셀 크기

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ [PDF→Image] 페이지 ${pageNumber} 변환 완료`);
    console.log(`  - 원본 크기: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`  - 압축 후: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(`  - 압축률: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    return {
      pageNumber,
      base64Image: base64Image.split(",")[1], // "data:image/jpeg;base64," 제거
      mimeType: "image/jpeg",
      width: viewport.width,
      height: viewport.height,
      originalSize,
      compressedSize
    };
  } catch (error) {
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`❌ [PDF→Image] 페이지 ${pageNumber} 변환 실패`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`에러 타입:`, error instanceof Error ? error.constructor.name : typeof error);
    console.error(`에러 메시지:`, error instanceof Error ? error.message : String(error));
    console.error(`스택:`, error instanceof Error ? error.stack : "없음");
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    throw new Error(
      `Failed to render PDF page ${pageNumber}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * PDF의 여러 페이지를 이미지로 변환
 * @param file PDF 파일
 * @param pageNumbers 변환할 페이지 번호 배열
 * @param quality 이미지 압축 품질 (0.0 ~ 1.0, 기본 0.7)
 * @param maxPages 최대 변환 페이지 수 (기본 15, AI 모델 제한)
 */
export async function renderPagesToImages(
  file: File,
  pageNumbers: number[],
  quality: number = 0.7,
  maxPages: number = 15
): Promise<PDFPageImageData[]> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🖼️ [PDF→Images] 다중 페이지 변환 시작");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // 최대 페이지 수 제한 (비용 절감)
  const limitedPageNumbers = pageNumbers.slice(0, maxPages);
  
  if (pageNumbers.length > maxPages) {
    console.warn(`⚠️ [Limit] 요청 페이지: ${pageNumbers.length}개 → 제한: ${maxPages}개`);
  }
  
  console.log(`📊 [Pages] 변환 대상: ${limitedPageNumbers.join(", ")}`);

  const results: PDFPageImageData[] = [];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (const pageNumber of limitedPageNumbers) {
    try {
      const pageImage = await renderPageToImage(file, pageNumber, quality);
      results.push(pageImage);
      
      totalOriginalSize += pageImage.originalSize;
      totalCompressedSize += pageImage.compressedSize;
    } catch (error) {
      console.error(`❌ [Skip] 페이지 ${pageNumber} 건너뜀:`, error);
      // 실패한 페이지는 건너뛰고 계속 진행
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ [PDF→Images] 변환 완료");
  console.log(`📊 [Summary]`);
  console.log(`  - 성공: ${results.length}/${limitedPageNumbers.length} 페이지`);
  console.log(`  - 원본 크기: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - 압축 후: ${(totalCompressedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - 절감: ${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return results;
}

/**
 * PDF 전체 페이지 수 확인
 */
export async function getPDFPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  return pdf.numPages;
}

/**
 * 비용 추정 (이미지 모드)
 * @param pageCount 페이지 수
 * @param costPerPage 페이지당 비용 (기본 10P)
 * @param maxPages 최대 페이지 (기본 15, AI 모델 제한)
 */
export function estimateImageModeCost(
  pageCount: number,
  costPerPage: number = 10,
  maxPages: number = 15
): { estimatedCost: number; actualPages: number; warning: string | null } {
  const actualPages = Math.min(pageCount, maxPages);
  const estimatedCost = actualPages * costPerPage;
  
  const warning =
    pageCount > maxPages
      ? `⚠️ AI 모델 제한으로 첫 ${maxPages}페이지만 처리됩니다. 파일을 나누어 올려주세요.`
      : null;

  return {
    estimatedCost,
    actualPages,
    warning
  };
}
