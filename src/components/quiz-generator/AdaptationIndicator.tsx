/**
 * 전천후 모드 상태 표시 컴포넌트
 * 불일치 상황에서의 창의적 대응 전략을 사용자에게 안내
 */

import * as React from "react";
import { Zap, ArrowRight, Lightbulb, Shield, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdaptationIndicatorProps {
  sourceType: string;
  targetType: string;
  isCreativePivotNeeded: boolean;
  strategy: string;
  isBridgeMode?: boolean;
  documentKeywords?: string[];
  defenseLevel?: string;
}

export function AdaptationIndicator({
  sourceType,
  targetType,
  isCreativePivotNeeded,
  strategy,
  isBridgeMode = false,
  documentKeywords = [],
  defenseLevel = "STANDARD"
}: AdaptationIndicatorProps) {
  if (!isCreativePivotNeeded && !isBridgeMode) return null;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "CONCEPT": "개념 중심",
      "TERM": "용어 중심", 
      "CALCULATION": "계산 중심",
      "MIXED": "혼합형",
      "CALC": "계산 문제",
      "AUTO": "자동 선택"
    };
    return labels[type] || type;
  };

  const getStrategyDescription = (strategy: string) => {
    if (strategy.includes("CONCEPT_TO_CALC_ADVANCED")) {
      return "개념의 원리를 관통하는 가상 시나리오 수치 대입형 문제로 변형합니다 (강철 방어)";
    }
    if (strategy.includes("TERM_TO_CALC_ADVANCED")) {
      return "용어 정의의 핵심 수치를 활용한 실제 상황 적용 계산 문제로 변형합니다 (강철 방어)";
    }
    if (strategy.includes("CALC_TO_TERM_ADVANCED")) {
      return "문제 풀이의 핵심 키워드와 함정 요소를 묻는 고차원 용어 문제로 변형합니다 (강철 방어)";
    }
    if (strategy.includes("CALC_TO_CONCEPT_ADVANCED")) {
      return "조건 변화에 따른 원리 추론 및 함정 회피 개념 문제로 변형합니다 (강철 방어)";
    }
    // 기존 전략들 (하위 호환)
    if (strategy.includes("CONCEPT_TO_CALC")) {
      return "개념 설명을 바탕으로 실제 계산 문제로 변형합니다";
    }
    if (strategy.includes("TERM_TO_CALC")) {
      return "용어 정의의 수치를 활용한 연산 문제로 변형합니다";
    }
    if (strategy.includes("CALC_TO_TERM")) {
      return "계산 과정의 핵심 용어를 묻는 문제로 변형합니다";
    }
    if (strategy.includes("CALC_TO_CONCEPT")) {
      return "계산 원리의 이론적 배경을 묻는 문제로 변형합니다";
    }
    return "문서 내용을 요청하신 유형에 맞게 창의적으로 변형합니다";
  };
  
  const getCardStyle = () => {
    if (isBridgeMode) {
      return "p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 shadow-lg";
    }
    return "p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 shadow-lg";
  };
  
  const getIcon = () => {
    if (isBridgeMode) {
      return <Shield className="h-3 w-3 text-red-400" />;
    }
    return <Zap className="h-3 w-3 text-amber-400" />;
  };
  
  const getTitle = () => {
    if (isBridgeMode) {
      return "🛡️ 강철 방어 모드 활성화";
    }
    return "🚀 전천후 모드 활성화";
  };
  
  const getTitleColor = () => {
    if (isBridgeMode) {
      return "text-red-300";
    }
    return "text-amber-300";
  };

  return (
    <Card className={getCardStyle()}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`h-6 w-6 rounded-full ${isBridgeMode ? 'bg-red-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
            {getIcon()}
          </div>
          <h4 className={`text-sm font-bold ${getTitleColor()}`}>{getTitle()}</h4>
          {defenseLevel === "STEEL_DEFENSE" && (
            <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">강철 방어</span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
            <span className="text-slate-400">문서:</span>
            <span className="font-bold text-white">{getTypeLabel(sourceType)}</span>
          </div>
          <ArrowRight className={`h-3 w-3 ${isBridgeMode ? 'text-red-400' : 'text-amber-400'}`} />
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
            <span className="text-slate-400">요청:</span>
            <span className="font-bold text-white">{getTypeLabel(targetType)}</span>
          </div>
        </div>
        
        {documentKeywords.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-slate-400">키워드:</span>
            <div className="flex flex-wrap gap-1">
              {documentKeywords.slice(0, 5).map((keyword, index) => (
                <span key={index} className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                  {keyword}
                </span>
              ))}
              {documentKeywords.length > 5 && (
                <span className="text-xs text-slate-400">+{documentKeywords.length - 5}개</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-2">
          <Lightbulb className={`h-3 w-3 ${isBridgeMode ? 'text-red-400' : 'text-amber-400'} mt-0.5 flex-shrink-0`} />
          <p className={`text-xs ${isBridgeMode ? 'text-red-200/80' : 'text-amber-200/80'} leading-relaxed`}>
            {getStrategyDescription(strategy)}
          </p>
        </div>
        
        {isBridgeMode && (
          <div className="flex items-start gap-2 p-2 bg-orange-500/10 rounded border border-orange-500/30">
            <AlertTriangle className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-200/80">
              문서 내용이 부족하지만, 핵심 키워드와 기본 개념을 결합하여 교육적 가치가 있는 브릿지 문제를 생성합니다.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}