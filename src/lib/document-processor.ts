/**
 * 에이쁠(A-Pl) 문서 처리 및 청크 스코어링 엔진
 * STEM 분야 강의자료, 교재, 시험지 특성에 맞춘 청크 분류 로직
 */

// import type { DocumentType, ChunkClassification, ChunkAnalysis } from "@/types/process-api";

// 임시 타입 정의 (필요시 process-api.ts로 이동)
type DocumentType = "LECTURE" | "TEXTBOOK" | "EXAM" | "AUTO";
type ChunkClassification = "heading" | "content" | "example" | "formula" | "table" | "DISCARD" | "KEEP" | "SUMMARY";
type ChunkAnalysis = {
  type: ChunkClassification;
  importance: number;
  content: string;
};

export interface ProcessorWeights {
  heading: number;
  definition: number;
  math: number;
  table: number;
  example: number;
  keepThreshold: number;
}

/**
 * 1. 문서 유형별 가중치 및 임계값 설정 (STEM 대응)
 */
export const DOCUMENT_PRESETS: Record<DocumentType, ProcessorWeights> = {
  LECTURE: {
    heading: 0.35,
    definition: 0.25,
    math: 0.15,
    table: 0.15,
    example: 0.10,
    keepThreshold: 0.65,
  },
  TEXTBOOK: {
    heading: 0.25,
    definition: 0.3,
    math: 0.25,
    table: 0.1,
    example: 0.1,
    keepThreshold: 0.75,
  },
  EXAM: {
    heading: 0.2,
    definition: 0.2,
    math: 0.25,
    table: 0.2,
    example: 0.15,
    keepThreshold: 0.6,
  },
  AUTO: {
    heading: 0.3,
    definition: 0.25,
    math: 0.2,
    table: 0.15,
    example: 0.1,
    keepThreshold: 0.7,
  },
};

/**
 * 2. 정규식 패턴 (오탐 방지 및 STEM 특화)
 */
export const PATTERNS = {
  // Definition: 정의 관련 키워드 (단독 '는' 제거로 오탐 방지)
  DEFINITION: /(정의|이란|이라 한다|means|is defined as|refers to)/g,

  // Math: 수식 기호 및 단위 포함 수치 (kg, m, s, %, USD, 원 등)
  MATH: /[0-9]+\s*(kg|m|s|%|USD|원)|[\+\-\*\/=<>∑∫√πθλαβγδε]/g,

  // Heading: 대문자로 시작하는 긴 제목
  HEADING: /^[A-Z][A-Z\s]{4,}$/gm,

  // Example: 예시 관련 키워드
  EXAMPLE: /(예시|예를 들어|example|e\.g\.)/gi,

  // Table: 표 형식 탐지 (Flag 방식용)
  TABLE: /(table|표\s*[0-9]+|\|\s*---)/gi,

  // Formula: 복잡한 수식 패턴 (Flag 방식용)
  FORMULA: /[\^_{}\[\]\\]/g,
};

/**
 * 3. 청크 스코어링 및 분류 로직
 * @param text 청크 텍스트 내용
 * @param type 문서 유형 (LECTURE, TEXTBOOK, EXAM)
 */
export function calculateChunkScore(text: string, type: DocumentType = "LECTURE") {
  const weights = DOCUMENT_PRESETS[type];
  const normalizationFactor = Math.log(text.length + 10);

  // --- Count-based Scoring (Normalised by length) ---
  
  // Heading 탐지 및 스코어링
  const headingMatches = text.match(PATTERNS.HEADING) || [];
  const headingScore = (headingMatches.length / normalizationFactor) * weights.heading;

  // Definition 탐지 및 스코어링
  const definitionMatches = text.match(PATTERNS.DEFINITION) || [];
  const definitionScore = (definitionMatches.length / normalizationFactor) * weights.definition;

  // Example 탐지 및 스코어링
  const exampleMatches = text.match(PATTERNS.EXAMPLE) || [];
  const exampleScore = (exampleMatches.length / normalizationFactor) * weights.example;

  // --- Flag-based Scoring (Immediate weight if found) ---

  // Math/Formula 탐지 (Flag 방식)
  const hasMath = PATTERNS.MATH.test(text) || PATTERNS.FORMULA.test(text);
  const mathScore = hasMath ? weights.math : 0;

  // Table 탐지 (Flag 방식)
  const hasTable = PATTERNS.TABLE.test(text);
  const tableScore = hasTable ? weights.table : 0;

  // 정규식 lastIndex 초기화 (test/g 사용 시 필수)
  PATTERNS.MATH.lastIndex = 0;
  PATTERNS.FORMULA.lastIndex = 0;
  PATTERNS.TABLE.lastIndex = 0;

  // 최종 합계 계산
  const totalScore = headingScore + definitionScore + exampleScore + mathScore + tableScore;

  // suitability 지표 계산 (AI 자동 모드 참고용)
  const suitability = {
    term: definitionScore,
    concept: headingScore + exampleScore,
    calc: mathScore + tableScore,
  };

  // 4. 분류 기준 적용
  let classification: ChunkClassification = "DISCARD";
  
  if (totalScore >= weights.keepThreshold) {
    classification = "KEEP";
  } else if (totalScore >= weights.keepThreshold * 0.6) {
    classification = "SUMMARY";
  }

  return {
    score: totalScore,
    classification,
    thresholds: {
      keep: weights.keepThreshold,
      summary: weights.keepThreshold * 0.6,
    },
    details: {
      heading: headingScore,
      definition: definitionScore,
      math: mathScore,
      table: tableScore,
      example: exampleScore,
    },
    suitability,
  };
}

/**
 * 문서 전체의 청크들을 처리하여 필터링된 결과 반환
 */
export function processDocumentChunks(chunks: string[], type: DocumentType) {
  return chunks.map((content, index) => {
    const analysis = calculateChunkScore(content, type);
    return {
      index,
      content,
      ...analysis,
    };
  });
}

/**
 * 5. 지능형 문서 분류: 전체 텍스트를 분석하여 가장 적합한 DocumentType 추천
 */
export function recommendDocumentType(text: string): DocumentType {
  const scores = (Object.keys(DOCUMENT_PRESETS) as DocumentType[]).map((type) => {
    const analysis = calculateChunkScore(text, type);
    return { type, score: analysis.score };
  });

  // 점수가 가장 높은 프리셋 반환
  return scores.sort((a, b) => b.score - a.score)[0].type;
}

/**
 * 6. 시스템 프롬프트 생성
 */
export function generateSystemInstruction(params: {
  docType: DocumentType;
  quizMode: string;
  amount: number;
  suitability: { term: number; concept: number; calc: number };
  recommendedDocType: DocumentType;
  isManualMode: boolean;
  refinedText: string;
  summary: string;
  tableReferences: any[];
}) {
  const { docType, quizMode, amount, suitability, recommendedDocType, isManualMode, refinedText, summary, tableReferences } = params;
  
  // ... (생략된 시스템 프롬프트 생성 로직 - 이전에 구현된 내용)
  return `...`; // 실제 시스템 프롬프트 반환
}

/**
 * 7. Adaptation Context 생성 (강철 방어 모드)
 */
export function generateAdaptationContext(params: {
  sourceType: DocumentType;
  targetType: string;
  refinedText: string;
}) {
  const { sourceType, targetType, refinedText } = params;
  
  // ... (생략된 Adaptation Context 생성 로직 - 이전에 구현된 내용)
  return {}; // 실제 Adaptation Context 반환
}

/**
 * 8. 자가 교정 프롬프트 생성
 */
export function generateSelfCorrectionPrompt() {
  // ... (생략된 자가 교정 프롬프트 생성 로직 - 이전에 구현된 내용)
  return `...`; // 실제 자가 교정 프롬프트 반환
}

/**
 * 9. 브릿지 질문 전략 생성
 */
export function generateBridgeQuestionStrategy() {
  // ... (생략된 브릿지 질문 전략 생성 로직 - 이전에 구현된 내용)
  return `...`; // 실제 브릿지 질문 전략 반환
}
