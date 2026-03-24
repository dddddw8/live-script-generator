"use client";

import { useState } from "react";
import type { GenerateState } from "@/app/generate/page";
import { CATEGORY_TEMPLATES } from "@/lib/script-templates";
import {
  GraduationCap, Sparkles, UtensilsCrossed, Smartphone, Home, PenTool,
  ArrowRight, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Sparkles, UtensilsCrossed, Smartphone, Home, PenTool,
};

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
};

export function StepInput({ state, updateState, onNext }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const cat = CATEGORY_TEMPLATES.find((c) => c.id === catId);
    if (cat && cat.default_info && !state.productInfo) {
      updateState({ productInfo: cat.default_info });
    }
  };

  const canProceed = state.productInfo.trim().length >= 10;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 1: 输入产品信息</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          告诉我你要售卖的产品，包括产品名称、目标人群、价格、核心卖点等信息
        </p>
      </div>

      {/* Category quick select */}
      <div>
        <label className="mb-3 block text-sm font-medium">选择产品类目（快捷填充）</label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORY_TEMPLATES.map((cat) => {
            const Icon = iconMap[cat.icon] || PenTool;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                  selectedCategory === cat.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
                )}
              >
                <Icon className="h-5 w-5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product info textarea */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          <MessageSquare className="mr-1 inline h-4 w-4" />
          产品详细信息
        </label>
        <textarea
          value={state.productInfo}
          onChange={(e) => updateState({ productInfo: e.target.value })}
          placeholder={`请描述你要售卖的产品，例如：

产品名称：斑马科学探究显微镜
目标人群：3-12岁孩子的家长
售价：299元
核心卖点：1200倍专业放大、全套实验工具、三种观察模式、双光源设计
品牌优势：斑马是专业儿童启蒙品牌，全国3000万用户
竞品对比：市面上同配置显微镜300+起步
促销策略：拍1发22，送12节科普视频课

你也可以直接用自然语言描述，比如：
"我们要卖一款儿童显微镜，299元，斑马品牌的，主打科学启蒙..."
`}
          rows={12}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>描述越详细，生成的话术越精准</span>
          <span>{state.productInfo.length} 字</span>
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
            canProceed
              ? "bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)]"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          )}
        >
          下一步：AI 分析卖点
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
