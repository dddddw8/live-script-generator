"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GenerateState } from "@/app/generate/page";
import { streamChat, chatCompletion, visionChat } from "@/lib/ai-client";
import { ArrowLeft, ArrowRight, Loader2, Plus, X, Lightbulb, Upload, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
  onPrev: () => void;
};

type AnalysisResult = {
  product_name: string;
  selling_points: { text: string; category: string }[];
  recommended_word_count: number;
  recommended_loop_minutes: number;
  recommendation_reason: string;
  suggested_extra_points: string[];
};

const ANALYZE_SYSTEM = `你是一位资深直播带货运营专家，拥有丰富的抖音直播经验。用户会给你一段产品信息描述，你需要：
1. 背景分析：基于你对该行业的了解，分析市场情况、竞品格局、目标用户特征
2. 卖点提炼：提炼 5-8 个核心卖点，每个要具体有力
3. 卖点分类：分为功能卖点、情感卖点、价格卖点、信任卖点
4. 参数推荐：根据产品类型、客单价和目标人群，推荐最合适的话术字数和闭环时间，并说明理由
5. 额外建议：给出 3-5 个用户可能遗漏但值得加入的卖点建议

推荐理由要基于以下分析维度（必须体现你的专业判断）：
- 该产品在抖音直播间的展示优势和劣势
- 目标用户的决策周期和价格敏感度
- 同类竞品的常见话术时长和节奏
- 该价格带产品的最佳话术闭环时间

请直接输出JSON，不要输出思考过程，不要包含markdown代码块标记。格式：
{
  "product_name": "产品名称",
  "selling_points": [
    {"text": "卖点描述", "category": "功能卖点"},
    {"text": "卖点描述", "category": "情感卖点"},
    {"text": "卖点描述", "category": "价格卖点"},
    {"text": "卖点描述", "category": "信任卖点"}
  ],
  "recommended_word_count": 1500,
  "recommended_loop_minutes": 8,
  "recommendation_reason": "详细的推荐理由，包含市场分析、竞品对比、用户特征等专业判断（3-5句话）",
  "suggested_extra_points": ["建议补充的卖点1", "建议补充的卖点2", "建议补充的卖点3"]
}`;

export function StepAnalyze({ state, updateState, onNext, onPrev }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [newPoint, setNewPoint] = useState("");
  const [editingPoints, setEditingPoints] = useState<string[]>(state.sellingPoints);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [uploadAnalyzing, setUploadAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysis = useCallback(async () => {
    if (state.sellingPoints.length > 0) {
      setEditingPoints(state.sellingPoints);
      setHasAnalyzed(true);
      return;
    }

    setIsLoading(true);
    setStreamText("");
    setError("");

    streamChat({
      model: "deepseek-v3",
      node: "domestic",
      system: ANALYZE_SYSTEM,
      prompt: state.productInfo,
      onChunk: (text) => setStreamText(text),
      onDone: (fullText) => {
        try {
          const cleaned = fullText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .trim();
          const parsed: AnalysisResult = JSON.parse(cleaned);
          setAnalysis(parsed);
          const points = parsed.selling_points.map((p) => p.text);
          setEditingPoints(points);
          updateState({
            productName: parsed.product_name,
            sellingPoints: points,
            wordCount: parsed.recommended_word_count,
            loopMinutes: parsed.recommended_loop_minutes,
            aiRecommendation: parsed.recommendation_reason,
          });
        } catch (err) {
          console.error("Parse error:", err);
          setError("AI 返回格式异常，请重试");
        }
        setIsLoading(false);
        setHasAnalyzed(true);
      },
      onError: (err) => {
        setError(err);
        setIsLoading(false);
        setHasAnalyzed(true);
      },
    });
  }, [state.productInfo, state.sellingPoints, updateState]);

  useEffect(() => {
    startAnalysis();
  }, [startAnalysis]);

  const addPoint = (text?: string) => {
    const pointText = text || newPoint.trim();
    if (pointText) {
      const updated = [...editingPoints, pointText];
      setEditingPoints(updated);
      updateState({ sellingPoints: updated });
      if (!text) setNewPoint("");
    }
  };

  const removePoint = (idx: number) => {
    const updated = editingPoints.filter((_, i) => i !== idx);
    setEditingPoints(updated);
    updateState({ sellingPoints: updated });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadAnalyzing(true);

    try {
      let extractedPoints: string[] = [];

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const result = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = result.split(",")[1];

        const analysis = await visionChat({
          imageBase64: base64,
          mimeType: file.type,
          prompt: `请从这张产品图片中提取可以作为直播话术卖点的信息。请直接输出JSON数组，不要输出思考过程：
["卖点1", "卖点2", "卖点3"]
每个卖点用一句话概括，要具体有力，适合在直播间讲解。`,
        });

        const cleaned = analysis.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        extractedPoints = JSON.parse(cleaned);
      } else {
        const text = await file.text();
        const analysis = await chatCompletion({
          model: "deepseek-v3",
          node: "domestic",
          system: `从文件内容中提取可以作为直播话术卖点的信息。请直接输出JSON数组，不要输出思考过程：
["卖点1", "卖点2", "卖点3"]
每个卖点用一句话概括，要具体有力。`,
          prompt: text.slice(0, 3000),
        });

        const cleaned = analysis.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        extractedPoints = JSON.parse(cleaned);
      }

      if (extractedPoints.length > 0) {
        const updated = [...editingPoints, ...extractedPoints];
        setEditingPoints(updated);
        updateState({ sellingPoints: updated });
      }
    } catch (err) {
      console.error("File analysis failed:", err);
    } finally {
      setUploadAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canProceed = editingPoints.length >= 2;

  const categoryColors: Record<string, string> = {
    "功能卖点": "bg-blue-50 text-blue-700 border-blue-200",
    "情感卖点": "bg-pink-50 text-pink-700 border-pink-200",
    "价格卖点": "bg-green-50 text-green-700 border-green-200",
    "信任卖点": "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 2: AI 卖点分析</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          AI 正在分析你的产品信息，提炼核心卖点。你可以编辑、删除或新增卖点。
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">AI 正在分析产品卖点...</p>
          {streamText && (
            <pre className="mt-2 max-h-32 w-full overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {streamText.slice(0, 300)}...
            </pre>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">分析失败</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => { setHasAnalyzed(false); setError(""); startAnalysis(); }}
            className="mt-2 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            重试
          </button>
        </div>
      )}

      {hasAnalyzed && !error && (
        <>
          {/* Product name */}
          <div>
            <label className="mb-2 block text-sm font-medium">产品名称</label>
            <input
              type="text"
              value={state.productName}
              onChange={(e) => updateState({ productName: e.target.value })}
              placeholder="输入产品名称"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          {/* AI Recommendation */}
          {analysis?.recommendation_reason && (
            <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-sm">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
              <div>
                <p className="font-medium text-indigo-800">AI 专业建议</p>
                <p className="mt-1 leading-relaxed text-indigo-700">{analysis.recommendation_reason}</p>
              </div>
            </div>
          )}

          {/* Selling points */}
          <div>
            <label className="mb-3 block text-sm font-medium">
              核心卖点（{editingPoints.length} 个）
            </label>
            <div className="space-y-2">
              {editingPoints.map((point, idx) => {
                const category = analysis?.selling_points.find((p) => p.text === point)?.category;
                return (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">{idx + 1}</span>
                    <span className="flex-1 text-sm">{point}</span>
                    {category && (
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", categoryColors[category] || "bg-gray-50 text-gray-600 border-gray-200")}>
                        {category}
                      </span>
                    )}
                    <button onClick={() => removePoint(idx)} className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* AI suggested extra points */}
            {analysis?.suggested_extra_points && analysis.suggested_extra_points.length > 0 && (
              <div className="mt-3 rounded-xl bg-indigo-50/50 p-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-indigo-700">
                  <Lightbulb className="h-3.5 w-3.5" />
                  AI 建议补充以下卖点（点击添加）：
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.suggested_extra_points
                    .filter((p) => !editingPoints.includes(p))
                    .map((point, idx) => (
                      <button
                        key={idx}
                        onClick={() => addPoint(point)}
                        className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-700 transition-all hover:bg-indigo-100 hover:border-indigo-300 active:scale-95"
                      >
                        + {point}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Add new point - text input */}
            <div className="mt-3 flex gap-2">
              <input type="text" value={newPoint} onChange={(e) => setNewPoint(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPoint()} placeholder="手动输入新的卖点..." className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              <button onClick={() => addPoint()} disabled={!newPoint.trim()} className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                <Plus className="h-4 w-4" />添加
              </button>
            </div>

            {/* Upload file to extract selling points */}
            <div className="mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 disabled:opacity-50"
              >
                {uploadAnalyzing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />AI 正在从文件中提取卖点...</>
                ) : (
                  <><Upload className="h-4 w-4" />上传图片/文件，AI 自动提取卖点</>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.txt,.md,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />上一步
        </button>
        <button onClick={onNext} disabled={!canProceed} className={cn("inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all", canProceed ? "bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)]" : "cursor-not-allowed bg-gray-200 text-gray-400")}>
          下一步：参数设置<ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
