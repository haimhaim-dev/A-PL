/**
 * LaTeX 수식 프리뷰 컴포넌트
 * 4단계 완성된 LaTeX 렌더링 로직: KaTeX 기반, 에러 처리, 다크 테마
 */

import * as React from "react";
import { Calculator, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathRenderer } from "@/components/ui/MathRenderer";
import { cn } from "@/lib/utils";

interface LaTeXPreviewProps {
  calcScore: number;
  conceptScore: number;
  termScore: number;
  isVisible: boolean;
  onToggle: () => void;
}

export function LaTeXPreview({ 
  calcScore, 
  conceptScore, 
  termScore, 
  isVisible, 
  onToggle 
}: LaTeXPreviewProps) {
  const sampleEquations = React.useMemo(() => {
    const samples = [];
    
    if (calcScore > 30) {
      samples.push(
        { label: "미분", equation: "\\frac{d}{dx}f(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
        { label: "적분", equation: "\\int_{a}^{b} f(x) dx = F(b) - F(a)" },
        { label: "급수", equation: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}" }
      );
    }
    
    if (conceptScore > 20) {
      samples.push(
        { label: "물리", equation: "E = mc^2" },
        { label: "확률", equation: "P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}" }
      );
    }
    
    if (termScore > 20) {
      samples.push(
        { label: "집합", equation: "A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}" }
      );
    }

    return samples.slice(0, 3); // 최대 3개만 표시
  }, [calcScore, conceptScore, termScore]);

  if (calcScore < 20 || sampleEquations.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-bold text-blue-300">LaTeX 수식 미리보기</span>
            <span className="text-xs text-blue-400/60">({calcScore}% 비중)</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="text-slate-400 hover:text-white"
          >
            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>

        {isVisible && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <p className="text-xs text-slate-400 leading-relaxed">
              분석 결과 수식 비중이 높아 다음과 같은 LaTeX 수식이 포함된 문제가 생성됩니다:
            </p>
            
            <div className="space-y-2">
              {sampleEquations.map((sample, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      {sample.label}
                    </span>
                  </div>
                  <div className="text-center py-2">
                    <MathRenderer displayMode={true}>
                      {sample.equation}
                    </MathRenderer>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-slate-500 leading-relaxed">
                💡 실제 문제에서는 문서 내용에 맞는 정확한 수식이 생성됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}