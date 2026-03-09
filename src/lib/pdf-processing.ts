/**
 * PDF 처리 유틸리티 함수들
 * /api/quiz/process에서 분리된 핵심 PDF 파싱 로직
 * 
 * ⚠️ 주의: 이 파일의 알고리즘은 수정 금지 (완전한 보존)
 */

import pdf from "pdf-parse";
import { PATTERNS } from "@/lib/document-processor";
import type { PDFParsingResult } from "@/types/process-api";

// PDF 처리 관련 타입 정의
interface PDFTextItem {
  str: string;
  transform: number[];
}

interface PDFTextContent {
  items: PDFTextItem[];
}

interface PDFPageData {
  getTextContent(options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }): Promise<PDFTextContent>;
}

interface PDFParseOptions {
  disableCombineTextItems: boolean;
  disableFontFace: boolean;
  pagerender: (pageData: PDFPageData) => Promise<string>;
}

interface PDFError extends Error {
  name: string;
  message: string;
  stack?: string;
}

/**
 * 단어 재구성 알고리즘
 * 끊어진 단어들을 X,Y 좌표와 거리를 기반으로 재구성
 */
function reconstructWords(items: PDFTextItem[]): PDFTextItem[] {
  if (!items || items.length === 0) return [];
  
  const reconstructed: PDFTextItem[] = [];
  let currentItem: PDFTextItem | null = null;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemStr = item.str?.trim() || '';
    
    // 빈 문자열 스킵
    if (!itemStr) continue;
    
    if (!currentItem) {
      currentItem = { ...item };
      continue;
    }
    
    const currentX = currentItem.transform[4];
    const currentY = currentItem.transform[5];
    const itemX = item.transform[4];
    const itemY = item.transform[5];
    
    // 같은 줄에 있는지 확인 (Y 좌표 차이가 2 이하)
    const isSameLine = Math.abs(currentY - itemY) <= 2;
    
    // X 좌표 거리 계산
    const xDistance = Math.abs(itemX - currentX);
    
    // 단어 재구성 조건 확인
    const shouldMerge = isSameLine && 
                       xDistance <= 50 && // 50 단위 이하의 거리
                       !currentItem.str.endsWith(' ') && // 현재 아이템이 공백으로 끝나지 않음
                       !itemStr.startsWith(' ') && // 다음 아이템이 공백으로 시작하지 않음
                       isPartialWord(currentItem.str, itemStr); // 부분 단어인지 확인
    
    if (shouldMerge) {
      // 단어 병합
      currentItem.str += itemStr;
      console.log(`🔗 [단어 재구성] "${currentItem.str.slice(0, -itemStr.length)}" + "${itemStr}" = "${currentItem.str}"`);
    } else {
      // 현재 아이템을 결과에 추가하고 새 아이템 시작
      reconstructed.push(currentItem);
      currentItem = { ...item };
    }
  }
  
  // 마지막 아이템 추가
  if (currentItem) {
    reconstructed.push(currentItem);
  }
  
  return reconstructed;
}

/**
 * 두 텍스트가 하나의 단어의 일부인지 판단
 */
function isPartialWord(first: string, second: string): boolean {
  // 한글 단어 재구성 패턴
  const koreanPattern = /[가-힣]$/;
  const koreanStartPattern = /^[가-힣]/;
  
  // 영문 단어 재구성 패턴
  const englishPattern = /[a-zA-Z]$/;
  const englishStartPattern = /^[a-zA-Z]/;
  
  // 숫자 패턴
  const numberPattern = /[0-9]$/;
  const numberStartPattern = /^[0-9]/;
  
  // 한글 단어 연결
  if (koreanPattern.test(first) && koreanStartPattern.test(second)) {
    return true;
  }
  
  // 영문 단어 연결
  if (englishPattern.test(first) && englishStartPattern.test(second)) {
    return true;
  }
  
  // 숫자 연결
  if (numberPattern.test(first) && numberStartPattern.test(second)) {
    return true;
  }
  
  // 수식 연결 (LaTeX, 수학 기호 등)
  if (/[=+\-*/(){}[\]^_]$/.test(first) || /^[=+\-*/(){}[\]^_]/.test(second)) {
    return true;
  }
  
  return false;
}

/**
 * 🔧 강화된 PDF 파싱: 예외 처리 및 로깅 추가
 * 
 * ⚠️ 기존 알고리즘 보존 + 안정성 강화
 */
export async function parsePdfPages(buffer: Buffer): Promise<string[]> {
  const pages: string[] = [];
  let currentPageNumber = 0; // 실제 PDF 페이지 번호 추적
  
  console.log(`📄 [PDF 파싱 시작] 버퍼 크기: ${buffer.length} bytes`);
  console.log(`🔍 [버퍼 검사] 첫 16바이트: ${buffer.subarray(0, 16).toString('hex')}`);
  
  // 한글 인코딩 최적화 옵션
  const options = {
    // 텍스트 결합 비활성화로 한글 문자 보존
    disableCombineTextItems: false,
    // 폰트 매핑 활성화
    disableFontFace: false,
    // 페이지 렌더링 커스텀 함수
    pagerender: (pageData: PDFPageData) => {
      currentPageNumber++; // 페이지 번호 증가
      return pageData.getTextContent({
        // 텍스트 정규화 옵션
        normalizeWhitespace: false,
        // 텍스트 결합 비활성화
        disableCombineTextItems: false
      }).then((textContent: PDFTextContent) => {
        try {
          let lastY, text = '';
          let itemCount = 0;
          let koreanCount = 0;
          let englishCount = 0;
          
          console.log(`🔍 [페이지 ${currentPageNumber}] 텍스트 아이템 수: ${textContent.items?.length || 0}`);
          
          // 단어 재구성을 위한 텍스트 아이템 분석
          const processedItems = reconstructWords(textContent.items);
          
          for (let item of processedItems) {
            const itemStr = item.str || '';
            
            // 한글/영문 카운트
            if (/[가-힣]/.test(itemStr)) koreanCount++;
            if (/[a-zA-Z]/.test(itemStr)) englishCount++;
            
            // Y 좌표 기반 줄바꿈 처리 (한글 PDF 최적화)
            if (lastY == item.transform[5] || !lastY){
              text += itemStr;
            } else {
              text += '\n' + itemStr;
            }    
            lastY = item.transform[5];
            itemCount++;
          }
          
          // 상세 로깅
          console.log(`📄 [페이지 ${currentPageNumber}] 추출 완료:`);
          console.log(`   - 텍스트 길이: ${text.length}자`);
          console.log(`   - 아이템 수: ${itemCount}개`);
          console.log(`   - 한글 아이템: ${koreanCount}개`);
          console.log(`   - 영문 아이템: ${englishCount}개`);
          console.log(`   - 텍스트 샘플: "${text.substring(0, 100)}..."`);
          
          pages.push(text);
          return text;
        } catch (pageError: any) {
          console.error(`❌ [페이지 ${currentPageNumber} 파싱 실패]:`, pageError);
          console.error(`❌ [페이지 ${currentPageNumber} 에러 스택]:`, pageError?.stack);
          // 페이지 파싱 실패 시 빈 문자열 추가하고 계속 진행
          pages.push('');
          return '';
        }
      }).catch((textError: any) => {
        console.error(`❌ [페이지 ${currentPageNumber} 텍스트 추출 실패]:`, textError);
        console.error(`❌ [페이지 ${currentPageNumber} 텍스트 에러 스택]:`, textError?.stack);
        pages.push('');
        return '';
      });
    }
  };

  try {
    const result = await pdf(buffer, options);
    const totalText = pages.join('');
    
    console.log(`✅ [PDF 파싱 완료] 총 페이지: ${pages.length}, 전체 텍스트: ${totalText.length}자`);
    console.log(`📊 [PDF 메타데이터] 제목: ${result.info?.Title || 'N/A'}, 작성자: ${result.info?.Author || 'N/A'}`);
    console.log(`🔍 [텍스트 분석] 한글: ${/[가-힣]/.test(totalText) ? '✅' : '❌'}, 영문: ${/[a-zA-Z]/.test(totalText) ? '✅' : '❌'}, 숫자: ${/[0-9]/.test(totalText) ? '✅' : '❌'}`);
    
    // 10자 미만일 때 상세 진단
    if (totalText.length < 10) {
      console.error(`⚠️ [텍스트 부족 진단] 추출량: ${totalText.length}자`);
      console.error(`🔍 [진단] 원본 텍스트: "${totalText}"`);
      console.error(`🔍 [진단] 각 페이지 길이: [${pages.map(p => p.length).join(', ')}]`);
      
      // 파일 스트림 vs 인코딩 오류 구분
      if (pages.length === 0) {
        console.error(`❌ [진단 결과] 파일 스트림 읽기 오류 - 페이지를 전혀 읽지 못함`);
      } else if (pages.every(p => p.trim().length === 0)) {
        console.error(`❌ [진단 결과] 인코딩 오류 - 페이지는 읽었지만 텍스트 추출 실패`);
      } else {
        console.error(`❌ [진단 결과] 부분 추출 성공 - 일부 페이지만 텍스트 포함`);
      }
    }
    
    return pages;
  } catch (pdfError: any) {
    console.error(`❌ [PDF 파싱 전체 실패]:`, pdfError);
    console.error(`❌ [PDF 파싱 에러 스택]:`, pdfError?.stack);
    
    // 대체 파싱 시도 1: 기본 pdf-parse
    try {
      console.log(`🔄 [대체 파싱 1] 기본 pdf-parse 모드로 재시도...`);
      const fallbackResult = await pdf(buffer);
      const fallbackText = fallbackResult.text || '';
      console.log(`✅ [대체 파싱 1 성공] 추출된 텍스트: ${fallbackText.length}자`);
      console.log(`📄 [대체 파싱 1 샘플] "${fallbackText.substring(0, 200)}..."`);
      
      // 페이지 단위로 분할 (대략적)
      const fallbackPages = fallbackText.split(/\n\s*\n/).filter(page => page.trim().length > 0);
      return fallbackPages.length > 0 ? fallbackPages : [fallbackText];
    } catch (fallbackError1) {
      console.error(`❌ [대체 파싱 1 실패]:`, fallbackError1);
      
      // 대체 파싱 시도 2: 최소 옵션
      try {
        console.log(`🔄 [대체 파싱 2] 최소 옵션으로 재시도...`);
        const minimalResult = await pdf(buffer, { 
          max: 0, // 페이지 제한 없음
          version: 'v1.10.100' // 안정 버전 명시
        });
        const minimalText = minimalResult.text || '';
        console.log(`✅ [대체 파싱 2 성공] 추출된 텍스트: ${minimalText.length}자`);
        
        return minimalText.length > 0 ? [minimalText] : [''];
      } catch (fallbackError2) {
        console.error(`❌ [대체 파싱 2도 실패]:`, fallbackError2);
        
        // 완전 실패 시 상세 에러 정보
        console.error(`💀 [완전 실패] PDF 파싱 불가능`);
        console.error(`📊 [실패 정보] 버퍼 크기: ${buffer.length}, PDF 헤더: ${buffer.subarray(0, 8).toString()}`);
        
        throw new Error(`PDF 파싱 완전 실패: 
          1차 오류: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}
          2차 오류: ${fallbackError1 instanceof Error ? fallbackError1.message : String(fallbackError1)}
          3차 오류: ${fallbackError2 instanceof Error ? fallbackError2.message : String(fallbackError2)}`);
      }
    }
  }
}

/**
 * 🧠 지능형 요약: 정의, 수식, 표 캡션 유지 + 부연 설명 축약
 * 
 * ⚠️ 보존 함수: 알고리즘 수정 금지
 */
export function intelligentSummary(text: string): string {
  const lines = text.split('\n');
  const importantLines: string[] = [];
  const supplementaryLines: string[] = [];

  lines.forEach(line => {
    const isDefinition = PATTERNS.DEFINITION.test(line);
    const isMath = PATTERNS.MATH.test(line) || PATTERNS.FORMULA.test(line);
    const isTableCaption = PATTERNS.TABLE.test(line);

    // 정규식 인덱스 초기화
    PATTERNS.DEFINITION.lastIndex = 0;
    PATTERNS.MATH.lastIndex = 0;
    PATTERNS.FORMULA.lastIndex = 0;
    PATTERNS.TABLE.lastIndex = 0;

    if (isDefinition || isMath || isTableCaption) {
      importantLines.push(line);
    } else if (line.trim().length > 10) {
      supplementaryLines.push(line);
    }
  });

  // 부연 설명은 최대 2~3문장으로 제한
  const limitedSupplementary = supplementaryLines.slice(0, 3);
  
  return [...importantLines, ...limitedSupplementary].join('\n');
}

/**
 * 텍스트 전처리: 공백 및 특수문자 정리 (한글 최적화)
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  console.log(`🧹 [텍스트 전처리 시작] 원본 길이: ${text.length}자`);
  console.log(`🔍 [전처리 전 샘플] "${text.substring(0, 100)}..."`);
  
  const cleaned = text
    // 제어 문자 제거 (탭, 캐리지 리턴 등은 유지)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 연속된 공백을 단일 공백으로 (한글 사이 공백 보존)
    .replace(/[ \t]+/g, ' ')
    // 연속된 줄바꿈을 최대 2개로 제한
    .replace(/\n{3,}/g, '\n\n')
    // 앞뒤 공백 제거
    .trim()
    // 한글-영문 사이 공백 정규화
    .replace(/([가-힣])([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([가-힣])/g, '$1 $2');
  
  console.log(`✅ [텍스트 전처리 완료] 정리 후 길이: ${cleaned.length}자`);
  console.log(`🔍 [전처리 후 샘플] "${cleaned.substring(0, 100)}..."`);
  
  return cleaned;
}

/**
 * 텍스트 유효성 검사 (매우 관대한 기준 + 상세 진단)
 */
export function isValidText(text: string): { isValid: boolean; reason: string; stats: any } {
  console.log(`🔍 [텍스트 유효성 검사 시작]`);
  
  if (!text) {
    console.log(`❌ [유효성 검사] NULL 또는 undefined`);
    return { isValid: false, reason: 'NULL_OR_UNDEFINED', stats: { length: 0 } };
  }
  
  const cleaned = cleanExtractedText(text);
  const stats = {
    originalLength: text.length,
    cleanedLength: cleaned.length,
    hasKorean: /[가-힣]/.test(cleaned),
    hasEnglish: /[a-zA-Z]/.test(cleaned),
    hasNumbers: /[0-9]/.test(cleaned),
    hasSymbols: /[^\w\s가-힣]/.test(cleaned),
    lineCount: cleaned.split('\n').length,
    wordCount: cleaned.split(/\s+/).filter(word => word.length > 0).length,
    koreanChars: (cleaned.match(/[가-힣]/g) || []).length,
    englishChars: (cleaned.match(/[a-zA-Z]/g) || []).length
  };
  
  console.log(`📊 [텍스트 통계]`);
  console.log(`   - 원본: ${stats.originalLength}자 → 정리후: ${stats.cleanedLength}자`);
  console.log(`   - 한글: ${stats.koreanChars}자 (${stats.hasKorean ? '✅' : '❌'})`);
  console.log(`   - 영문: ${stats.englishChars}자 (${stats.hasEnglish ? '✅' : '❌'})`);
  console.log(`   - 숫자: ${stats.hasNumbers ? '✅' : '❌'}, 기호: ${stats.hasSymbols ? '✅' : '❌'}`);
  console.log(`   - 줄수: ${stats.lineCount}, 단어수: ${stats.wordCount}`);
  
  // 매우 관대한 기준: 정리 후에도 완전히 비어있는 경우만 무효
  if (cleaned.length === 0) {
    console.log(`❌ [유효성 검사 실패] 정리 후 완전히 비어있음`);
    return { isValid: false, reason: 'EMPTY_AFTER_CLEANING', stats };
  }
  
  // 의미 있는 문자가 하나라도 있으면 유효
  if (stats.hasKorean || stats.hasEnglish || stats.hasNumbers) {
    console.log(`✅ [유효성 검사 성공] 의미있는 문자 발견`);
    return { isValid: true, reason: 'VALID_CONTENT', stats };
  }
  
  // 기호만 있는 경우도 3자 이상이면 유효 (수식 등)
  if (stats.hasSymbols && cleaned.length >= 3) {
    console.log(`✅ [유효성 검사 성공] 기호 기반 콘텐츠 (수식 등)`);
    return { isValid: true, reason: 'SYMBOLS_ONLY_BUT_VALID', stats };
  }
  
  // 공백만 있는 경우
  if (cleaned.replace(/\s/g, '').length === 0) {
    console.log(`❌ [유효성 검사 실패] 공백만 존재`);
    return { isValid: false, reason: 'WHITESPACE_ONLY', stats };
  }
  
  console.log(`❌ [유효성 검사 실패] 의미없는 콘텐츠`);
  return { isValid: false, reason: 'NO_MEANINGFUL_CONTENT', stats };
}

/**
 * PDF 전체 파싱 결과를 구조화하여 반환 (강화된 버전)
 */
export async function processPDFBuffer(buffer: Buffer): Promise<PDFParsingResult> {
  console.log(`🔍 [PDF 처리 시작] 버퍼 크기: ${buffer.length} bytes`);
  
  const pages = await parsePdfPages(buffer);
  const rawFullText = pages.join("\n");
  const fullText = cleanExtractedText(rawFullText);
  
  const validation = isValidText(fullText);
  
  console.log(`📊 [텍스트 검증 결과]`);
  console.log(`   - 유효성: ${validation.isValid ? '✅ 유효' : '❌ 무효'} (${validation.reason})`);
  console.log(`   - 원본 길이: ${validation.stats.originalLength}자`);
  console.log(`   - 정리 후 길이: ${validation.stats.cleanedLength}자`);
  console.log(`   - 한글: ${validation.stats.hasKorean ? '✅' : '❌'}, 영문: ${validation.stats.hasEnglish ? '✅' : '❌'}, 숫자: ${validation.stats.hasNumbers ? '✅' : '❌'}`);
  console.log(`   - 줄 수: ${validation.stats.lineCount}줄`);
  
  if (!validation.isValid) {
    console.error(`❌ [PDF 텍스트 무효] 이유: ${validation.reason}`);
    console.error(`📄 [원본 텍스트 샘플] "${rawFullText.substring(0, 200)}..."`);
  }
  
  return {
    pages: pages.map(page => cleanExtractedText(page)),
    fullText,
    pageCount: pages.length,
    validation
  };
}