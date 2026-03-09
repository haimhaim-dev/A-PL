/**
 * 전천후 퀴즈 생성 엔진 - 불일치 상황 대응 로직
 * 문서 성격과 요청 유형이 맞지 않을 때의 창의적 문제 생성 가이드라인
 */

export type DocumentCharacter = "CONCEPT" | "TERM" | "CALCULATION" | "MIXED";
export type RequestedType = "CALC" | "CONCEPT" | "TERM" | "AUTO";

export interface AdaptationContext {
  sourceType: DocumentCharacter;
  targetType: RequestedType;
  isCreativePivotNeeded: boolean;
  adaptationStrategy: string;
  promptEnhancement: string;
  documentKeywords: string[];
  isBridgeMode: boolean;
}

/**
 * 문서 성격 분석 (suitability 점수 기반)
 */
export function analyzeDocumentCharacter(suitability: {
  term: number;
  concept: number;
  calc: number;
}): DocumentCharacter {
  const { term, concept, calc } = suitability;
  const total = term + concept + calc;
  
  if (total === 0) return "MIXED";
  
  const termRatio = term / total;
  const conceptRatio = concept / total;
  const calcRatio = calc / total;
  
  // 주된 성격 판단 (60% 이상 비중)
  if (termRatio > 0.6) return "TERM";
  if (conceptRatio > 0.6) return "CONCEPT";
  if (calcRatio > 0.6) return "CALCULATION";
  
  return "MIXED";
}

/**
 * 불일치 상황 감지 및 대응 전략 생성 (강철 방어)
 */
export function createAdaptationContext(
  suitability: { term: number; concept: number; calc: number },
  requestedType: RequestedType,
  documentText: string = ""
): AdaptationContext {
  const sourceType = analyzeDocumentCharacter(suitability);
  const isCreativePivotNeeded = checkMismatch(sourceType, requestedType);
  const documentKeywords = extractKeywords(documentText);
  const isBridgeMode = checkBridgeMode(documentText, suitability);
  
  return {
    sourceType,
    targetType: requestedType,
    isCreativePivotNeeded,
    adaptationStrategy: generateAdaptationStrategy(sourceType, requestedType),
    promptEnhancement: generatePromptEnhancement(sourceType, requestedType, isCreativePivotNeeded),
    documentKeywords,
    isBridgeMode
  };
}

/**
 * 문서에서 핵심 키워드 추출
 */
function extractKeywords(text: string): string[] {
  if (!text || text.length < 50) return [];
  
  // 한국어 학술 키워드 패턴
  const patterns = [
    /([가-힣]{2,8})\s*(?:이란|란|는|은|의|을|를)/g, // 정의형 키워드
    /([가-힣]{2,8})\s*(?:법칙|원리|정리|공식|방법)/g, // 학술 용어
    /([A-Za-z]{3,15})\s*(?:공식|법칙|원리)/g, // 영어 학술 용어
    /\$([^$]+)\$/g, // LaTeX 수식 내용
    /([가-힣]{2,6})\s*계산/g, // 계산 관련
    /([가-힣]{2,6})\s*문제/g, // 문제 유형
  ];
  
  const keywords = new Set<string>();
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length >= 2) {
        keywords.add(match[1].trim());
      }
    }
  });
  
  // 빈도 기반 필터링 (너무 많으면 상위 10개만)
  return Array.from(keywords).slice(0, 10);
}

/**
 * 브릿지 모드 필요성 검사
 */
function checkBridgeMode(text: string, suitability: { term: number; concept: number; calc: number }): boolean {
  const totalScore = suitability.term + suitability.concept + suitability.calc;
  const isScoreTooLow = totalScore < 0.1; // 매우 낮은 점수
  const isTextTooShort = text.length < 200; // 너무 짧은 텍스트
  const hasMinimalKeywords = extractKeywords(text).length < 3; // 키워드 부족
  
  return isScoreTooLow || isTextTooShort || hasMinimalKeywords;
}

/**
 * 불일치 상황 체크
 */
function checkMismatch(sourceType: DocumentCharacter, targetType: RequestedType): boolean {
  if (targetType === "AUTO") return false;
  
  const mismatchCases = [
    // 개념지/교과서 -> 계산 문제 요청
    sourceType === "CONCEPT" && targetType === "CALC",
    // 용어집/단어장 -> 계산 문제 요청  
    sourceType === "TERM" && targetType === "CALC",
    // 문제지/연습문제 -> 용어/개념 요청
    sourceType === "CALCULATION" && (targetType === "TERM" || targetType === "CONCEPT")
  ];
  
  return mismatchCases.some(condition => condition);
}

/**
 * 강화된 대응 전략 생성 (강철 방어 수준)
 */
function generateAdaptationStrategy(sourceType: DocumentCharacter, targetType: RequestedType): string {
  if (sourceType === "CONCEPT" && targetType === "CALC") {
    return "CONCEPT_TO_CALC_ADVANCED: 개념의 원리를 관통하는 가상 시나리오 수치 대입형 문제 생성 - 표준 교육과정 난이도 준수";
  }
  
  if (sourceType === "TERM" && targetType === "CALC") {
    return "TERM_TO_CALC_ADVANCED: 용어 정의의 핵심 수치를 활용한 실제 상황 적용 계산 문제 생성 - 단위 변환 및 복합 연산 포함";
  }
  
  if (sourceType === "CALCULATION" && targetType === "TERM") {
    return "CALC_TO_TERM_ADVANCED: 문제 풀이의 핵심 키워드와 함정 요소를 묻는 고차원 용어 문제 생성";
  }
  
  if (sourceType === "CALCULATION" && targetType === "CONCEPT") {
    return "CALC_TO_CONCEPT_ADVANCED: 조건 변화에 따른 원리 추론 및 함정 회피 개념 문제 생성";
  }
  
  return "STANDARD: 문서 내용에 맞는 일반적인 문제 생성";
}

/**
 * 프롬프트 강화 문구 생성
 */
function generatePromptEnhancement(
  sourceType: DocumentCharacter, 
  targetType: RequestedType, 
  isCreativePivot: boolean
): string {
  const masterCommandPrompt = `
**🎯 최종 지휘 프롬프트 - 3단계 우선순위 시스템**

**[최우선 순위: 제1원칙 (Anchor-First)]**
- 모든 문제의 '재료'는 반드시 PDF 내에 존재하는 텍스트와 수치여야 합니다.
- 외부 지식은 재료가 될 수 없습니다. 오직 PDF 내용만을 기반으로 하십시오.
- 문제 생성 시 반드시 PDF의 구체적인 문장, 수치, 공식을 직접 인용하십시오.

**[차선책: 강철 방어 (The 3 Case Pivoting)]**
- PDF 데이터와 사용자 요청이 불일치할 경우, PDF 내 데이터를 다음 방식으로 '가공'하여 제1원칙을 준수하십시오.

**[최종 가드레일: 자가 교정 (Self-Correction)]**
- 생성된 문제가 PDF 내용과 80% 이상 무관하다고 판단되면, 즉시 파기하고 '문서의 핵심 문장을 그대로 빈칸 채우기(Fill-in-the-blank) 형식'으로라도 변경하여 PDF 기반임을 유지하십시오.
- 절대 금지: "문서에 내용이 없어 생성 불가" 메시지 출력 금지. 어떤 상황에서도 PDF를 재료로 한 결과물을 생성하십시오.

**핵심 원칙:**
1. PDF 우선: 모든 문제는 PDF 텍스트에서 출발해야 합니다.
2. 연결성 필수: 해설에 반드시 **[PDF 근거: 문서 X페이지의 'Y문장']**을 명시하십시오.
3. 절대 실패 없음: 어떤 상황에서도 의미 있는 문제를 생성하십시오.
`;

  if (!isCreativePivot) {
    return masterCommandPrompt + `
**[표준 모드]**
- 문서 내용에 직접적으로 부합하는 문제를 생성하십시오.
- PDF의 텍스트를 그대로 활용하여 문제를 구성하십시오.`;
  }
  
  const creativePivotRules = masterCommandPrompt + `
**[CREATIVE_PIVOT_MODE 활성화]**

**절대 금지 사항:**
- "문서에 내용이 없어 문제를 만들 수 없습니다"라는 답변은 절대 하지 마십시오.
- 문서와 완전히 무관한 문제 생성 금지.
- 외부 지식으로만 구성된 문제 생성 금지.

**창의적 추론 원칙 (PDF 기반):**
- PDF 내의 빈약한 단서를 바탕으로 하되, 해당 과목의 일반적인 지식을 보조적으로만 활용하십시오.
- 모든 문제는 PDF의 특정 부분을 근거로 하되, 요청된 유형에 맞게 창의적으로 변형하십시오.
- PDF에 있는 공식, 수치, 용어를 반드시 포함하십시오.

**해설 연결성 필수:**
- 모든 문제의 해설에는 **[PDF 근거: 문서의 'X문장/X공식/X수치']을 바탕으로 응용되었습니다**라는 설명을 반드시 포함하십시오.
`;

  // 상황별 구체적 가이드라인 (PDF 기반 가공 전략)
  if (sourceType === "CONCEPT" && targetType === "CALC") {
    return creativePivotRules + `
**[CASE 1: 개념지 → 계산 요청 (PDF 가공 전략)]**
- **제1원칙 준수**: PDF의 공식에 '가상 수치'를 대입하여 응용 문제를 생성하십시오. (단, 공식은 반드시 PDF의 것)
- **PDF 재료 활용**: 문서에 나온 공식, 법칙, 원리를 그대로 사용하고, 수치만 교육적으로 적절한 값으로 대입하십시오.
- **예시**: PDF에 "F=ma" 공식이 있다면 → "질량 2kg인 물체에 10N의 힘을 가했을 때 가속도는?"
- **자가 교정**: 생성된 문제가 PDF 공식과 80% 이상 연관되어야 합니다.
- **PDF 근거**: 해설에 **[PDF 근거: 문서 X페이지의 'Y공식']**을 반드시 명시하십시오.`;
  }
  
  if (sourceType === "TERM" && targetType === "CALC") {
    return creativePivotRules + `
**[CASE 2: 용어집 → 계산 요청 (PDF 가공 전략)]**
- **제1원칙 준수**: PDF에 기술된 용어의 정의 내 '수치/단위' 간의 관계를 묻는 연산 문제를 생성하십시오.
- **PDF 재료 활용**: 문서에 나온 용어의 정의, 단위, 공식을 그대로 사용하고 실제 계산 상황으로 변환하십시오.
- **예시**: PDF에 "속도 = 거리/시간" 정의가 있다면 → "60km를 2시간에 이동했을 때 평균 속도는?"
- **자가 교정**: 생성된 문제가 PDF 용어 정의와 80% 이상 연관되어야 합니다.
- **PDF 근거**: 해설에 **[PDF 근거: 문서의 'X용어' 정의]**를 반드시 명시하십시오.`;
  }
  
  if (sourceType === "CALCULATION" && targetType === "CONCEPT") {
    return creativePivotRules + `
**[CASE 3: 문제지 → 개념 요청 (PDF 가공 전략)]**
- **제1원칙 준수**: PDF에 있는 문제의 '풀이 원리나 공식 명칭'을 묻는 역추론 문제를 생성하십시오.
- **PDF 재료 활용**: 문서에 나온 문제의 풀이 과정, 사용된 공식, 원리를 그대로 인용하여 개념 문제로 변환하십시오.
- **예시**: PDF에 "2x + 3 = 7, x = 2" 풀이가 있다면 → "이 방정식을 풀 때 사용된 등식의 성질은 무엇인가?"
- **자가 교정**: 생성된 문제가 PDF 문제의 풀이 과정과 80% 이상 연관되어야 합니다.
- **PDF 근거**: 해설에 **[PDF 근거: 문서 X페이지의 'Y문제 풀이 과정']**을 반드시 명시하십시오.`;
  }
  
  if (sourceType === "CALCULATION" && targetType === "TERM") {
    return creativePivotRules + `
**[CASE 4: 문제지 → 용어 요청 (PDF 가공 전략)]**
- **제1원칙 준수**: PDF 문제에서 사용된 핵심 용어나 기호의 의미를 묻는 문제를 생성하십시오.
- **PDF 재료 활용**: 문서에 나온 문제의 기호, 용어, 표기법을 그대로 사용하여 용어 문제로 변환하십시오.
- **예시**: PDF에 "∫f(x)dx" 표기가 있다면 → "이 기호 ∫의 의미와 dx의 역할을 설명하시오."
- **자가 교정**: 생성된 문제가 PDF 문제의 용어/기호와 80% 이상 연관되어야 합니다.
- **PDF 근거**: 해설에 **[PDF 근거: 문서의 'X문제에서 사용된 Y용어/기호']**를 반드시 명시하십시오.`;
  }
  
  return creativePivotRules;
}

/**
 * 자가 교정 시스템 프롬프트 생성
 */
export function generateSelfCorrectionPrompt(): string {
  return `
**🔍 자가 교정 시스템 (Self-Correction Protocol)**

**검증 단계:**
1. **PDF 연관성 검사**: 생성된 각 문제가 PDF 내용과 80% 이상 연관되는지 자체 검증하십시오.
2. **재료 출처 확인**: 문제에 사용된 모든 수치, 공식, 용어가 PDF에서 나온 것인지 확인하십시오.
3. **외부 지식 제거**: PDF에 없는 외부 지식이 포함되었다면 즉시 제거하십시오.

**교정 프로토콜:**
- **80% 미만 연관성**: 해당 문제를 파기하고 '문서의 핵심 문장을 그대로 빈칸 채우기(Fill-in-the-blank) 형식'으로 변경하십시오.
- **예시 교정**: "문서에 '속도는 거리를 시간으로 나눈 값이다'라는 문장이 있다면 → '속도는 ___를 ___으로 나눈 값이다.'"
- **최종 확인**: 모든 문제가 PDF 기반임을 재확인하십시오.

**절대 원칙:**
- "문서에 내용이 없어 생성 불가"는 절대 금지입니다.
- 어떤 상황에서도 PDF를 재료로 한 결과물을 반드시 생성하십시오.
- 빈칸 채우기라도 PDF 기반 문제를 만드십시오.
`;
}

/**
 * 브릿지 문제 생성 로직 (극한 상황 대응)
 */
export function generateBridgeQuestionStrategy(
  documentKeywords: string[],
  targetType: RequestedType,
  subject: string
): string {
  return `
**🛡️ [극한 상황 대응: PDF 기반 브릿지 문제 모드]**

**제1원칙 극한 적용:**
- 문서 내용이 빈약하더라도 반드시 PDF 텍스트만을 재료로 사용하십시오.
- 외부 지식은 절대 사용하지 마십시오.

**PDF 기반 브릿지 전략:**
1. **키워드 활용**: 문서에서 추출된 키워드 [${documentKeywords.join(', ')}]를 반드시 포함하십시오.
2. **문장 재활용**: PDF의 완전한 문장을 빈칸 채우기 형식으로 변환하십시오.
3. **단어 조합**: PDF 내 단어들을 조합하여 간단한 정의 문제를 만드십시오.

**브릿지 문제 예시:**
- **빈칸 채우기**: "문서에 '에너지는 보존된다'라는 문장이 있다면 → '___는 ___된다.'"
- **단어 선택**: "다음 중 문서에서 언급된 용어는? (PDF 키워드들을 선택지로 활용)"
- **문장 순서**: "문서의 다음 문장을 올바른 순서로 배열하시오. (PDF 문장 분할)"

**품질 보장:**
- 해설에 **[PDF 근거: 문서의 'X문장/X키워드' 직접 인용]**을 명시하십시오.
- 모든 문제 요소가 100% PDF에서 나온 것임을 보장하십시오.
- 절대 빈 결과나 "문제를 만들 수 없습니다"라는 답변을 하지 마십시오.

**최종 가드레일:**
- PDF에 단 한 문장이라도 있다면 반드시 그것을 활용한 문제를 생성하십시오.
- 최악의 경우라도 "문서에서 언급된 키워드를 모두 고르시오" 형태의 문제는 만들 수 있습니다.
`;
}

/**
 * 과목별 핵심 공통 질문 데이터베이스
 */
function getSubjectCoreQuestions(subject: string, targetType: RequestedType): string {
  const coreQuestions: Record<string, Record<string, string[]>> = {
    "수학": {
      "CALC": ["함수의 극값을 구하는 방법", "미분과 적분의 관계", "변화율의 의미"],
      "CONCEPT": ["함수의 연속성 조건", "극한의 존재 조건", "미분가능성의 의미"],
      "TERM": ["도함수와 미분계수의 차이", "정적분과 부정적분의 구분", "수렴과 발산의 정의"]
    },
    "물리": {
      "CALC": ["운동량 보존 법칙 적용", "에너지 변환 계산", "파동의 주기와 진동수"],
      "CONCEPT": ["관성의 원리", "에너지 보존의 조건", "파동의 간섭 원리"],
      "TERM": ["가속도와 속도의 차이", "일과 에너지의 관계", "주기와 진동수의 정의"]
    },
    "화학": {
      "CALC": ["몰 농도 계산", "화학 반응식의 양적 관계", "기체 법칙 적용"],
      "CONCEPT": ["화학 평형의 원리", "산화-환원 반응의 메커니즘", "분자 구조와 성질의 관계"],
      "TERM": ["몰과 분자량의 차이", "이온과 원자의 구분", "산과 염기의 정의"]
    }
  };
  
  // 과목 추정 (키워드 기반)
  const detectedSubject = Object.keys(coreQuestions).find(s => 
    subject.toLowerCase().includes(s.toLowerCase())
  ) || "수학";
  
  return coreQuestions[detectedSubject]?.[targetType]?.join(", ") || "기본 개념의 정의와 적용";
}