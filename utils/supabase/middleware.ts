import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[Middleware] Supabase URL/Key 없음 — 세션 검사 생략. Vercel 환경 변수 확인 후 재배포하세요."
    );
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: 'lax' as const,
            httpOnly: false, // 클라이언트에서 접근 가능해야 함
            secure: process.env.NODE_ENV === 'production'
          }
          request.cookies.set({ name, value, ...cookieOptions });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({ name, value, ...cookieOptions });
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: 'lax' as const,
            httpOnly: false, // 클라이언트에서 접근 가능해야 함
            secure: process.env.NODE_ENV === 'production'
          }
          request.cookies.set({ name, value: "", ...cookieOptions });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({ name, value: "", ...cookieOptions });
        }
      }
    }
  );

  try {
    // 세션 갱신 및 사용자 정보 확인
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('🔍 [Middleware] 세션 확인 실패:', error.message);
      
      // 세션이 만료되었을 수 있으므로 갱신 시도
      try {
        const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.log('🔄 [Middleware] 세션 갱신 실패:', refreshError.message);
        } else if (sessionData.user) {
          console.log('✅ [Middleware] 세션 갱신 성공:', sessionData.user.email);
        }
      } catch (refreshErr) {
        console.log('❌ [Middleware] 세션 갱신 중 오류:', refreshErr);
      }
    } else if (user) {
      console.log('✅ [Middleware] 세션 확인 성공:', user.email);
    } else {
      console.log('ℹ️ [Middleware] 세션 없음');
    }
  } catch (error) {
    console.error('❌ [Middleware] 세션 처리 중 오류:', error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     * - .*
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*) ', 
    '/((?!api|static|favicon.ico|_next).*) '
  ],
};
