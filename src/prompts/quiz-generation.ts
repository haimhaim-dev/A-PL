/**
 * 퀴즈 생성용 프롬프트 모음
 * 정답 번호 불일치 문제 해결을 위한 엄격한 검증 로직 포함
 */

// 기본 시스템 지침
export const QUIZ_GENERATION_SYSTEM_BASE = `
당신은 제공된 텍스트만을 기반으로 객관식 퀴즈를 생성하는 전문가입니다.

[핵심 원칙]
- 모든 문제의 재료는 반드시 아래 [참조 데이터] 섹션의 텍스트여야 합니다.
- 외부 지식은 절대 사용하지 마십시오.
- [참조 데이터]에 없는 내용은 절대 사용하지 마십시오.
`;

// 문제 출제 요구사항
export const QUIZ_REQUIREMENTS = `
[문제 출제 요구사항]
- 난이도: medium
- 형식: 각 문제는 4개의 선택지와 상세한 해설을 포함해야 합니다.
- 선택지 번호: 반드시 '1, 2, 3, 4' 숫자만 사용하세요. A, B, C, D 같은 알파벳은 절대 사용하지 마세요.
- 품질 보장: 모든 문제는 문서와의 명확한 연결점을 가져야 하며, 해설에는 반드시 [PDF 근거: 문서의 'X문장/X내용']을 명시하십시오.
- 
`;

// 오답(Distractor) 설계 규칙 - 매력도 강화
export const ENHANCED_DISTRACTOR_RULES = `
[오답(Distractor) 설계 규칙]
- 매력적인 오답 생성: 단순히 말이 안 되는 소리가 아니라, 학습자가 흔히 혼동하는 개념, 본문의 다른 섹션 용어, 혹은 부분적으로만 맞는 내용을 오답으로 구성하세요.
- 유사성 유지: 모든 선택지는 문장의 길이나 문체(어투)가 가급적 비슷해야 합니다. (길이가 혼자 너무 길거나 짧아서 정답 티가 나지 않게 하세요)
- 그럴싸한 함정: 정답과 비슷한 용어나 개념을 사용하되, 핵심 부분만 미묘하게 틀린 선택지를 만드세요.
- 부분 정답 활용: 정답의 일부는 맞지만 전체적으로는 틀린 선택지를 포함하여 깊이 있는 이해를 요구하세요.
- 문맥 혼동: 같은 문서 내 다른 섹션에서 언급된 올바른 내용이지만, 현재 문제 맥락에서는 틀린 답을 오답으로 활용하세요.
`;

// 정답 번호 검증 필수사항 (핵심!)
export const ANSWER_VALIDATION_CRITICAL = `
[정답 번호 검증 필수사항]
⚠️ CRITICAL: 정답 번호를 결정할 때, 반드시 다음 단계를 따르세요:
1. 선택지 배열에서 정답이 몇 번째 위치에 있는지 확인하세요 (1번째=1, 2번째=2, 3번째=3, 4번째=4)
2. correctAnswerIndex에는 반드시 해당 위치의 숫자(1~4)만 입력하세요
3. 최종 제출 전에 선택지 배열과 correctAnswerIndex가 정확히 일치하는지 재검토하세요

[예시 검증 과정]
- 선택지: ["1. 잘못된답", "2. 정답내용", "3. 잘못된답", "4. 잘못된답"]
- 정답이 "2. 정답내용"이라면 → correctAnswerIndex: 2
- 반드시 확인: options[1] (0-based index)이 정답 내용과 일치하는가?
`;

// JSON 스키마 규칙
export const JSON_SCHEMA_RULES = `
[JSON 스키마 규칙]
- correctAnswerIndex: 반드시 1, 2, 3, 4 중 하나의 정수만 허용
- options: 반드시 4개의 문자열 배열, 각각 "1. ", "2. ", "3. ", "4. "로 시작
- question: 빈 문자열 불허용
- explanation: 빈 문자열 불허용, 반드시 정답 근거 포함
`;

// JSON 기술 가이드라인 - 파싱 에러 방지
export const JSON_SAFE_GUARD = `
[JSON 기술 가이드라인]
- 특수 문자 처리: 텍스트 내에 큰따옴표가 필요한 경우 반드시 백슬래시(\\")로 이스케이프하거나 작은따옴표('')를 사용하세요.
- 유효한 JSON: 결과물은 JSON.parse()에서 에러가 나지 않는 완벽한 JSON 형태여야 합니다. 텍스트 설명 없이 오직 JSON 객체만 출력하세요.
- 줄바꿈 처리: 문자열 내 줄바꿈은 \\n으로 이스케이프하거나 공백으로 대체하세요.
- 특수기호 주의: 백슬래시(\\), 탭(\\t), 캐리지 리턴(\\r) 등은 적절히 이스케이프하세요.
- 마지막 쉼표 금지: JSON 객체나 배열의 마지막 요소 뒤에 쉼표를 붙이지 마세요.
- 완전성 검증: 모든 중괄호 {}와 대괄호 []가 올바르게 닫혔는지 확인하세요.
`;

// 출력 형식 템플릿
export const JSON_OUTPUT_TEMPLATE = `
[출력 형식 (JSON) - 엄격한 스키마]
{
  "questions": [
    {
      "question": "문제 내용",
      "options": ["1. 선택지1", "2. 선택지2", "3. 선택지3", "4. 선택지4"],
      "correctAnswerIndex": 1,
      "explanation": "상세 해설 (정답인 1번이 왜 정답인지 설명 + 문서 연결점 명시)"
    }
  ]
}
`;

// 용어형 퀴즈 특화 지침
export const TERMINOLOGY_QUIZ_INSTRUCTION = `
[용어형 퀴즈 특화 지침]
- 핵심 용어의 정의를 묻는 문제 위주로 출제
- 오답 선택지는 비슷하지만 틀린 정의로 구성
- 용어와 정의의 정확한 매칭을 확인하는 문제
`;

// 개념형 퀴즈 특화 지침
export const CONCEPT_QUIZ_INSTRUCTION = `
[개념형 퀴즈 특화 지침]
- 단순 암기 문제가 아니라, 개념의 원리를 이해했는지 묻는 '추론형' 혹은 '응용형' 문제를 만들어주세요
- 개념 간의 관계나 원인과 결과를 묻는 문제
- 실제 상황에 개념을 적용할 수 있는지 확인하는 문제
`;

// 계산형 퀴즈 특화 지침
export const CALCULATION_QUIZ_INSTRUCTION = `
[계산형 퀴즈 특화 지침]
- 반드시 풀이 과정이 필요한 계산 문제를 출제하세요
- 오답 선지도 계산 실수로 나올 법한 숫자로 정교하게 구성해주세요
- 공식 적용과 수치 계산 능력을 모두 평가할 수 있는 문제
- 단위 변환이나 유효숫자 처리도 고려해주세요
`;

// 완전한 프롬프트 생성 함수들
export const generateQuizPrompt = (
  amount: number,
  userPrompt: string,
  refinedText: string,
  quizMode?: string
): string => {
  let specificInstruction = '';
  
  // 퀴즈 모드별 특화 지침 추가
  switch (quizMode) {
    case 'TERM':
      specificInstruction = TERMINOLOGY_QUIZ_INSTRUCTION;
      break;
    case 'CONCEPT':
      specificInstruction = CONCEPT_QUIZ_INSTRUCTION;
      break;
    case 'CALC':
      specificInstruction = CALCULATION_QUIZ_INSTRUCTION;
      break;
    default:
      specificInstruction = '';
  }

  return `${QUIZ_GENERATION_SYSTEM_BASE}

${QUIZ_REQUIREMENTS}
- 문제 수: 정확히 ${amount}개
- 사용자 요청: ${userPrompt}

${ENHANCED_DISTRACTOR_RULES}

${specificInstruction}

${ANSWER_VALIDATION_CRITICAL}

[참조 데이터]
${refinedText}

${JSON_OUTPUT_TEMPLATE}

${JSON_SCHEMA_RULES}

${JSON_SAFE_GUARD}`;
};

// 간단한 퀴즈 생성용 (기본)
export const generateSimpleQuizPrompt = (
  amount: number,
  userPrompt: string,
  refinedText: string
): string => {
  return generateQuizPrompt(amount, userPrompt, refinedText);
};