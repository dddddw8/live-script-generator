"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerateState } from "@/app/generate/page";
import { ArrowLeft, ArrowRight, Loader2, Plus, X, Lightbulb } from "lucide-react";
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
};

export function StepAnalyze({ state, updateState, onNext, onPrev }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [newPoint, setNewPoint] = useState("");
  const [editingPoints, setEditingPoints] = useState<string[]>(state.sellingPoints);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");

  const startAnalysis = useCallback(async () => {
    if (state.sellingPoints.length > 0) {
      setEditingPoints(state.sellingPoints);
      setHasAnalyzed(true);
      return;
    }

    setIsLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productInfo: state.productInfo }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamText(fullText);
      }

      const cleaned = fullText.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const parsed: AnalysisResult = JSON.parse(cleaned);
      setAnalysis(parsed);
      const points = parsed.selling_points.map((p) => p.text);
      setEditingPoints(points);
      updateState({
        productName: parsed.product_name,
        sellingPoints: points,
        wordCount: parsed.recommended_word_count,
        loopMinutes: parsed.recommended_loop_minutes,
      });
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsLoading(false);
      setHasAnalyzed(true);
    }
  }, [state.productInfo, state.sellingPoints, updateState]);

  useEffect(() => {
    startAnalysis();
  }, [startAnalysis]);

  const addPoint = () => {
    if (newPoint.trim()) {
      const updated = [...editingPoints, newPoint.trim()];
      setEditingPoints(updated);
      updateState({ sellingPoints: updated });
      setNewPoint("");
    }
  };

  const removePoint = (idx: number) => {
    const updated = editingPoints.filter((_, i) => i !== idx);
    setEditingPoints(updated);
    updateState({ sellingPoints: updated });
  };

  const canProceed = editingPoints.length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 2: AI 卖点分析</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          AI 正在分析你的产品信息，提炼核心卖点。你可以编辑、删除或新增卖点。
        </p>
      </div>

      {isLoading && !hasAnalyzed && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">AI 正在分析产品卖点...</p>
          {streamText && (
            <pre className="mt-2 max-h-32 w-full overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {streamText.slice(0, 200)}...
            </pre>
          )}
        </div>
      )}

      {hasAnalyzed && (
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

          {/* Recommendation */}
          {analysis?.recommendation_reason && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800">AI 建议</p>
                <p className="mt-1 text-amber-700">{analysis.recommendation_reason}</p>
              </div>
            </div>
          )}

          {/* Selling points */}
          <div>
            <label className="mb-3 block text-sm font-medium">
              核心卖点（{editingPoints.length} 个）
            </label>
            <div className="space-y-2">
              {editingPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm">{point}</span>
                  <button
                    onClick={() => removePoint(idx)}
                    className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new point */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPoint()}
                placeholder="输入新的卖点..."
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <button
                onClick={addPoint}
                disabled={!newPoint.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>
        </>
      )}

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
          disabled={!canProceed}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
            canProceed
              ? "bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)]"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          )}
        >
          下一步：参数设置
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
