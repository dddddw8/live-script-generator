"use client";

import { useState } from "react";
import { StepInput } from "@/components/steps/step-input";
import { StepAnalyze } from "@/components/steps/step-analyze";
import { StepParams } from "@/components/steps/step-params";
import { StepGenerate } from "@/components/steps/step-generate";
import { StepForbidden } from "@/components/steps/step-forbidden";
import { StepFinal } from "@/components/steps/step-final";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type GenerateState = {
  productInfo: string;
  productName: string;
  sellingPoints: string[];
  style: string;
  wordCount: number;
  loopMinutes: number;
  generatedScript: string;
  checkedScript: string;
  aiRecommendation: string;
  forbiddenResult: {
    total_found: number;
    total_replaced: number;
    replacements: {
      original: string;
      replacement: string;
      category: string;
      positions: number[];
    }[];
  } | null;
};

const STEPS = [
  { id: 1, label: "产品信息" },
  { id: 2, label: "卖点分析" },
  { id: 3, label: "参数设置" },
  { id: 4, label: "生成话术" },
  { id: 5, label: "违禁词检测" },
  { id: 6, label: "终版输出" },
];

export default function GeneratePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<GenerateState>({
    productInfo: "",
    productName: "",
    sellingPoints: [],
    style: "knowledge",
    wordCount: 1500,
    loopMinutes: 8,
    generatedScript: "",
    checkedScript: "",
    aiRecommendation: "",
    forbiddenResult: null,
  });

  const updateState = (updates: Partial<GenerateState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 6));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Step indicator */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px]">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                        ? "bg-[var(--color-primary)] text-white shadow-lg shadow-indigo-200"
                        : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                  )}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "mt-1.5 whitespace-nowrap text-[11px] font-medium",
                    currentStep >= step.id ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 transition-colors",
                    currentStep > step.id ? "bg-green-500" : "bg-[var(--color-border)]"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="animate-fade-in">
        {currentStep === 1 && (
          <StepInput state={state} updateState={updateState} onNext={goNext} />
        )}
        {currentStep === 2 && (
          <StepAnalyze state={state} updateState={updateState} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 3 && (
          <StepParams state={state} updateState={updateState} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 4 && (
          <StepGenerate state={state} updateState={updateState} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 5 && (
          <StepForbidden state={state} updateState={updateState} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 6 && (
          <StepFinal state={state} updateState={updateState} onPrev={goPrev} />
        )}
      </div>
    </div>
  );
}
