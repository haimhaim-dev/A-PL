import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🚨 Supabase 환경변수가 설정되지 않았습니다!');
    console.error('다음 환경변수를 .env.local 파일에 추가하세요:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web'
        }
      }
    }
  )
}