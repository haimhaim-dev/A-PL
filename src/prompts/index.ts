/**
 * 프롬프트 모듈 엔트리 포인트
 * 모든 프롬프트를 중앙에서 관리하고 export
 */

// Summarization 프롬프트들
export {
  TERMINOLOGY_EXTRACTION_PROMPT,
  CONCEPT_EXTRACTION_PROMPT,
  CALCULATION_EXTRACTION_PROMPT,
  MIXED_EXTRACTION_PROMPT,
  CONTENT_INTEGRATION_GUIDELINE,
  generateTerminologyPrompt,
  generateConceptPrompt,
  generateCalculationPrompt,
  generateMixedPrompt
} from './summarization';

// Quiz Generation 프롬프트들
export {
  QUIZ_GENERATION_SYSTEM_BASE,
  QUIZ_REQUIREMENTS,
  ENHANCED_DISTRACTOR_RULES,
  ANSWER_VALIDATION_CRITICAL,
  JSON_SCHEMA_RULES,
  JSON_SAFE_GUARD,
  JSON_OUTPUT_TEMPLATE,
  TERMINOLOGY_QUIZ_INSTRUCTION,
  CONCEPT_QUIZ_INSTRUCTION,
  CALCULATION_QUIZ_INSTRUCTION,
  generateQuizPrompt,
  generateSimpleQuizPrompt
} from './quiz-generation';

// 프롬프트 타입 정의
export type QuizMode = 'TERM' | 'CONCEPT' | 'CALC' | 'MIXED' | 'AUTO';

export interface PromptConfig {
  amount: number;
  userPrompt: string;
  refinedText: string;
  quizMode?: QuizMode;
}

// 유틸리티 함수들
export const createPromptConfig = (
  amount: number,
  userPrompt: string,
  refinedText: string,
  quizMode?: QuizMode
): PromptConfig => ({
  amount,
  userPrompt,
  refinedText,
  quizMode
});

// 프롬프트 검증 함수
export const validatePromptConfig = (config: PromptConfig): boolean => {
  return (
    config.amount > 0 &&
    config.userPrompt.trim().length > 0 &&
    config.refinedText.trim().length > 0
  );
};