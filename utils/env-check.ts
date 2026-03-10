/**
 * 환경변수 검증 유틸리티
 */

export function checkSupabaseEnv(): {
  isValid: boolean;
  missing: string[];
  url?: string;
  anonKey?: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const missing: string[] = [];
  
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  return {
    isValid: missing.length === 0,
    missing,
    url,
    anonKey
  };
}

export function checkRequiredEnv(): {
  isValid: boolean;
  missing: string[];
} {
  const supabaseCheck = checkSupabaseEnv();
  const geminiKey = process.env.GEMINI_API_KEY;
  
  const missing = [...supabaseCheck.missing];
  if (!geminiKey) missing.push('GEMINI_API_KEY');
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

export function logEnvStatus() {
  const supabaseCheck = checkSupabaseEnv();
  const geminiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 [ENV] 환경변수 상태 체크:');
  console.log(`   SUPABASE_URL: ${supabaseCheck.url ? '✅ 설정됨' : '❌ 누락'}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseCheck.anonKey ? '✅ 설정됨' : '❌ 누락'}`);
  console.log(`   GEMINI_API_KEY: ${geminiKey ? '✅ 설정됨' : '❌ 누락'}`);
  
  if (!supabaseCheck.isValid) {
    console.error('🚨 [ENV] Supabase 환경변수가 누락되어 로그인이 작동하지 않습니다!');
    console.error('📋 [ENV] 누락된 변수:', supabaseCheck.missing.join(', '));
  }
}