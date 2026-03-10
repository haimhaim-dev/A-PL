import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: {
    default: "에이쁠 (A-Pl) - 대학생을 위한 AI 시험 문제 생성 서비스",
    template: "%s | 에이쁠"
  },
  description:
    "강의 PDF를 업로드하면 자동으로 시험 문제를 생성해주는 AI 서비스, 에이쁠(A-Pl). 대학생을 위한 똑똑한 시험 준비 파트너.",
  keywords: [
    "시험 문제 생성",
    "AI 학습",
    "대학생",
    "PDF 분석",
    "자동 문제 출제",
    "스마트 학습"
  ],
  authors: [{ name: "A-Pl Team" }],
  creator: "A-Pl",
  publisher: "A-Pl",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "에이쁠"
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "에이쁠 (A-Pl) - 대학생을 위한 AI 시험 문제 생성 서비스",
    description:
      "강의 PDF를 업로드하면 자동으로 시험 문제를 생성해주는 AI 서비스",
    siteName: "에이쁠"
  },
  twitter: {
    card: "summary_large_image",
    title: "에이쁠 (A-Pl)",
    description: "대학생을 위한 AI 시험 문제 생성 서비스"
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/Icon.png", sizes: "any", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* 하이드레이션 깜빡임 방지 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 즉시 다크모드 적용
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.backgroundColor = '#020617';
                  document.documentElement.style.color = '#ffffff';
                  
                  // body가 로드되면 스타일 적용
                  function applyDarkTheme() {
                    if (document.body) {
                      document.body.style.backgroundColor = '#020617';
                      document.body.style.color = '#ffffff';
                      document.body.style.margin = '0';
                      document.body.style.padding = '0';
                    }
                  }
                  
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', applyDarkTheme);
                  } else {
                    applyDarkTheme();
                  }
                } catch (e) {
                  console.warn('Theme initialization failed:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-slate-950 text-white antialiased safe-top safe-bottom"
        style={{
        backgroundColor: '#020617',
        color: '#ffffff',
        margin: 0,
        padding: 0
      }}>
        <Providers>
          <ThemeProvider>
            <div className="relative mx-auto flex min-h-screen flex-col" style={{
              backgroundColor: '#020617',
              color: '#ffffff'
            }}>
              <main className="flex-1">{children}</main>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}