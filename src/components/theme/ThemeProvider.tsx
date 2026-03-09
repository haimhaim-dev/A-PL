"use client";

import * as React from "react";

/**
 * 하이드레이션 깜빡임 방지를 위한 테마 프로바이더
 * 다크모드가 완전히 적용된 후 콘텐츠를 표시
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isThemeLoaded, setIsThemeLoaded] = React.useState(false);

  React.useEffect(() => {
    // 다크모드 테마 적용 확인
    const checkTheme = () => {
      const html = document.documentElement;
      const body = document.body;
      
      // 다크 클래스가 적용되었는지 확인
      if (html.classList.contains('dark')) {
        // 배경색이 올바르게 적용되었는지 확인
        const computedStyle = window.getComputedStyle(body);
        const backgroundColor = computedStyle.backgroundColor;
        
        // 다크모드 배경색이 적용되었다면 테마 로딩 완료
        if (backgroundColor === 'rgb(2, 6, 23)' || backgroundColor.includes('020617')) {
          setIsThemeLoaded(true);
        } else {
          // 배경색 강제 적용
          body.style.backgroundColor = '#020617';
          body.style.color = '#ffffff';
          setIsThemeLoaded(true);
        }
      } else {
        // 다크 클래스 추가
        html.classList.add('dark');
        body.style.backgroundColor = '#020617';
        body.style.color = '#ffffff';
        setIsThemeLoaded(true);
      }
    };

    // 즉시 체크
    checkTheme();
    
    // DOM이 완전히 로드된 후 다시 체크
    const timer = setTimeout(checkTheme, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // 테마가 로드되지 않았다면 로딩 스크린 표시
  if (!isThemeLoaded) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{
          backgroundColor: '#020617',
          color: '#ffffff'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}