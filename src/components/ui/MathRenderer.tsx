/**
 * LaTeX 수식 렌더링 컴포넌트
 * KaTeX를 사용하여 수학 수식을 안전하게 렌더링
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// KaTeX 타입 정의
interface KaTeXOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  strict?: boolean | "error" | "ignore" | "warn";
  trust?: boolean;
  macros?: Record<string, string>;
}

interface MathRendererProps {
  children: string;
  className?: string;
  inline?: boolean;
  displayMode?: boolean;
}

export function MathRenderer({ 
  children, 
  className, 
  inline = false, 
  displayMode = false 
}: MathRendererProps) {
  const [rendered, setRendered] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const renderMath = async () => {
      try {
        // KaTeX 동적 로드
        const katex = await import('katex');
        
        if (!isMounted) return;

        const options: KaTeXOptions = {
          displayMode: displayMode || !inline,
          throwOnError: false,
          errorColor: '#ef4444',
          strict: false,
          trust: false, // 보안상 false
          macros: {
            "\\RR": "\\mathbb{R}",
            "\\NN": "\\mathbb{N}",
            "\\ZZ": "\\mathbb{Z}",
            "\\QQ": "\\mathbb{Q}",
            "\\CC": "\\mathbb{C}"
          }
        };

        const html = katex.renderToString(children, options);

        setRendered(html);
        setError(null);
      } catch (err) {
        console.warn("LaTeX 렌더링 오류:", err);
        setError(children); // 원본 텍스트를 fallback으로 표시
        setRendered("");
      }
    };

    renderMath();

    return () => {
      isMounted = false;
    };
  }, [children, inline, displayMode]);

  // 에러 발생 시 원본 텍스트 표시
  if (error) {
    return (
      <span className={cn("font-mono text-orange-400 bg-orange-500/10 px-1 rounded", className)}>
        {error}
      </span>
    );
  }

  // 로딩 중
  if (!rendered) {
    return (
      <span className={cn("animate-pulse bg-slate-700 rounded", className)}>
        {inline ? "..." : "수식 로딩 중..."}
      </span>
    );
  }

  return (
    <span 
      className={cn("katex-container", className)}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

/**
 * 텍스트에서 LaTeX 수식을 찾아 렌더링하는 컴포넌트
 * $...$ (인라인) 및 $$...$$ (블록) 패턴 지원
 */
export function MathText({ 
  children, 
  className 
}: { 
  children: string; 
  className?: string; 
}) {
  const parts = React.useMemo(() => {
    // LaTeX 패턴 매칭: $$...$$ (블록) 또는 $...$ (인라인)
    const mathPattern = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mathPattern.exec(children)) !== null) {
      // 수식 앞의 일반 텍스트
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: children.slice(lastIndex, match.index)
        });
      }

      // 수식 부분
      const mathContent = match[1];
      const isBlock = mathContent.startsWith('$$');
      const cleanMath = isBlock 
        ? mathContent.slice(2, -2).trim() 
        : mathContent.slice(1, -1).trim();

      parts.push({
        type: 'math',
        content: cleanMath,
        inline: !isBlock,
        displayMode: isBlock
      });

      lastIndex = match.index + match[1].length;
    }

    // 마지막 일반 텍스트
    if (lastIndex < children.length) {
      parts.push({
        type: 'text',
        content: children.slice(lastIndex)
      });
    }

    return parts;
  }, [children]);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else {
          return (
            <MathRenderer
              key={index}
              inline={part.inline}
              displayMode={part.displayMode}
            >
              {part.content}
            </MathRenderer>
          );
        }
      })}
    </span>
  );
}