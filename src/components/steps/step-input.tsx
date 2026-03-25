"use client";

import { useState, useRef } from "react";
import type { GenerateState } from "@/app/generate/page";
import { CATEGORY_TEMPLATES, REQUIRED_FIELDS_COMMON } from "@/lib/script-templates";
import { chatCompletion, visionChat } from "@/lib/ai-client";
import {
  GraduationCap, Sparkles, UtensilsCrossed, Smartphone, Home, PenTool,
  ArrowRight, MessageSquare, Upload, X, FileText, Image as ImageIcon,
  Loader2, Eye, CheckCircle2, Lightbulb,
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
  analyzing?: boolean;
  analysisResult?: string;
};

type MissingField = {
  field: string;
  question: string;
  suggestions: string[];
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
  const [checking, setChecking] = useState(false);
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questionFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const cat = CATEGORY_TEMPLATES.find((c) => c.id === catId);
    if (cat && cat.default_info) {
      updateState({ productInfo: cat.default_info });
    }
  };

  const currentCategory = CATEGORY_TEMPLATES.find((c) => c.id === selectedCategory);
  const requiredFields = currentCategory?.requiredFields || REQUIRED_FIELDS_COMMON;

  const currentPlaceholder = (() => {
    if (selectedCategory) {
      const cat = CATEGORY_TEMPLATES.find((c) => c.id === selectedCategory);
      if (cat?.placeholder) return cat.placeholder;
    }
    return `请描述你要售卖的产品，以下信息必须提供：

★ 产品名称：
★ 售价：
★ 目标人群：
★ 核心卖点：（3-5个）
★ 品牌背书：
★ 促销策略/福利：（直播间优惠、赠品、满减等）

选填：竞品对比、售后保障、直播间玩法（福袋/秒杀/抽奖等）`;
  })();

  const checkInfoCompleteness = async () => {
    setChecking(true);
    setShowCheckDialog(false);
    setMissingFields([]);

    const fieldsList = requiredFields.map((f) => `- ${f.label}（${f.hint}）`).join("\n");

    try {
      const result = await chatCompletion({
        model: "deepseek-v3",
        node: "domestic",
        system: `你是一位直播话术质量检查专家。用户提供了一段产品信息，你需要检查这些信息是否足够生成一段高质量的直播话术。

以下是生成好话术必须具备的关键信息：
${fieldsList}

请检查用户提供的信息，找出缺失或不够具体的部分。

规则：
1. 如果某个字段完全没有提到，标记为缺失
2. 如果某个字段提到了但太模糊（如只写了"好"而没有具体内容），也标记为需要补充
3. 特别注意：售价/价格、促销策略/福利/赠品 这两项对话术质量影响极大，如果缺失必须提醒
4. 如果所有关键信息都已提供且足够具体，返回空数组
5. 对每个缺失字段，用口语化的方式向用户提问，像朋友聊天一样自然
6. 对每个缺失字段，根据用户已提供的产品信息，给出 2-4 个具体的填写建议（用户点击即可自动填入）

请直接返回JSON数组，不要输出思考过程，不要包含markdown代码块标记：
[
  {"field": "缺失字段名", "question": "口语化提问", "suggestions": ["建议1（要具体，如：299元/套，含主机+配件+收纳包）", "建议2", "建议3"]}
]
suggestions 要根据用户已有的产品信息来推测，给出合理具体的建议。如果信息完整，返回：[]`,
        prompt: state.productInfo,
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const parsed: MissingField[] = JSON.parse(cleaned);

      if (parsed.length === 0) {
        onNext();
      } else {
        setMissingFields(parsed);
        setAnswers({});
        setShowCheckDialog(true);
      }
    } catch (err) {
      console.error("Info check failed:", err);
      onNext();
    } finally {
      setChecking(false);
    }
  };

  const analyzeImage = async (imageBase64: string, fileName: string, mimeType: string, fileIdx: number) => {
    setUploadedFiles((prev) =>
      prev.map((f, i) => (i === fileIdx ? { ...f, analyzing: true } : f))
    );

    try {
      const analysis = await visionChat({
        imageBase64,
        mimeType,
        prompt: `你是一位资深直播带货运营专家。请仔细分析这张产品图片，提取以下信息。请直接输出分析结果，不要输出思考过程。

请用简洁的中文描述，格式如下：
产品识别：xxx
外观特征：xxx
功能卖点：xxx
包装内容：xxx（如果能看到的话）
目标人群：xxx
使用场景：xxx`,
      });

      setUploadedFiles((prev) =>
        prev.map((f, i) =>
          i === fileIdx ? { ...f, analyzing: false, analysisResult: analysis } : f
        )
      );
      updateState({
        productInfo:
          state.productInfo +
          `\n\n--- AI 从图片「${fileName}」识别到的信息 ---\n${analysis}`,
      });
    } catch {
      setUploadedFiles((prev) =>
        prev.map((f, i) =>
          i === fileIdx
            ? { ...f, analyzing: false, analysisResult: "识别失败，请手动补充信息" }
            : f
        )
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const fileMimeType = file.type || "image/jpeg";
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          const newIdx = uploadedFiles.length;

          setUploadedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: "image",
              content: `[已上传图片: ${file.name}]`,
              preview: dataUrl,
              analyzing: true,
            },
          ]);

          analyzeImage(base64, file.name, fileMimeType, newIdx);
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
          productInfo: state.productInfo + `\n\n--- 来自文件「${file.name}」 ---\n${truncated}`,
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
          告诉我你要售卖的产品，带 ★ 的信息是生成高质量话术必须提供的
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

      {/* Required fields hint */}
      <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-sm">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <div>
          <p className="font-medium text-indigo-800">AI 提示：以下信息有助于生成高质量话术</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {requiredFields.map((f) => (
              <span key={f.key} className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {f.label}
              </span>
            ))}
          </div>
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
          rows={14}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>信息越完整，话术质量越高。AI 会在下一步前检查信息完整性。</span>
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
            支持图片（JPG/PNG）、文本（TXT/MD）| 图片会自动 AI 识别分析
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

        {uploadedFiles.length > 0 && (
          <div className="mt-3 space-y-3">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center gap-3 p-3">
                  {file.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.preview} alt={file.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      {file.type === "image" ? <ImageIcon className="h-5 w-5 text-gray-400" /> : <FileText className="h-5 w-5 text-gray-400" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    {file.analyzing && (
                      <p className="flex items-center gap-1.5 text-xs text-[var(--color-primary)]">
                        <Loader2 className="h-3 w-3 animate-spin" />AI 正在识别图片内容...
                      </p>
                    )}
                    {file.analysisResult && !file.analyzing && (
                      <p className="flex items-center gap-1 text-xs text-green-600">
                        <Eye className="h-3 w-3" />AI 识别完成，结果已填入上方输入框
                      </p>
                    )}
                    {file.type === "text" && (
                      <p className="text-xs text-[var(--color-text-secondary)]">文件内容已读取并填入上方输入框</p>
                    )}
                  </div>
                  <button onClick={() => removeFile(idx)} className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {file.analysisResult && !file.analyzing && (
                  <div className="border-t border-[var(--color-border)] bg-green-50 px-3 py-2.5">
                    <p className="mb-1 text-xs font-medium text-green-700">AI 识别结果：</p>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-green-800">
                      {file.analysisResult.slice(0, 300)}{file.analysisResult.length > 300 && "..."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal overlay - info check Q&A */}
      {showCheckDialog && missingFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowCheckDialog(false); onNext(); }} />

          {/* Modal */}
          <div className="animate-fade-in relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <MessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">还需要补充一些信息</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  补充后话术质量会更高，也可以跳过直接生成
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {missingFields.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-4">
                  <div className="mb-2.5 flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium">{item.question}</p>
                  </div>

                  <div className="ml-7">
                    <textarea
                      value={answers[idx] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="在此输入，或点击下方建议快速填写"
                      rows={2}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm leading-relaxed placeholder:text-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />

                    {/* Clickable AI suggestions */}
                    {item.suggestions && item.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-xs text-[var(--color-text-secondary)]">AI 建议：</span>
                        {item.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => setAnswers((prev) => ({ ...prev, [idx]: sug }))}
                            className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-2.5 py-1 text-xs text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/15 hover:border-[var(--color-primary)]/50 active:scale-95"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => questionFileRefs.current[idx]?.click()}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100"
                    >
                      <Upload className="h-3 w-3" />
                      上传图片/文件补充
                    </button>
                    <input
                      ref={(el) => { questionFileRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*,.txt,.md,.pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type.startsWith("image/")) {
                          setAnswers((prev) => ({ ...prev, [idx]: (prev[idx] || "") + `\n[已上传图片: ${file.name}]` }));
                        } else {
                          const text = await file.text();
                          setAnswers((prev) => ({ ...prev, [idx]: (prev[idx] || "") + "\n" + text.slice(0, 1000) }));
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  const supplementText = missingFields
                    .map((item, idx) => {
                      const answer = answers[idx]?.trim();
                      return answer ? `${item.field}：${answer}` : null;
                    })
                    .filter(Boolean)
                    .join("\n");

                  if (supplementText) {
                    updateState({
                      productInfo: state.productInfo + "\n\n" + supplementText,
                    });
                  }
                  setShowCheckDialog(false);
                  onNext();
                }}
                className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                提交并继续
              </button>
              <button
                onClick={() => { setShowCheckDialog(false); onNext(); }}
                className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50"
              >
                跳过
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={checkInfoCompleteness}
          disabled={!canProceed || checking}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
            canProceed && !checking
              ? "bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)]"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          )}
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 正在检查信息完整性...
            </>
          ) : (
            <>
              下一步：AI 分析卖点
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
