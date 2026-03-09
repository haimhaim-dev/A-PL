"use client";

/**
 * Quiz Generation 커스텀 훅
 * 퀴즈 생성 관련 비즈니스 로직 중앙 집중 관리
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth"; // useAuth import 추가
import { getSupabaseClient } from "@/lib/supabase/singleton";
import { processPDFBuffer, intelligentSummary } from "@/lib/pdf-processing";
import { calculateChunkScore, recommendDocumentType, generateSystemInstruction, generateAdaptationContext, generateSelfCorrectionPrompt, generateBridgeQuestionStrategy } from "@/lib/document-processor";
import type { ProcessAPIResponse, AIAnalysisResult } from "@/types/process-api";
import type { QuizRow, QuizQuestion } from "@/types/quiz-db";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { ExportHistoryInsert } from "@/types/export-history"; // ExportHistoryInsert 타입 임포트

type PageState = "upload" | "analyzing" | "settings" | "generating";
type QuizMode = "AUTO" | "TERM" | "CONCEPT" | "CALC";

interface QuizGenerationSettings {
  quizMode: QuizMode;
  amount: number;
}

export function useQuizGeneration() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const { refreshCredits, refreshQuizzes } = useAuth(); // useAuth에서 refreshCredits, refreshQuizzes 가져옴

  // 상태 관리
  const [state, setState] = React.useState<PageState>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = React.useState<AIAnalysisResult | null>(null);
  const [settings, setSettings] = React.useState<QuizGenerationSettings>({
    quizMode: "AUTO",
    amount: 10,
  });
  const [currentQuizId, setCurrentQuizId] = React.useState<string | null>(null);

  // 파일 분석
  const analyzeFile = React.useCallback(async (selectedFile: File, supabaseClient: SupabaseClient, userId: string) => {
    setFile(selectedFile);
    setState("analyzing");
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    showWarning("문서 분석 중... 잠시만 기다려주세요.");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/quiz/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "문서 분석 실패");
      }

      const result: ProcessAPIResponse = await response.json();
      console.log('📡 [DEBUG] REAL_RESPONSE 전체 구조:', result);
      console.log('📡 [DEBUG] REAL_RESPONSE 키 목록:', Object.keys(result));
      console.log('📦 AI Full Response:', JSON.stringify(result, null, 2));
      console.log('📡 REAL_RESPONSE:', result);

      // AI 응답의 구조가 변경되었을 가능성을 대비하여 방어적으로 접근
      const analysisResult = result.analysisResult || result.data?.analysisResult || result; // 유연하게 데이터 접근

      if (analysisResult) { // refinedText가 비어있어도 analysisResult 객체 자체는 존재해야 함
        setAiAnalysisResult(analysisResult);

        // 분석 완료 - 설정 단계로 이동

        showSuccess("문서 분석이 완료되었습니다. 맞춤형 시험 문제를 생성할 준비가 되었습니다.");
        setState("settings");
      } else {
        throw new Error("AI 분석 결과 객체가 비어있습니다. 응답 구조를 확인해주세요.");
      }
    } catch (error: any) {
      console.error("❌ 문서 분석 오류:", error);
      showError("문서 분석 실패", error.message || "파일이 올바른 PDF 형식이거나, 텍스트를 포함하지 않을 수 있습니다.");
      setState("upload");
    } finally {
      setIsAnalyzing(false);
    }
  }, [showSuccess, showError, showWarning]);

  // 퀴즈 생성
  const generateQuiz = React.useCallback(async (quizTitle: string, supabaseClient: SupabaseClient, userId: string, customInstructions?: string) => {
    if (!file || !aiAnalysisResult) {
      showError("파일 분석이 먼저 완료되어야 합니다.");
      return;
    }
    if (!userId) {
      showError("로그인 후 이용해주세요. 계정이 없으시면 간편 회원가입을 진행해주세요.");
      return;
    }
    if (!supabaseClient) {
      showError("Supabase 클라이언트가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGenerating(true);
    showWarning("AI가 시험 문제를 생성 중입니다. 잠시만 기다려주세요.");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quizMode", settings.quizMode);
      formData.append("amount", settings.amount.toString());
      if (customInstructions) {
        formData.append("customInstructions", customInstructions);
      }
      
      const response = await fetch("/api/simple-generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "시험 문제 생성 실패");
      }

      const result = await response.json();
      console.log("✅ [퀴즈 생성 완료] 결과:", result);

      if (result.quizId) {
        // 퀴즈 데이터를 DB에 저장
        const quizId = result.quizId;
        setCurrentQuizId(quizId);

        // 퀴즈 저장 후 이동
        showSuccess("시험 문제가 성공적으로 생성되었습니다. 학습을 시작해 보세요!");
        router.push(`/quiz/${quizId}`);
        await refreshCredits(); // 크레딧 새로고침
        await refreshQuizzes(); // 퀴즈 목록 새로고침
      } else {
        throw new Error("생성된 퀴즈 ID가 없습니다.");
      }
    } catch (error: any) {
      console.error("❌ 퀴즈 생성 오류:", error);
      showError("시험 문제 생성 실패", error.message || "AI가 문제를 생성하는 데 실패했습니다. 파일 내용이나 설정을 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  }, [file, aiAnalysisResult, settings, showSuccess, showError, showWarning, router, refreshCredits, refreshQuizzes]);

  // 상태 리셋
  const resetState = React.useCallback(() => {
    setState("upload");
    setFile(null);
    setIsAnalyzing(false);
    setIsGenerating(false);
    setAiAnalysisResult(null);
    setSettings({
      quizMode: "AUTO",
      amount: 10,
    });
    setCurrentQuizId(null);
  }, []);

  // 설정 업데이트
  const updateSettings = React.useCallback((newSettings: Partial<QuizGenerationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  // 기존 퀴즈 로드
  const loadExistingQuiz = React.useCallback(async (quizId: string, supabaseClient: SupabaseClient) => {
    if (!supabaseClient) {
      console.warn('⚠️ [loadExistingQuiz] Supabase 클라이언트 미준비 - 데이터 조회 건너뜜');
      return null; // 클라이언트가 없으면 null 반환
    }
    console.log('🔍 [loadExistingQuiz] 시작 - quizId:', quizId); // 시작점 로깅
    try {
      const { data: quizData, error } = await supabaseClient
        .from('Quiz')
        .select('*')
        .eq('id', quizId)
        .single();

      console.log('Raw Existing Quiz Response:', { data: quizData, error }); // Raw Result 로깅

      if (error) {
        console.error('Existing Quiz Fetch Error Details:', error.message, 'Code:', (error as any).code); // 에러 상세 로그 추가
        throw error;
      }

      if (!quizData) {
        console.log('⚠️ [loadExistingQuiz] 데이터 없음: 해당 퀴즈가 존재하지 않습니다.');
        throw new Error("퀴즈를 찾을 수 없습니다.");
      }

      setFile(null); // 기존 파일은 리셋
      setAiAnalysisResult({ 
        refinedText: quizData.processed_content || '',
        summary: quizData.content?.source || '',
        tableReferences: quizData.table_references || [],
        suitability: quizData.content?.suitabilityScore || { term: 0, concept: 0, calc: 0 },
        recommendedDocType: quizData.document_preset || "LECTURE",
        autoQuizMode: quizData.content?.quizMode || "AUTO",
        pageCount: 0,
      });
      setSettings({
        quizMode: (quizData.content?.quizMode || "AUTO") as QuizMode,
        amount: quizData.content?.amount || 10,
      });
      setCurrentQuizId(quizId);
      setState("settings");
      showSuccess("이전 퀴즈를 성공적으로 불러왔습니다. 다시 문제를 생성하거나 설정을 변경하세요.");
      return quizData; // 로드된 퀴즈 데이터 반환
    } catch (error: any) {
      console.error("퀴즈 로드 중 예외 발생:", error);
      console.error("Error Message:", error.message, "Error Code:", error.code); // 상세 에러 로깅
      showError("퀴즈 로드 실패", error.message || "이전 퀴즈를 불러오는 데 실패했습니다. 퀴즈 ID를 확인해주세요.");
      return null;
    } finally {
      // 로딩 상태는 반드시 해제
      // 이 훅은 직접적인 로딩 상태를 가지고 있지 않으므로, 호출하는 컴포넌트에서 로딩 상태를 관리해야 함。
    }
  }, [showSuccess, showError]); // supabaseClient를 의존성에서 제거

  // 사용자 퀴즈 목록 조회 (10개 제한)
  const getUserQuizzes = React.useCallback(async (supabaseClient: SupabaseClient, userId: string) => {
    if (!supabaseClient) {
      console.warn('⚠️ [getUserQuizzes] Supabase 클라이언트 미준비 - 데이터 조회 건너뜜');
      return [];
    }
    console.log('🔍 [getUserQuizzes] 시작 - userId:', userId); // 시작점 로깅
    try {
      const { data: quizzes, error } = await supabaseClient
        .from('Quiz')
        .select('id, title, createdAt, difficulty, document_preset, content')
        .eq('userId', userId)
        .order("createdAt", { ascending: false })
        .limit(10);

      console.log('Raw User Quizzes Response:', { data: quizzes, error }); // Raw Result 로깅

      if (error) {
        console.error('User Quizzes Fetch Error Details:', error.message, 'Code:', (error as any).code); // 에러 상세 로그 추가
        throw error;
      }

      if (quizzes && quizzes.length === 0) {
        console.log('⚠️ [getUserQuizzes] 데이터 없음: 조회된 퀴즈가 없습니다.');
      }

      return quizzes || [];
    } catch (error: any) {
      console.error("퀴즈 목록 조회 중 예외 발생:", error);
      console.error("Error Message:", error.message, "Error Code:", error.code); // 상세 에러 로깅
      return [];
    } finally {
      // 로딩 상태는 반드시 해제
      // 이 훅은 직접적인 로딩 상태를 가지고 있지 않으므로, 호출하는 컴포넌트에서 로딩 상태를 관리해야 함。
    }
  }, []); // supabaseClient를 의존성에서 제거

  // 사용자의 전체 퀴즈 목록 조회 (제한 없음)
  const getAllUserQuizzes = React.useCallback(async (supabaseClient: SupabaseClient, userId: string) => {
    if (!supabaseClient) {
      console.warn('⚠️ [getAllUserQuizzes] Supabase 클라이언트 미준비 - 데이터 조회 건너뜜');
      return [];
    }
    console.log('🔍 [getAllUserQuizzes] 시작 - userId:', userId); // 시작점 로깅
    try {
      const { data: quizzes, error } = await supabaseClient
        .from('Quiz')
        .select('id, title, createdAt, difficulty, document_preset, content')
        .eq('userId', userId)
        .order("createdAt", { ascending: false });

      console.log('Raw All Quizzes Response:', { data: quizzes, error }); // Raw Result 로깅

      if (error) {
        console.error('All Quizzes Fetch Error Details:', error.message, 'Code:', (error as any).code); // 에러 상세 로그 추가
        throw error;
      }

      if (quizzes && quizzes.length === 0) {
        console.log('⚠️ [getAllUserQuizzes] 데이터 없음: 조회된 퀴즈가 없습니다.');
      }

      return quizzes || [];
    } catch (error: any) {
      console.error("전체 퀴즈 목록 조회 중 예외 발생:", error);
      console.error("Error Message:", error.message, "Error Code:", error.code); // 상세 에러 로깅
      return [];
    } finally {
      // 로딩 상태는 반드시 해제
      // 이 훅은 직접적인 로딩 상태를 가지고 있지 않으므로, 호출하는 컴포넌트에서 로딩 상태를 관리해야 함。
    }
  }, []); // supabaseClient를 의존성에서 제거

  // 내보내기 함수 구현 - 완전 재작성
  const handleExportToText = React.useCallback(async (quizId: string, supabaseClient: SupabaseClient, userId: string) => {
    if (!supabaseClient) {
      console.warn('⚠️ [handleExportToText] Supabase 클라이언트 미준비 - 내보내기 중단');
      showError("Supabase 클라이언트가 준비되지 않아 내보내기 기능을 이용할 수 없습니다.");
      return;
    }

    // 1. 세션 명시적 확인
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session || !session.user) {
      console.error('❌ [Export] 세션 확인 실패:', sessionError?.message || "세션 없음");
      showError("로그인 세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.");
      router.push("/login");
      return;
    }
    const currentUserId = session.user.id; // 현재 유저 ID 사용

    console.log('🔄 [Export] 시작 - quizId:', quizId, 'currentUserId:', currentUserId); // 시작점 로깅

    try {
      // 2. 데이터 Fetch 및 파일명 추출 강화
      // Quiz 테이블에서 데이터 조회
      const { data: quizData, error: quizDataError } = await supabaseClient
        .from('Quiz')
        .select('*')
        .eq('id', quizId)
        .eq('userId', currentUserId) // 현재 로그인한 사용자 ID로 필터링
        .single();

      console.log('Raw Export Quiz Data Response:', { data: quizData, error: quizDataError }); // Raw Result 로깅

      if (quizDataError) {
        console.error('Export Quiz Data Fetch Error Details:', quizDataError.message, 'Code:', (quizDataError as any).code); // 에러 상세 로그 추가
        showError("선택한 퀴즈 데이터를 찾을 수 없습니다. 퀴즈가 삭제되었거나 접근 권한이 없을 수 있습니다.");
        return;
      }

      if (!quizData) {
        console.log('⚠️ [handleExportToText] 데이터 없음: 내보낼 퀴즈 데이터가 존재하지 않습니다.');
        showError("선택한 퀴즈 데이터를 찾을 수 없습니다. 퀴즈가 삭제되었거나 접근 권한이 없을 수 있습니다.");
        return;
      }

      // 파일명 추출 및 정제
      const rawTitle = quizData.title || '이름_없는_문제집';
      
      // sanitizeFilename 로직: 파일명에 포함될 수 없는 특수문자를 언더바로 치환
      const sanitizeFilename = (filename: string): string => {
        return filename.replace(/[/\\?%*:|"<> ]/g, '_');
      };
      
      const sanitizedTitle = sanitizeFilename(rawTitle);

      // 데이터 파싱: questions 필드 처리
      let questions: QuizQuestion[] = [];
      
      if (quizData.content?.questions) {
        if (typeof quizData.content.questions === 'string') {
          // 문자열 형태라면 JSON.parse로 변환
          try {
            questions = JSON.parse(quizData.content.questions);
          } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            questions = [];
          }
        } else if (Array.isArray(quizData.content.questions)) {
          // 이미 배열 형태라면 그대로 사용
          questions = quizData.content.questions;
        }
      }

      console.log("📝 [Export] 파싱된 문제 수:", questions.length);

      if (questions.length === 0) {
        console.error("Export Error:", { quizId, fetchResult: { data: quizData, error: quizDataError }, parsedQuestions: questions });
        showError("퀴즈에 문제가 포함되어 있지 않습니다. 문제 생성이 완료된 후 다시 시도해주세요.");
        return;
      }

      // 3. 동적 파일명 규정
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const filename = `${dateStr}_${sanitizedTitle}_에이쁠_문제집.txt`;
      const filePath = `/exports/${currentUserId}/${filename}`; // 스토리지 경로

      console.log("📂 [Export] 생성될 파일명:", filename);
      console.log("📂 [Export] 스토리지 파일 경로:", filePath);

      // 4. 정밀 텍스트 포맷팅 알고리즘
      const createdAt = quizData.createdAt;
      
      let formattedText = `=========================================\n🎓 에이쁠(A-Pl) 학습 문제집\n=========================================\n📂 원본 소스: ${rawTitle}\n📅 생성 일시: ${new Date(createdAt).toLocaleString()}\n🔢 문항 수: ${questions.length}문항\n-----------------------------------------\n\n`;

      // 문제 포맷팅
      questions.forEach((q: QuizQuestion, i: number) => {
        formattedText += `[문제 ${i + 1}] 질문: ${q.questionText || q.question || '질문 내용 없음'}\n\n`;
        
        if (q.options && Array.isArray(q.options)) {
          formattedText += `보기:\n`;
          q.options.forEach((opt: string, oi: number) => {
            formattedText += `  (${oi + 1}) ${opt}\n`;
          });
          formattedText += `\n`;
        }
        
        formattedText += `정답: ${q.answer || `${q.correctAnswerIndex}번` || '정답 정보 없음'}\n\n`;
        formattedText += `해설: ${q.explanation || '해설 없음'}\n\n`;
        formattedText += `-----------------------------------------\n\n`;
      });

      formattedText += `✨ 에이쁠과 함께라면 A+도 어렵지 않습니다!\n`;

      // 5. 파일 다운로드 실행 로직 (UTF-8 BOM 추가)
      const textWithBOM = '\uFEFF' + formattedText; // UTF-8 BOM 접두어 추가
      const blob = new Blob([textWithBOM], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      
      // 메모리 해제
      window.URL.revokeObjectURL(url);

      // 6. ExportHistory에 기록 (POST API 호출)
      const exportHistoryData: ExportHistoryInsert = {
        user_id: currentUserId,
        quiz_id: quizId,
        file_name: filename,
        file_path: filePath, // 실제 저장 경로가 아닌, 추적용 경로로 사용
      };

      console.log('📝 [ExportHistory] DB 저장 시도 데이터:', exportHistoryData);
      const exportResponse = await fetch("/api/export-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportHistoryData),
      });

      const exportResult = await exportResponse.json();

      if (exportResult.success) {
        console.log("✅ [ExportHistory] DB 저장 성공:", exportResult.data);
        showSuccess("성공적으로 내보냈고 기록되었습니다.");
      } else {
        console.error("❌ [ExportHistory] DB 저장 실패:", exportResult.error || "알 수 없는 오류");
        showError("내보내기 기록 저장에 실패했습니다. 관리자에게 문의해주세요.");
      }
      
    } catch (error: any) {
      // 7. 예외 처리 및 디버깅
      console.error("Export Error:", { quizId, error });
      console.error("Error Message:", error.message, "Error Code:", error.code); // 상세 에러 로깅
      showError("파일 다운로드 중 문제가 발생했습니다. 브라우저 설정에서 다운로드가 차단되었는지 확인해주세요.");
    } finally {
      // 로딩 상태는 반드시 해제
      // 이 훅은 직접적인 로딩 상태를 가지고 있지 않으므로, 호출하는 컴포넌트에서 로딩 상태를 관리해야 함。
    }
  }, [showError, showSuccess, router]);

  return {
    // 상태
    state,
    file,
    isAnalyzing,
    isGenerating,
    aiAnalysisResult,
    settings,
    
    // 액션
    analyzeFile,
    generateQuiz,
    resetState,
    updateSettings,
    loadExistingQuiz,
    getUserQuizzes,
    getAllUserQuizzes,
    handleExportToText,
  };
}