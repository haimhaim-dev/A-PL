/**
 * PDF 텍스트 압축 및 요약용 프롬프트 모음
 * Map-Reduce 패턴을 활용한 청크별 처리 프롬프트
 */

// 용어 추출용 프롬프트 (Map 단계)
export const TERMINOLOGY_EXTRACTION_PROMPT = `
너는 전문 요약가야. 다음 텍스트에서 퀴즈로 출제하기 좋은 '핵심 용어'와 그에 대한 '정의'를 추출해서 '단어: 정의' 형식으로 한 줄씩 나열해줘.

[추출 기준]
- 학습자가 반드시 알아야 할 전문 용어
- 명확한 정의가 있는 개념
- 암기형 문제로 출제 가능한 내용

[출력 형식]
용어1: 정의1
용어2: 정의2
...

[처리할 텍스트]
`;

// 개념 추출용 프롬프트 (Map 단계)
export const CONCEPT_EXTRACTION_PROMPT = `
너는 교육 공학 전문가야. 다음 텍스트를 분석해서 퀴즈 출제를 위한 '핵심 개념 지도'를 작성해줘.

[추출 요소]
1) 해당 섹션의 핵심 주장
2) 그 주장을 뒷받침하는 논리나 원리  
3) 주요 특징이나 예시

[출력 형식]
서술형 문장보다는 핵심 요약 형태로 작성해줘.

[처리할 텍스트]
`;

// 계산/수식 추출용 프롬프트 (Map 단계)
export const CALCULATION_EXTRACTION_PROMPT = `
너는 이공계 교수이자 수학 전문가야. 다음 텍스트에서 계산 문제 출제에 필요한 요소들을 모두 추출해줘.

[추출 대상]
1) 핵심 공식 (반드시 LaTeX 형식: $...$으로 표기)
2) 수치 데이터 및 단위
3) 본문에 나온 예제 문제
4) 계산 과정 및 풀이 방법

[주의사항]
- 계산에 필요 없는 서술형 문장은 모두 제외
- 오직 데이터와 수식 위주로 압축
- 공식은 반드시 LaTeX 형식으로 보존

[처리할 텍스트]
`;

// 혼합형 추출용 프롬프트 (Map 단계)
export const MIXED_EXTRACTION_PROMPT = `
너는 종합 분석 전문가야. 다음 텍스트에서 다양한 유형의 퀴즈 출제가 가능한 핵심 내용을 추출해줘.

[추출 범위]
- 중요한 용어와 정의
- 핵심 개념과 원리
- 수치 데이터나 공식 (있는 경우)
- 예시와 특징
- 인과관계나 비교 내용

[출력 방식]
유형별로 구분하여 정리하되, 퀴즈 출제에 직접 활용 가능한 형태로 압축해줘.

[처리할 텍스트]
`;

// Reduce 단계용 통합 지침 - 맥락 보존형 요약
export const CONTENT_INTEGRATION_GUIDELINE = `
[고순도 맥락 보존 통합 규칙]
1. 계층적 구조화: 상위 개념과 하위 용어의 관계를 (상위 > 하위) 형태로 유지하세요.
2. 메타 정보 유지: 해당 내용이 문서의 어느 부분(서론, 본문, 결론 혹은 섹션 제목)에서 나왔는지 태그를 남기세요. (예: [섹션: 이진트리 순회])
3. 불용어 제거: 퀴즈화하기 어려운 수식어구나 미사여구는 과감히 삭제하되, 'A이므로 B이다'와 같은 인과관계는 반드시 보존하세요.
4. 연결고리 유지: 개념 간의 관계, 순서, 조건 등을 명확히 표현하여 문맥을 보존하세요.
5. 구체적 예시 포함: 추상적 개념은 본문의 구체적 예시와 함께 정리하여 퀴즈 출제 시 활용할 수 있게 하세요.
6. 대조 관계 보존: '반면에', '그러나', '차이점' 등의 대조 관계는 비교형 문제 출제를 위해 반드시 유지하세요.
`;

// 프롬프트 생성 함수들
export const generateTerminologyPrompt = (chunkText: string): string => {
  return TERMINOLOGY_EXTRACTION_PROMPT + chunkText;
};

export const generateConceptPrompt = (chunkText: string): string => {
  return CONCEPT_EXTRACTION_PROMPT + chunkText;
};

export const generateCalculationPrompt = (chunkText: string): string => {
  return CALCULATION_EXTRACTION_PROMPT + chunkText;
};

export const generateMixedPrompt = (chunkText: string): string => {
  return MIXED_EXTRACTION_PROMPT + chunkText;
};