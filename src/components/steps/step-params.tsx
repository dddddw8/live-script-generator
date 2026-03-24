"use client";

import type { GenerateState } from "@/app/generate/page";
import { STYLE_OPTIONS, WORD_COUNT_OPTIONS, LOOP_TIME_OPTIONS } from "@/lib/script-templates";
import { ArrowLeft, ArrowRight, BookOpen, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const styleIcons: Record<string, React.ElementType> = {
  BookOpen, Heart, Zap,
};

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function StepParams({ state, updateState, onNext, onPrev }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Step 3: 参数设置</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          选择话术风格、字数和闭环时间，系统已根据产品类型给出推荐值
        </p>
      </div>

      {/* Style selection */}
      <div>
        <label className="mb-3 block text-sm font-medium">话术风格</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {STYLE_OPTIONS.map((opt) => {
            const Icon = styleIcons[opt.icon] || BookOpen;
            return (
              <button
                key={opt.id}
                onClick={() => updateState({ style: opt.id })}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                  state.style === opt.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  state.style === opt.id
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-gray-100 text-gray-500"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{opt.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Word count */}
      <div>
        <label className="mb-3 block text-sm font-medium">话术字数</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {WORD_COUNT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateState({ wordCount: opt.value })}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                state.wordCount === opt.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
              )}
            >
              <p className="text-xl font-bold">{opt.label}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{opt.description}</p>
              <p className="mt-0.5 text-xs text-[var(--color-primary)]">推荐：{opt.recommended_for}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loop time */}
      <div>
        <label className="mb-3 block text-sm font-medium">话术闭环时间</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {LOOP_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateState({ loopMinutes: opt.value })}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                state.loopMinutes === opt.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
              )}
            >
              <p className="text-xl font-bold">{opt.label}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-indigo-50 p-4">
        <p className="text-sm font-medium text-indigo-800">当前配置</p>
        <p className="mt-1 text-sm text-indigo-600">
          {STYLE_OPTIONS.find((o) => o.id === state.style)?.name} · {state.wordCount}字 · {state.loopMinutes}分钟闭环 · {state.sellingPoints.length}个卖点
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          上一步
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)]"
        >
          下一步：生成话术
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
