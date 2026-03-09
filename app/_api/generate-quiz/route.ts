import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser, getUserPoints, deductPoints } from "@/lib/supabase/auth-helpers";
import { checkIPRateLimit, checkUserRateLimit, getClientIP, getRetryAfter, RATE_LIMITS } from "@/lib/rate-limiter";
import type { GenerateQuizResponse, GenerateQuizError, MultipleChoiceQuestion } from "@/types/quiz";

// Route Segment Config
export const runtime = "nodejs";
export const maxDuration = 60; // AI 생성은 시간이 걸림
export const dynamic = "force-dynamic";

/**
 * AI 문제 생성 API
 * @method POST /api/generate-quiz
 * @requires 인증 필수
 * @cost 1 크레딧
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const clientIP = getClientIP(request);
    const ipRateLimit = checkIPRateLimit(clientIP, RATE_LIMITS.aiGeneration || { maxRequests: 3, windowMs: 60000 });

    if (!ipRateLimit.allowed) {
      const retryAfter = getRetryAfter(ipRateLimit.resetAt);
      return NextResponse.json<GenerateQuizError>(
        {
          error: "현재 사용자가 많아 잠시 후 다시 시도해 주세요.",
          code: "RATE_LIMIT_EXCEEDED",
          details: `${retryAfter}초 후 재시도 가능`
        },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } }
      );
    }

    // 2. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<GenerateQuizError>(
        { error: "로그인이 필요합니다.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 3. 포인트 확인
    const userPoints = await getUserPoints(user.id);
    const requiredCredits = 1; // 문제 생성 1 크레딧

    if (userPoints.remaining_points < requiredCredits) {
      return NextResponse.json<GenerateQuizError>(
        {
          error: "크레딧이 부족합니다.",
          code: "INSUFFICIENT_CREDITS",
          details: `필요: ${requiredCredits}, 보유: ${userPoints.remaining_points}`
        },
        { status: 402 }
      );
    }

    // 4. 요청 데이터 파싱
    const body = await request.json();
    const { pdfText, questionCount = 5, difficulty = "medium" } = body;

    if (!pdfText || typeof pdfText !== "string") {
      return NextResponse.json<GenerateQuizError>(
        { error: "PDF 텍스트가 필요합니다.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // 텍스트 길이 제한 (너무 길면 자르기)
    const maxTextLength = 8000;
    const truncatedText = pdfText.length > maxTextLength 
      ? pdfText.substring(0, maxTextLength) + "..." 
      : pdfText;

    // 5. Gemini API 초기화
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY 환경변수 없음");
      return NextResponse.json<GenerateQuizError>(
        { error: "AI 서비스를 사용할 수 없습니다.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // 모델 ID 설정 (안전장치: gemini-flash-latest 사용 가능)
    const modelId = process.env.GEMINI_MODEL_ID || "gemini-3-flash-preview";
    const model = genAI.getGenerativeModel({ model: modelId });

    // 6. AI 프롬프트 생성
    const prompt = `당신은 대학생을 위한 시험 문제 출제 전문가입니다.
다음 강의 자료에서 ${questionCount}개의 객관식 문제를 만들어주세요.

**강의 자료:**
${truncatedText}

**요구사항:**
- 정확히 ${questionCount}개의 객관식 문제 생성
- 각 문제는 4개의 선택지 (A, B, C, D)
- 난이도: ${difficulty === "easy" ? "쉬움 (기본 개념)" : difficulty === "hard" ? "어려움 (심화 응용)" : "중간 (핵심 이해)"}
- 한국어로 작성
- 강의 자료의 핵심 내용을 다룰 것

**출력 형식 (JSON):**
{
  "questions": [
    {
      "question": "문제 내용",
      "options": ["A 선택지", "B 선택지", "C 선택지", "D 선택지"],
      "correctAnswer": 0,
      "explanation": "정답 해설"
    }
  ]
}

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`;

    // 7. AI 문제 생성
    console.log("🤖 [AI] 문제 생성 시작...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("📝 [AI] 응답 받음:", text.substring(0, 200) + "...");

    // 8. JSON 파싱
    let parsedQuestions;
    try {
      // JSON 추출 (```json ... ``` 또는 순수 JSON)
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      
      parsedQuestions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("❌ [AI] JSON 파싱 실패:", parseError);
      console.error("원본 텍스트:", text);
      return NextResponse.json<GenerateQuizError>(
        { error: "AI 응답을 파싱할 수 없습니다.", code: "PARSE_ERROR", details: text.substring(0, 500) },
        { status: 500 }
      );
    }

    // 9. 데이터 검증
    if (!parsedQuestions.questions || !Array.isArray(parsedQuestions.questions)) {
      return NextResponse.json<GenerateQuizError>(
        { error: "유효하지 않은 문제 형식입니다.", code: "INVALID_FORMAT" },
        { status: 500 }
      );
    }

    // 10. 문제 정규화
    const questions: MultipleChoiceQuestion[] = parsedQuestions.questions.map((q: any, idx: number) => ({
      id: `q-${Date.now()}-${idx}`,
      question: q.question || "",
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || "",
      difficulty: difficulty
    }));

    // 11. 포인트 차감
    console.log("💰 [Credits] 차감 중...");
    await deductPoints(
      user.id,
      requiredCredits,
      "question_generation",
      `AI 문제 ${questions.length}개 생성`,
      { questionCount: questions.length, difficulty }
    );

    const remainingCredits = userPoints.remaining_points - requiredCredits;
    console.log(`✅ [Credits] 차감 완료: ${userPoints.remaining_points} → ${remainingCredits}`);

    // 12. 퀴즈 세트 생성
    const quizSet = {
      id: `quiz-${Date.now()}`,
      title: `AI 생성 문제 ${new Date().toLocaleDateString()}`,
      questions: questions,
      totalQuestions: questions.length,
      createdAt: new Date()
    };

    // 13. 응답
    return NextResponse.json<GenerateQuizResponse>({
      success: true,
      quizSet: quizSet,
      creditsUsed: requiredCredits,
      remainingCredits: remainingCredits
    });

  } catch (error) {
    console.error("❌ [API] 문제 생성 실패:", error);
    
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_POINTS") {
        return NextResponse.json<GenerateQuizError>(
          { error: "크레딧이 부족합니다.", code: "INSUFFICIENT_CREDITS" },
          { status: 402 }
        );
      }
    }

    return NextResponse.json<GenerateQuizError>(
      { error: "문제 생성에 실패했습니다.", code: "GENERATION_FAILED" },
      { status: 500 }
    );
  }
}
