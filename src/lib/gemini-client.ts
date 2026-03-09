import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OCRResult, PDFPageImage } from "@/types/ocr";

/**
 * Gemini API 클라이언트
 */

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

/**
 * Gemini 1.5 Flash Vision으로 이미지에서 텍스트 추출 (OCR)
 * 특히 수식(LaTeX)과 특수문자 추출에 최적화
 */
export async function extractTextFromImage(
  pageImage: PDFPageImage,
  enhanceFormulas: boolean = true
): Promise<OCRResult> {
  const startTime = Date.now();
  // 🔧 Gemini 3 Flash Preview 모델 사용 (Vision 지원, 최신 모델)
  const modelId = process.env.GEMINI_MODEL_ID || "gemini-3-flash-preview";

  try {
    const model = genAI.getGenerativeModel({
      model: modelId
    });

    // 이미지를 base64로 인코딩
    const base64Image = pageImage.imageBuffer.toString("base64");

    // 시스템 프롬프트 (수식 및 특수문자 처리 강화)
    const prompt = buildOCRPrompt(enhanceFormulas);

    // Gemini API 호출
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: pageImage.mimeType,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // 토큰 사용량 (대략적인 추정)
    const tokenUsed = Math.ceil((text.length + prompt.length) / 4);

    // LaTeX 포함 여부 확인
    const containsLatex = detectLatex(text);

    // 처리 시간 계산
    const processingTime = Date.now() - startTime;

    return {
      text,
      containsLatex,
      confidence: 0.95, // Gemini는 신뢰도 점수를 직접 제공하지 않음
      pageNumber: pageImage.pageNumber,
      processingTime,
      tokenUsed,
      metadata: {
        model: modelId,
        temperature: 0.1,
        timestamp: new Date().toISOString(),
        imageSize: {
          width: pageImage.width,
          height: pageImage.height
        },
        hasFormulas: containsLatex,
        hasTables: detectTables(text),
        hasCharts: detectCharts(text)
      }
    };
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [Gemini Model Error - OCR] API 호출 실패");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("모델명:", modelId);
    console.error("페이지 번호:", pageImage.pageNumber);
    console.error("이미지 크기:", pageImage.width, "x", pageImage.height);
    console.error("에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    throw new Error(
      `Gemini API 호출 실패: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * OCR 프롬프트 생성
 * 수식과 특수문자를 LaTeX 형태로 추출하도록 지시
 */
function buildOCRPrompt(enhanceFormulas: boolean): string {
  let prompt = `당신은 학술 문서(강의 자료, 교재)에서 텍스트를 정확하게 추출하는 전문가입니다.

다음 이미지에서 모든 텍스트를 추출해주세요.

중요한 지침:
1. **수식 처리**: 모든 수학 공식과 수식은 LaTeX 형태로 변환하세요.
   - 인라인 수식: \\( ... \\) 형태 사용
   - 디스플레이 수식: \\[ ... \\] 형태 사용
   - 예시: "x의 제곱"은 \\(x^2\\)로, "알파 더하기 베타"는 \\(\\alpha + \\beta\\)로

2. **특수문자 보존**: 그리스 문자, 화살표, 논리 기호 등은 LaTeX로 정확히 표현
   - α → \\alpha, β → \\beta, → → \\rightarrow, ∈ → \\in 등

3. **표 구조**: 표가 있으면 Markdown 표 형식으로 변환

4. **한글/영문 혼용**: 한글과 영문을 정확히 인식하고 구분

5. **레이아웃 보존**: 원본의 문단 구조, 제목 계층을 최대한 유지`;

  if (enhanceFormulas) {
    prompt += `

6. **수식 인식 강화 모드**: 
   - 복잡한 수식도 놓치지 말고 정확히 LaTeX로 변환
   - 분수, 적분, 극한, 행렬 등 모든 수학 표현 포함
   - 첨자(subscript/superscript)를 정확히 표현`;
  }

  prompt += `

추출된 텍스트만 반환하고, 추가 설명이나 주석은 넣지 마세요.`;

  return prompt;
}

/**
 * 텍스트에 LaTeX 수식이 포함되어 있는지 검사
 */
function detectLatex(text: string): boolean {
  const latexPatterns = [
    /\\\(.*?\\\)/s, // 인라인 수식
    /\\\[.*?\\\]/s, // 디스플레이 수식
    /\\[a-zA-Z]+\{/g, // LaTeX 명령어
    /\\alpha|\\beta|\\gamma|\\delta/g, // 그리스 문자
    /\^|_|\{|\}/g // 첨자 및 중괄호 (수식에서 자주 사용)
  ];

  return latexPatterns.some((pattern) => pattern.test(text));
}

/**
 * 텍스트에 표가 포함되어 있는지 검사
 */
function detectTables(text: string): boolean {
  // Markdown 표 형식 또는 파이프(|) 기반 구조 감지
  const tablePattern = /\|.*?\|.*?\|/g;
  const matches = text.match(tablePattern);
  return matches !== null && matches.length >= 2;
}

/**
 * 텍스트에 차트/그래프 설명이 포함되어 있는지 검사
 */
function detectCharts(text: string): boolean {
  const chartKeywords = [
    "그래프",
    "차트",
    "도표",
    "그림",
    "figure",
    "chart",
    "graph",
    "plot"
  ];

  const lowerText = text.toLowerCase();
  return chartKeywords.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Gemini API 사용 가능 여부 확인
 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0;
}
