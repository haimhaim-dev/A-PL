import { NextRequest, NextResponse } from "next/server";
import { processPDFBuffer } from "@/lib/pdf-processing";
import type { ProcessAPIResponse, ProcessAPIError } from "@/types/process-api";


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json<ProcessAPIError>({ error: "파일이 없습니다." }, { status: 400 });
    }

    console.log(`📄 [PDF 업로드] 파일명: ${file.name}, 크기: ${file.size} bytes`);
    console.log(`🔍 [파일 정보] 타입: ${file.type}, 마지막 수정: ${file.lastModified}`);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`📦 [버퍼 생성] 크기: ${buffer.length} bytes`);
    
    // PDF 파싱 실행
    console.log(`⚙️ [PDF 파싱 시작] processPDFBuffer 호출...`);
    const pdfResult = await processPDFBuffer(buffer);
    const { pages: rawPages, fullText, validation } = pdfResult;
    
    // 🚨 핵심 로그: 추출된 텍스트 길이
    console.log(`📏 [추출 엔진 결과] Extracted Text Length: ${fullText.length}`);
    console.log(`📄 [페이지별 길이] [${rawPages.map(p => p.length).join(', ')}]`);
    console.log(`🔤 [텍스트 샘플] "${fullText.substring(0, 200)}..."`);
    
    // 텍스트 유효성 검사
    if (validation && !validation.isValid) {
      console.error(`❌ [PDF 텍스트 무효] 파일: ${file.name}, 이유: ${validation.reason}`);
      console.error(`📊 [무효 통계]`, validation.stats);
      return NextResponse.json<ProcessAPIError>({ 
        error: `PDF에서 텍스트를 추출할 수 없습니다. (${validation.reason})`,
        details: `파일이 이미지 위주이거나 텍스트 레이어가 없는 PDF일 수 있습니다. 스캔된 문서의 경우 OCR 처리가 필요합니다.`
      }, { status: 400 });
    }
    
    console.log(`✅ [PDF 텍스트 추출 성공] 길이: ${fullText.length}자, 페이지: ${rawPages.length}개`);
    console.log(`📊 [추출 성공 통계]`, validation?.stats);

    // 🚨 핵심 로그: 클라이언트로 보내기 직전의 refinedText 길이
    console.log(`📤 [응답 준비] Sending refinedText length: ${fullText.length}`);

    return NextResponse.json<ProcessAPIResponse>({
      success: true,
      refinedText: fullText,
      tableIds: [],
      tablesMetadata: [],
      suitability: { term: 0, concept: 0, calc: 0 },
      autoQuizMode: "AUTO",
      recommendedDocType: "LECTURE",
      pageCount: rawPages.length
    });

  } catch (error: any) {
    console.error("❌ PDF 처리 오류:", error);
    return NextResponse.json<ProcessAPIError>({ 
      error: "PDF 처리 중 오류가 발생했습니다.", 
      details: error.message 
    }, { status: 500 });
  }
}
