// 🔧 Polyfill: Promise.withResolvers (Node.js 20 호환성)
if (typeof Promise.withResolvers === "undefined") {
  (Promise as any).withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import type { QuizInsert, QuizContent } from "@/types/quiz-db";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

// 모델 ID 설정 (안전장치: gemini-flash-latest 사용 가능)
const GEMINI_MODEL = process.env.GEMINI_MODEL_ID || "gemini-3-flash-preview";
// 대안: "gemini-flash-latest" (불안정할 경우 사용)
const API_VERSION = "v1";
const BASE_URL = "https://generativelanguage.googleapis.com";

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const { 
      refinedText, 
      tablesMetadata, 
      suitability, 
      docType, 
      quizMode = "AUTO", 
      isManual = false, // 추가: 사용자가 직접 설정했는지 여부
      amount = 5, 
      difficulty = "medium", 
      fileName 
    } = await request.json();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 1. 모드에 따른 전략 지침 구성
    let strategyInstruction = "";
    let finalQuizMode = quizMode;

    if (quizMode === "AUTO") {
      // 분석된 suitability 점수가 높은 유형 위주로 혼합
      const scores = Object.entries(suitability || { term: 0, concept: 0, calc: 0 })
        .sort(([, a]: any, [, b]: any) => b - a);
      const topType = scores[0][0];
      const topLabel = topType === "term" ? "용어/정의" : topType === "concept" ? "개념/원리" : "수치/계산";
      strategyInstruction = `너는 문서 분석 결과에 따라 가장 적절한 문제 스타일을 스스로 결정해라. 현재 문서 분석 결과 ${topLabel} 관련 비중이 높으므로 이를 중심으로 다른 유형들도 적절히 혼합하여 퀴즈를 구성하십시오.`;
      finalQuizMode = topType.toUpperCase();
    } else {
      // 명시적 모드: 해당 유형에 80% 이상 집중
      const modeLabel = quizMode === "TERM" ? "용어/정의" : quizMode === "CONCEPT" ? "개념/원리" : "수치/계산";
      strategyInstruction = `사용자가 '${modeLabel} 집중' 모드를 선택했습니다. 분석 점수와 상관없이 전체 문제의 80% 이상을 ${modeLabel} 관련 내용으로 출제하십시오.`;
    }

    // 2. 프롬프트 구성
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // 표 상태에 따른 주의사항 구성
    const tableWarnings = tablesMetadata?.map((table: any) => {
      if (table.parse_status === 'pending' || table.parse_status === 'raw') {
        return `[주의] 표 ID ${table.id}는 구조화되지 않은 원문 형태입니다. 수치 해석 시 문맥을 신중히 파악하십시오.`;
      }
      return null;
    }).filter(Boolean).join('\n') || "참조할 특이 표가 없습니다.";

    const systemInstruction = `당신은 대학 교육 전문가이자 시험 문제 출제 전문가입니다.

**핵심 원칙:**
1. **데이터 근거 중심**: 지문에 명확한 근거가 없는 경우 절대 수치를 조작하거나 추측하지 마십시오. 근거가 부족하여 문제를 낼 수 없다면 해당 문항에 대해 "DATA_MISSING"을 반환하십시오.
2. **요약본(SUMMARY) 활용**: "Summary"라고 표시된 텍스트는 전체적인 맥락 파악용으로만 사용하십시오. 실제 문제는 "KEEP" 데이터와 표의 수치를 기반으로 출제해야 합니다.
3. **표 참조 원칙**: 제공된 표 데이터를 우선적으로 참조하되, 'raw' 상태인 표는 텍스트 내에서 수치 간의 관계를 신중히 해석하십시오.
    // 4. **출력 형식 엄수**: 선택지는 반드시 ABCD 영어로 표기하며, 정답 번호(1~4)와 해설 내의 번호 언급도 반드시 1부터 시작하도록 일치시키십시오. 0번은 절대 사용하거나 언급하지 마십시오. 모든 인덱스는 1-based (1, 2, 3, 4)입니다.

**문제 출제 전략:**
${strategyInstruction}

**문제 출제 요구사항:**
- 입력된 자료를 바탕으로 객관식 문제를 생성하십시오.
- 문서 유형: ${docType}
- 난이도: ${difficulty}
- 문제 수: 정확히 ${amount}개 (불가능할 경우 가능한 만큼만 내고 나머지는 DATA_MISSING)
- 형식: 각 문제는 4개의 선택지(A, B, C, D)와 상세한 해설을 포함해야 합니다.

---
**[참조 데이터]**
${refinedText}

**[표 주의사항]**
${tableWarnings}

**출력 형식 (JSON):**
{
  "questions": [
    {
      "question": "문제 내용",
      "options": ["A. 선택지1", "B. 선택지2", "C. 선택지3", "D. 선택지4"],
      "correctAnswerIndex": 1, // 1부터 시작 (1:A, 2:B, 3:C, 4:D)
      "explanation": "상세 해설 (정답인 X번이 왜 정답인지 설명 포함)",
      "status": "OK" // 또는 "DATA_MISSING"
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();

    try {
      // JSON 추출 (Markdown 코드 블록 제거)
      const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      
      // 🛡️ 방어 코드: correctAnswerIndex 보정 (0 -> 1)
      let questions = parsed.questions
        .filter((q: any) => q.status !== "DATA_MISSING")
        .map((q: any) => {
          let ansIdx = q.correctAnswerIndex ?? q.correctAnswer;
          // 0으로 들어오면 1을 더함, 혹은 0-3 범위를 1-4로 보정
          if (ansIdx === 0) ansIdx = 1;
          // 1-4 범위를 벗어나는 값 방지 (기본값 1)
          if (typeof ansIdx !== 'number' || ansIdx < 1 || ansIdx > 4) ansIdx = 1;
          
          return { ...q, correctAnswerIndex: ansIdx };
        });

      // DB 저장 로직
      let quizId = crypto.randomUUID();
      const quizTitle = fileName ? `${fileName} AI 퀴즈` : (questions[0]?.question?.substring(0, 50) || "AI 퀴즈");
      
      const { error: saveError } = await supabase.from("Quiz").insert({
        id: quizId,
        userId: user.id,
        title: quizTitle,
        difficulty,
        document_preset: isManual ? "MANUAL" : `AUTO_${finalQuizMode}`, // 🎯 자동/수동 구분 저장
        content: {
          questions,
          generatedAt: new Date().toISOString(),
          source: fileName || "refined_text",
          docType,
          quizMode: quizMode
        }
      });

      if (saveError) throw saveError;

      return NextResponse.json({
        success: true,
        quizId,
        questions,
        count: questions.length
      });

    } catch (parseError) {
      console.error("❌ 응답 파싱 실패:", responseText);
      return NextResponse.json({ error: "AI 응답 파싱 실패", details: responseText }, { status: 500 });
    }

  } catch (error: any) {
    console.error("❌ 문제 생성 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
