import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieOptions = {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              httpOnly: false, // 클라이언트에서 접근 가능해야 함
              secure: process.env.NODE_ENV === 'production'
            }
            cookieStore.set({ name, value, ...cookieOptions })
          } catch (error) {
            // Server Component에서 호출된 경우 무시
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const cookieOptions = {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              httpOnly: false, // 클라이언트에서 접근 가능해야 함
              secure: process.env.NODE_ENV === 'production'
            }
            cookieStore.set({ name, value: '', ...cookieOptions })
          } catch (error) {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  )
}