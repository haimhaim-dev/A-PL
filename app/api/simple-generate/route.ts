/**
 * 고도화된 퀴즈 생성 API
 * 분석 데이터 기반 프롬프트 주입 및 DB 스키마 최적화
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import type { QuizInsert, QuizContent } from "@/types/quiz-db";
import type { ProcessAPIResponse } from "@/types/process-api";
import { generateSimpleQuizPrompt } from "@/prompts";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 300; // 5분으로 늘림
export const dynamic = "force-dynamic";

// 모델 ID 설정 (안전장치: gemini-flash-latest 사용 가능)
const GEMINI_MODEL = process.env.GEMINI_MODEL_ID || "gemini-3-flash-preview";
// 대안: "gemini-flash-latest" (불안정할 경우 사용)

// 재시도 헬퍼 함수
async function retryOperation<T>(operation: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i < retries && (error.response?.status === 503 || error.response?.status === 429)) {
        console.warn(`⚠️ API 호출 실패 (상태: ${error.response?.status || '알 수 없음'}), ${i + 1}번째 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
  throw new Error("최대 재시도 횟수를 초과했습니다.");
}

export async function POST(request: NextRequest) {
  let currentStep = "초기화";
  
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ 
        error: "API 키가 설정되지 않았습니다.", 
        step: currentStep 
      }, { status: 500 });
    }

    currentStep = "요청 데이터 파싱";
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const quizMode = formData.get("quizMode") as string || "AUTO";
    let amount = parseInt(formData.get("amount") as string) || 10; // amount를 let으로 변경
    const isManualMode = formData.get("isManualMode") === "true";
    const customInstructions = formData.get("customInstructions") as string || "";
    
    // 기본 사용자 프롬프트 정의
    const DEFAULT_PROMPT = `${amount}개의 문제를 생성해주세요. 문제 유형은 ${quizMode}이며, 난이도는 적절하게 조절해주세요.`;
    let userPrompt = customInstructions.trim() || DEFAULT_PROMPT; // userPrompt를 let으로 변경

    if (!file) {
      return NextResponse.json({ 
        error: "파일이 없습니다.", 
        step: currentStep 
      }, { status: 400 });
    }

    currentStep = "사용자 인증 확인";
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ 
        error: "인증이 필요합니다.", 
        step: currentStep 
      }, { status: 401 });
    }

    currentStep = "크레딧 확인";
    const { data: userData } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single();

    const userCredits = userData?.credits || 0;
    const requiredCredits = Math.ceil(amount / 5); // 5문제당 1크레딧

    if (userCredits < requiredCredits) {
      return NextResponse.json({ 
        error: "크레딧이 부족합니다.", 
        step: currentStep,
        details: `필요: ${requiredCredits}, 보유: ${userCredits}`
      }, { status: 402 });
    }

    currentStep = "파일 분석 API 호출";
    // 1단계: 파일 분석하여 suitabilityScore 및 처리된 텍스트 획득
    const processFormData = new FormData();
    processFormData.append("file", file);

    const processResponse = await fetch(`${request.nextUrl.origin}/api/quiz/process`, {
      method: "POST",
      body: processFormData,
    });

    if (!processResponse.ok) {
      throw new Error("파일 분석 실패");
    }

    const processData: ProcessAPIResponse = await processResponse.json();
    let { // refinedText를 let으로 변경
      refinedText,
      pageCount
    } = processData;
    
    // 텍스트 청킹(Chunking) 및 절단 (Truncation) 로직 추가
    const MAX_TEXT_LENGTH = 6000;
    if (refinedText && refinedText.length > MAX_TEXT_LENGTH) {
      console.warn(`⚠️ refinedText가 ${MAX_TEXT_LENGTH}자를 초과하여 절단됩니다. (원본: ${refinedText.length}자)`);
      refinedText = refinedText.substring(0, MAX_TEXT_LENGTH);
      
      // 텍스트가 너무 길면 문제 수를 10개로 제한
      if (amount > 10) {
        console.warn(`⚠️ 텍스트 길이 초과로 문제 수를 10개로 제한합니다. (원본: ${amount}개)`);
        amount = 10;
        // userPrompt도 업데이트하여 AI에게 전달되는 정보 일관성 유지
        userPrompt = customInstructions.trim() || `${amount}개의 문제를 생성해주세요. 문제 유형은 ${quizMode}이며, 난이도는 적절하게 조절해주세요.`;
      }
    }

    // 🚨 핵심 로그: 프로세스 API에서 받은 텍스트 길이 (절단 후)
    console.log(`📏 [프로세스 API 응답] Refined Text Length (After Truncation): ${refinedText?.length || 0}`);
    console.log(`🔤 [정제된 텍스트 샘플] "${(refinedText || '').substring(0, 200)}..."`);

    currentStep = "프롬프트 구성";
    // 외부 프롬프트 모듈을 사용하여 시스템 지시사항 생성
    const systemInstruction = generateSimpleQuizPrompt(
      amount,
      userPrompt,
      refinedText
    );

    currentStep = "AI 호출 전 검증";
    
    // 강화된 텍스트 데이터 검증 및 로깅
    console.log(`🔍 [AI 호출 전 검증] refinedText 상태:`);
    console.log(`   - 존재 여부: ${refinedText ? '✅' : '❌'}`);
    console.log(`   - 길이: ${refinedText?.length || 0}자`);
    console.log(`   - 트림 후 길이: ${refinedText?.trim().length || 0}자`);
    console.log(`   - 샘플: "${(refinedText || '').substring(0, 150)}..."`);
    
    if (!refinedText || refinedText.trim().length === 0) {
      console.error(`❌ [텍스트 검증 실패] PDF 텍스트가 비어있음`);
      return NextResponse.json({
        error: "EMPTY_PDF_TEXT",
        message: "PDF 파일에서 텍스트를 읽을 수 없습니다. 스캔된 이미지 파일이거나 암호화된 PDF일 수 있습니다.",
        details: { 
          step: currentStep, 
          textLength: refinedText?.length || 0,
          reason: "PDF가 이미지 위주이거나 텍스트 레이어가 없을 수 있습니다. OCR 처리가 필요합니다."
        }
      }, { status: 400 });
    }
    
    if (refinedText.length < 20) {
      console.error(`❌ [텍스트 길이 부족] ${refinedText.length}자 < 20자`);
      return NextResponse.json({
        error: "INSUFFICIENT_CONTENT",
        message: "PDF 내용이 너무 짧아 문제를 생성할 수 없습니다. 더 많은 내용이 포함된 파일로 시도해주세요.",
        details: { 
          step: currentStep, 
          textLength: refinedText.length,
          minRequired: 20,
          suggestion: "더 많은 텍스트가 포함된 PDF를 사용해주세요."
        }
      }, { status: 400 });
    }
    
    if (!systemInstruction || systemInstruction.trim().length === 0) {
      return NextResponse.json({
        error: "EMPTY_SYSTEM_PROMPT",
        message: "시스템 프롬프트가 생성되지 않았습니다.",
        details: { step: currentStep }
      }, { status: 500 });
    }
    
    currentStep = "Gemini API 초기화";
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json" // JSON 모드 강제
      }
    });
    
    let generationInput: any = systemInstruction;

    currentStep = "Gemini API 호출";
    console.log(`🚀 [AI 호출 준비]`);
    console.log(`   - 모델: ${GEMINI_MODEL}`);
    console.log(`   - 텍스트 길이: ${refinedText.length}자`);
    console.log(`   - 요청 문제 수: ${amount}개`);
    console.log(`   - 문제 유형: ${quizMode}`);
    console.log(`🎯 [프롬프트 길이] 시스템: ${systemInstruction.length}자, 사용자: ${userPrompt.length}자`);
    console.log(`📝 [사용자 요청] "${userPrompt}"`);
    console.log(`⚙️ [커스텀 지시사항] ${customInstructions ? '있음' : '없음 (기본값 사용)'}`);
    
    let result;
    try {
      result = await retryOperation(() => model.generateContent(generationInput));
    } catch (retryError: any) {
      console.error(`❌ [${currentStep}] 최대 재시도 횟수 초과:`, retryError);
      return NextResponse.json({
        error: "AI_SERVER_BUSY",
        message: "현재 인공지능 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.",
        step: currentStep,
        details: retryError.message
      }, { status: 503 });
    }

    const responseText = result.response.text();
    
    if (!responseText || responseText.trim().length === 0) {
      return NextResponse.json({
        error: "EMPTY_AI_RESPONSE",
        message: "AI가 빈 응답을 반환했습니다.",
        details: { step: currentStep, model: GEMINI_MODEL }
      }, { status: 500 });
    }
    
    const trimmedResponse = responseText.trim();
    if (trimmedResponse === "DATA_MISSING" || 
        trimmedResponse.startsWith("DATA_MISSING") ||
        (!trimmedResponse.includes("{") && !trimmedResponse.includes("}"))) {
      return NextResponse.json({
        error: "INSUFFICIENT_DATA",
        message: "AI가 PDF 내용을 분석했지만 적절한 문제를 생성할 수 없습니다. 다른 파일로 시도하거나 문제 유형을 변경해보세요.",
        details: { 
          step: currentStep, 
          aiResponse: trimmedResponse.substring(0, 200),
          suggestion: "더 자세한 내용이 포함된 PDF를 업로드해보세요."
        }
      }, { status: 400 });
    }

    currentStep = "AI 응답 파싱";
    
    let parsed;
    try {
      const jsonStr = responseText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("1차 JSON 파싱 실패:", parseError);
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          parsed = JSON.parse(extractedJson);
          console.log("2차 JSON 추출 성공");
        } else {
          throw new Error("JSON 형식을 찾을 수 없음");
        }
      } catch (extractError) {
        console.error("2차 JSON 추출 실패:", extractError);
        console.error("AI 원본 응답:", responseText);
        
        return NextResponse.json({
          error: "AI_RESPONSE_PARSE_ERROR",
          message: "AI 응답을 JSON으로 파싱할 수 없습니다.",
          details: {
            step: currentStep,
            rawResponse: responseText.substring(0, 500), // 처음 500자만
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          }
        }, { status: 500 });
      }
    }
    
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({
        error: "INVALID_AI_RESPONSE",
        message: "AI 응답이 유효한 객체가 아닙니다.",
        details: { step: currentStep, parsed }
      }, { status: 500 });
    }
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return NextResponse.json({
        error: "INVALID_QUESTIONS_FORMAT",
        message: "AI 응답에 유효한 questions 배열이 없습니다.",
        details: { step: currentStep, hasQuestions: !!parsed.questions, isArray: Array.isArray(parsed.questions) }
      }, { status: 500 });
    }
    
    if (parsed.questions.length === 0) {
      return NextResponse.json({
        error: "NO_QUESTIONS_GENERATED",
        message: "AI가 문제를 생성하지 못했습니다.",
        details: { 
          step: currentStep, 
          requestedAmount: amount,
          generatedCount: 0,
          suggestion: "다른 문서를 시도하거나 문제 유형을 변경해보세요."
        }
      }, { status: 400 });
    }
    
    if (parsed.questions.length < Math.floor(amount * 0.5)) {
      console.warn(`⚠️ 요청 문제 수(${amount})보다 적게 생성됨(${parsed.questions.length})`);
    }

    const questions = parsed.questions.map((q: any, qIndex: number) => {
      let ansIdx = q.correctAnswerIndex ?? q.correctAnswer;
      
      if (typeof ansIdx !== 'number') {
        console.warn(`⚠️ 문제 ${qIndex + 1}: correctAnswerIndex가 숫자가 아님 (${typeof ansIdx}), 1로 보정`);
        ansIdx = 1;
      }
      
      if (ansIdx < 1 || ansIdx > 4 || !Number.isInteger(ansIdx)) {
        console.warn(`⚠️ 문제 ${qIndex + 1}: correctAnswerIndex가 유효하지 않음 (${ansIdx}), 1로 보정`);
        ansIdx = 1;
      }
      
      const options = q.options || [];
      if (!Array.isArray(options) || options.length !== 4) {
        console.warn(`⚠️ 문제 ${qIndex + 1}: 선택지가 4개가 아님 (${options.length}개)`);
      }
      
      const normalizedOptions = options.map((opt: string, optIndex: number) => {
        const expectedPrefix = `${optIndex + 1}. `;
        if (!opt.startsWith(expectedPrefix)) {
          console.warn(`⚠️ 문제 ${qIndex + 1}, 선택지 ${optIndex + 1}: 형식이 잘못됨. "${expectedPrefix}"로 시작해야 함`);
          return expectedPrefix + opt.replace(/^[A-D]\.\s*|^[1-4]\.\s*/, '');
        }
        return opt;
      });
      
      console.log(`✅ 문제 ${qIndex + 1}: 정답 ${ansIdx}번 - "${normalizedOptions[ansIdx - 1]}"`);
      
      return {
        question: q.question || "",
        options: normalizedOptions,
        correctAnswerIndex: ansIdx,
        explanation: q.explanation || ""
      };
    });

    currentStep = "퀴즈 데이터 DB 저장";
    const quizId = crypto.randomUUID();
    const quizTitle = file.name ? `${file.name.replace('.pdf', '')} AI 퀴즈` : "AI 생성 퀴즈";
    
    const quizContent: QuizContent = {
      questions,
      generatedAt: new Date().toISOString(),
      source: file.name,
      quizMode: quizMode,
      amount
    };

    const quizInsert: QuizInsert = {
      id: quizId,
      userId: user.id,
      title: quizTitle,
      content: quizContent,
      difficulty: "medium",
      table_references: []
    };

    console.log('💾 DB 저장 데이터:', JSON.stringify(quizInsert, null, 2));

    try {
      const { error: insertError } = await supabase
        .from("Quiz")
        .insert(quizInsert);

      if (insertError) {
        if (insertError.code === "42703") {
          console.warn("Quiz 컬럼 불일치, fallback 시도 (table_references 제외)");
          const { table_references: _tr, ...fallbackData } = quizInsert;
          const { error: fallbackError } = await supabase
            .from("Quiz")
            .insert(fallbackData);

          if (fallbackError) throw fallbackError;
          console.log("✅ 퀴즈 데이터 저장 완료 (fallback 모드)");
        } else {
          throw insertError;
        }
      } else {
        console.log('✅ 퀴즈 데이터 저장 완료 (요약본 제외)');
      }
    } catch (dbError: any) {
      console.error("❌ DB 저장 실패:", dbError);
      throw new Error(`DB 저장 실패: ${dbError.message}`);
    }

    currentStep = "크레딧 차감 및 포인트 로그 기록";
    try {
      const { error: rpcError } = await supabase.rpc('log_and_deduct_credits', {
        p_user_id: user.id,
        p_amount: -requiredCredits, 
        p_description: `AI 퀴즈 생성: ${quizTitle}`,
        p_quiz_id: quizId, 
        p_type: 'usage'
      });

      if (rpcError) {
        throw rpcError;
      }
      console.log(`✅ ${requiredCredits} 포인트 차감 및 로그 기록 완료.`);
    } catch (rpcError: any) {
      console.error("❌ 크레딧 차감 및 포인트 로그 기록 실패:", rpcError);
      
      console.error(`🚨 RPC 실패로 인해 생성된 퀴즈 (${quizId}) 롤백 시도...`);
      await supabase.from("Quiz").delete().eq("id", quizId);
      console.log(`🗑️ 퀴즈 (${quizId}) 롤백 완료.`);

      if (rpcError.message.includes("INSUFFICIENT_CREDITS")) {
        throw new Error("INSUFFICIENT_CREDITS: 포인트가 부족합니다. 퀴즈가 생성되지 않았습니다.");
      }
      throw new Error(`포인트 처리 실패: ${rpcError.message}`);
    }

    currentStep = "완료";

    return NextResponse.json({
      success: true,
      quizId,
      questions,
      count: questions.length
    });

  } catch (error: any) {
    console.error(`❌ [${currentStep}] 오류:`, error);
    console.error('🔥 Server Error Detail:', error); 
    
    let errorMessage = "퀴즈 생성 중 알 수 없는 오류가 발생했습니다.";
    let statusCode = 500;

    if (error.message.includes("API 키가 설정되지 않았습니다.")) {
      errorMessage = "서버 설정 오류: Gemini API 키가 누락되었습니다.";
    } else if (error.message.includes("파일이 없습니다.")) {
      errorMessage = "파일을 업로드해주세요.";
      statusCode = 400;
    } else if (error.message.includes("인증이 필요합니다.")) {
      errorMessage = "로그인이 필요합니다. 다시 로그인해주세요.";
      statusCode = 401;
    } else if (error.message.includes("크레딧이 부족합니다.") || error.message.includes("INSUFFICIENT_CREDITS")) {
      errorMessage = "크레딧이 부족합니다. 더 많은 크레딧을 충전해주세요.";
      statusCode = 402;
    } else if (error.message.includes("파일 분석 실패")) {
      errorMessage = "파일 분석에 실패했습니다. 유효한 PDF 파일인지 확인해주세요.";
      statusCode = 500;
    } else if (error.message.includes("EMPTY_PDF_TEXT")) {
      errorMessage = "PDF 파일에서 텍스트를 읽을 수 없습니다. 스캔된 이미지 파일이거나 암호화된 PDF일 수 있습니다.";
      statusCode = 400;
    } else if (error.message.includes("INSUFFICIENT_CONTENT")) {
      errorMessage = "PDF 내용이 너무 짧아 문제를 생성할 수 없습니다. 더 많은 내용이 포함된 파일로 시도해주세요.";
      statusCode = 400;
    } else if (error.message.includes("EMPTY_SYSTEM_PROMPT")) {
      errorMessage = "퀴즈 생성 시스템에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      statusCode = 500;
    } else if (error.message.includes("AI_SERVER_BUSY")) {
      errorMessage = "현재 인공지능 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.";
      statusCode = 503;
    } else if (error.message.includes("EMPTY_AI_RESPONSE")) {
      errorMessage = "AI가 빈 응답을 반환했습니다. 잠시 후 다시 시도해주세요.";
      statusCode = 500;
    } else if (error.message.includes("INSUFFICIENT_DATA")) {
      errorMessage = "AI가 PDF 내용을 분석했지만 적절한 문제를 생성할 수 없습니다. 다른 파일로 시도하거나 문제 유형을 변경해보세요.";
      statusCode = 400;
    } else if (error.message.includes("AI_RESPONSE_PARSE_ERROR")) {
      errorMessage = "AI 응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      statusCode = 500;
    } else if (error.message.includes("INVALID_AI_RESPONSE") || error.message.includes("INVALID_QUESTIONS_FORMAT") || error.message.includes("NO_QUESTIONS_GENERATED")) {
      errorMessage = "AI가 퀴즈를 생성하는 데 실패했습니다. 파일 내용을 확인하거나 다른 파일을 시도해보세요.";
      statusCode = 400;
    } else if (error.message.includes("DB 저장 실패")) {
      errorMessage = "퀴즈 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      statusCode = 500;
    } else if (error.message.includes("포인트 처리 실패")) {
      errorMessage = "포인트 차감 및 기록 중 오류가 발생했습니다. 관리자에게 문의해주세요.";
      statusCode = 500;
    }

    return NextResponse.json({ 
      error: errorMessage, 
      step: currentStep,
      details: error.stack 
    }, { status: statusCode });
  }
}
