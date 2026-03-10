import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    let response = NextResponse.redirect(`${origin}${next}`)
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            const cookieOptions = {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              httpOnly: false, // 클라이언트에서 접근 가능해야 함
              secure: process.env.NODE_ENV === 'production'
            }
            request.cookies.set({ name, value, ...cookieOptions })
            response.cookies.set({ name, value, ...cookieOptions })
          },
          remove(name: string, options: CookieOptions) {
            const cookieOptions = {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              httpOnly: false, // 클라이언트에서 접근 가능해야 함
              secure: process.env.NODE_ENV === 'production'
            }
            request.cookies.set({ name, value: '', ...cookieOptions })
            response.cookies.set({ name, value: '', ...cookieOptions })
          },
        },
      }
    )

    try {
      console.log('🔄 [Auth Callback] 코드 교환 시작')
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌ [Auth Callback] 세션 교환 실패:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }

      if (data.user && data.session) {
        console.log('✅ [Auth Callback] 세션 생성 성공:', data.user.email)

        // 사용자 프로필 정보 DB 동기화
        const userName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name || 
                        data.user.email?.split('@')[0] || 
                        '익명 사용자'
        
        const userImageUrl = data.user.user_metadata?.avatar_url || 
                            data.user.user_metadata?.picture || 
                            null

        try {
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              name: userName,
              avatar_url: userImageUrl,
            }, {
              onConflict: 'id'
            })

          if (upsertError) {
            console.error('❌ [Auth Callback] 사용자 정보 저장 실패:', upsertError)
          } else {
            console.log('✅ [Auth Callback] 사용자 정보 저장 성공')
          }
        } catch (dbError) {
          console.error('❌ [Auth Callback] DB 저장 중 예외:', dbError)
        }

        console.log('✅ [Auth Callback] 세션 쿠키 자동 설정됨')
        return response
      }
    } catch (error) {
      console.error('❌ [Auth Callback] 예외 발생:', error)
    }
  }

  // 에러 발생 시 에러 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}