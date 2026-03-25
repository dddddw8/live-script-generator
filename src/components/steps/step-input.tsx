"use client";

import { useState, useRef } from "react";
import type { GenerateState } from "@/app/generate/page";
import { CATEGORY_TEMPLATES } from "@/lib/script-templates";
import {
  GraduationCap, Sparkles, UtensilsCrossed, Smartphone, Home, PenTool,
  ArrowRight, MessageSquare, Upload, X, FileText, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Sparkles, UtensilsCrossed, Smartphone, Home, PenTool,
};

type UploadedFile = {
  name: string;
  type: string;
  content: string;
  preview?: string;
};

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
};

export function StepInput({ state, updateState, onNext }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const cat = CATEGORY_TEMPLATES.find((c) => c.id === catId);
    if (cat && cat.default_info) {
      updateState({ productInfo: cat.default_info });
    }
  };

  const currentPlaceholder = (() => {
    if (selectedCategory) {
      const cat = CATEGORY_TEMPLATES.find((c) => c.id === selectedCategory);
      if (cat?.placeholder) return cat.placeholder;
    }
    return `请描述你要售卖的产品，建议包含以下信息：

产品名称：
目标人群：
售价：
核心卖点：（3-5个）
品牌优势：
竞品对比：
促销策略：

描述越详细，生成的话术越精准。你也可以直接用自然语言描述。`;
  })();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = ev.target?.result as string;
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, type: "image", content: `[已上传图片: ${file.name}]`, preview },
          ]);
          updateState({
            productInfo: state.productInfo + `\n\n[参考图片: ${file.name}]`,
          });
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        const truncated = text.slice(0, 3000);
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, type: "text", content: truncated },
        ]);
        updateState({
          productInfo: state.productInfo + `\n\n--- 来自文件 ${file.name} ---\n${truncated}`,
        });
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
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
          placeholder={currentPlaceholder}
          rows={12}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>描述越详细，生成的话术越精准</span>
          <span>{state.productInfo.length} 字</span>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          <Upload className="mr-1 inline h-4 w-4" />
          上传补充材料（可选）
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5"
        >
          <Upload className="h-6 w-6 text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            点击上传产品图片、竞品截图、需求文档等
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]/70">
            支持 图片（JPG/PNG）、文本（TXT/MD）、文档（PDF）
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.txt,.md,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5"
              >
                {file.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                    {file.type === "image" ? (
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                )}
                <span className="flex-1 truncate text-sm">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
