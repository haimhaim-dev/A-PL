"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import type { QuizRow } from '@/types/quiz-db'
import type { QuizAttempt } from '@/types/activity'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  credits: number
  isLoadingCredits: boolean
  isCreditsLoaded: boolean // <--- 이 한 줄을 추가
  creditsError: string | null
  userQuizzes: QuizRow[]
  isUserQuizzesLoaded: boolean
  allUserQuizzes: QuizRow[]
  isAllUserQuizzesLoaded: boolean
  userQuizAttempts: QuizAttempt[]
  isUserQuizAttemptsLoaded: boolean
  signOut: () => Promise<void>
  refreshCredits: () => Promise<void>
  refreshQuizzes: () => Promise<void>
  refreshQuizAttempts: () => Promise<void>
  supabase: SupabaseClient | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState<number>(0)
  const [isLoadingCredits, setIsLoadingCredits] = useState(false)
  const [creditsError, setCreditsError] = useState<string | null>(null)
  const [userQuizzes, setUserQuizzes] = useState<QuizRow[]>([])
  const [isUserQuizzesLoaded, setIsUserQuizzesLoaded] = useState(false)
  const [allUserQuizzes, setAllUserQuizzes] = useState<QuizRow[]>([])
  const [isAllUserQuizzesLoaded, setIsAllUserQuizzesLoaded] = useState(false)
  const [userQuizAttempts, setUserQuizAttempts] = useState<QuizAttempt[]>([])
  const [isUserQuizAttemptsLoaded, setIsUserQuizAttemptsLoaded] = useState(false)
  const [supabase] = useState(() => createClient())

  // 인증 상태 초기화 및 구독
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        console.log('🚀 [Auth] 초기화 시작')
        
        // 현재 세션 확인 (더 상세한 로깅)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ [Auth] 세션 확인 실패:', sessionError)
        } else {
          console.log('✅ [Auth] 초기 세션:', session ? `로그인됨 (${session.user.email})` : '로그아웃됨')
          if (session) {
            console.log('🔍 [Auth] 세션 상세:', {
              userId: session.user.id,
              email: session.user.email,
              expiresAt: new Date(session.expires_at * 1000).toLocaleString(),
              hasRefreshToken: !!session.refresh_token
            })
          }
        }

        if (mounted) {
          setUser(session?.user ?? null)
        }

        // 인증 상태 변경 구독 (멀티탭 동기화 포함)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 [Auth] 상태 변경:', event, session ? '세션 있음' : '세션 없음')
            
            if (mounted) {
              // 로그아웃 이벤트 감지 시 모든 탭에서 동시 처리
              if (event === 'SIGNED_OUT') {
                console.log('🚪 [Auth] 다른 탭에서 로그아웃 감지')
                setUser(null)
                setCredits(0)
                setUserQuizzes([])
                setAllUserQuizzes([])
                setIsUserQuizzesLoaded(false)
                setIsAllUserQuizzesLoaded(false)
                
                // 다른 탭에서 로그아웃한 경우 현재 탭도 로그인 페이지로 이동
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                  window.location.href = '/login'
                }
              } else {
                setUser(session?.user ?? null)
              }
            }
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('❌ [Auth] 초기화 실패:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          console.log('🏁 [Auth] 초기화 완료')
          setIsLoading(false)
        }
      }
    }

    const cleanup = initializeAuth()

    return () => {
      mounted = false
      cleanup.then(fn => fn?.())
    }
  }, [supabase])

  // 크레딧 조회
  const refreshCredits = async () => {
    if (!user) return

    setIsLoadingCredits(true)
    setCreditsError(null)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single()

      // 디버그 로그 추가
      console.log("DEBUG: refreshCredits data:", data, "error:", error);

      if (error) {
        throw error
      }

      setCredits(data?.credits || 0)
    } catch (error) {
      console.error('❌ 크레딧 조회 실패:', error)
      setCreditsError(error instanceof Error ? error.message : '크레딧 조회 실패')
    } finally {
      setIsLoadingCredits(false)
    }
  }


  

  // 퀴즈 목록 조회
  const refreshQuizzes = async () => {
    if (!user) return

    try {
      // 최근 10개 퀴즈
      const { data: recentQuizzes, error: recentError } = await supabase
        .from('Quiz')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(10)

      if (recentError) {
        console.error('❌ 최근 퀴즈 조회 실패:', recentError)
      } else {
        setUserQuizzes(recentQuizzes || [])
        setIsUserQuizzesLoaded(true)
      }

      // 전체 퀴즈
      const { data: allQuizzes, error: allError } = await supabase
        .from('Quiz')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })

      if (allError) {
        console.error('❌ 전체 퀴즈 조회 실패:', allError)
      } else {
        setAllUserQuizzes(allQuizzes || [])
        setIsAllUserQuizzesLoaded(true)
      }
    } catch (error) {
      console.error('❌ 퀴즈 조회 중 예외:', error)
    }
  }

  // 퀴즈 시도 목록 새로고침
  const refreshQuizAttempts = async () => {
    if (!user) return

    try {
      const { data: attempts, error } = await supabase
        .from('QuizAttempt')
        .select(`
          id,
          quizId,
          userId,
          userAnswers,
          score,
          status,
          updatedAt,
          Quiz!inner(
            id,
            title,
            content
          )
        `)
        .eq('userId', user.id)
        .eq('status', 'completed')
        .order('updatedAt', { ascending: false })
        .limit(10)

      if (error) throw error
      setUserQuizAttempts(attempts || [])
      setIsUserQuizAttemptsLoaded(true)

    } catch (error) {
      console.error('❌ 퀴즈 시도 목록 조회 실패:', error)
      setUserQuizAttempts([])
      setIsUserQuizAttemptsLoaded(true)
    }
  }

  // 강화된 로그아웃 시스템
  const signOut = async () => {
    try {
      console.log('🚪 [Auth] 로그아웃 시작')
      
      // 1. 클라이언트 상태 즉시 초기화 (고스트 세션 방지)
      setUser(null)
      setCredits(0)
      setUserQuizzes([])
      setAllUserQuizzes([])
      setIsUserQuizzesLoaded(false)
      setIsAllUserQuizzesLoaded(false)
      setIsLoading(true) // 로그아웃 진행 중 표시
      
      // 2. Supabase 로그아웃
      await supabase.auth.signOut()
      
      // 3. 로컬 스토리지 강제 삭제
      if (typeof window !== 'undefined') {
        // Supabase 관련 모든 스토리지 삭제
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
        
        // 세션 스토리지도 삭제
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            sessionStorage.removeItem(key)
          }
        })
      }
      
      console.log('✅ [Auth] 로그아웃 완료')
      
      // 4. 페이지 완전 새로고침으로 모든 상태 초기화
      setTimeout(() => {
        window.location.href = '/login'
      }, 100) // 약간의 딜레이로 상태 업데이트 완료 보장
      
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error)
      // 에러 발생 시에도 강제 리다이렉트
      window.location.href = '/login'
    }
  }

  // 사용자가 변경될 때마다 데이터 새로고침
  useEffect(() => {
    if (user) {
      refreshCredits()
      refreshQuizzes()
      refreshQuizAttempts()
    } else {
      setCredits(0)
      setUserQuizzes([])
      setAllUserQuizzes([])
      setUserQuizAttempts([])
      setIsUserQuizzesLoaded(false)
      setIsAllUserQuizzesLoaded(false)
      setIsUserQuizAttemptsLoaded(false)
    }
  }, [user])

  const value: AuthContextType = {
    user,
    isLoading,
    credits,
    isLoadingCredits,
    isCreditsLoaded: !isLoadingCredits, // <--- 이 한 줄을 추가
    creditsError,
    userQuizzes,
    isUserQuizzesLoaded,
    allUserQuizzes,
    isAllUserQuizzesLoaded,
    userQuizAttempts,
    isUserQuizAttemptsLoaded,
    signOut,
    refreshCredits,
    refreshQuizzes,
    refreshQuizAttempts,
    supabase,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}