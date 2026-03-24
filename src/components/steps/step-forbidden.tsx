"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerateState } from "@/app/generate/page";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
  onPrev: () => void;
};

type ReplacementItem = {
  original: string;
  replacement: string;
  category: string;
  positions: number[];
  userReplacement?: string;
  accepted: boolean;
};

export function StepForbidden({ state, updateState, onNext, onPrev }: Props) {
  const [checking, setChecking] = useState(false);
  const [items, setItems] = useState<ReplacementItem[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const runCheck = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/check-forbidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: state.generatedScript }),
      });
      const result = await res.json();
      const mapped: ReplacementItem[] = result.replacements.map(
        (r: ReplacementItem) => ({
          ...r,
          userReplacement: r.replacement,
          accepted: true,
        })
      );
      setItems(mapped);
      updateState({ forbiddenResult: result });
      setHasChecked(true);
    } catch (err) {
      console.error("Check failed:", err);
      setHasChecked(true);
    } finally {
      setChecking(false);
    }
  }, [state.generatedScript, updateState]);

  useEffect(() => {
    if (state.forbiddenResult) {
      const mapped: ReplacementItem[] = state.forbiddenResult.replacements.map(
        (r) => ({
          ...r,
          userReplacement: r.replacement,
          accepted: true,
        })
      );
      setItems(mapped);
      setHasChecked(true);
      return;
    }
    runCheck();
  }, [state.forbiddenResult, runCheck]);

  const toggleAccept = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, accepted: !item.accepted } : item))
    );
  };

  const updateReplacement = (idx: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, userReplacement: value } : item))
    );
  };

  const applyReplacements = () => {
    let text = state.generatedScript;
    const accepted = items.filter((i) => i.accepted);
    const sorted = [...accepted].sort((a, b) => {
      const posA = Math.max(...a.positions);
      const posB = Math.max(...b.positions);
      return posB - posA;
    });

    for (const item of sorted) {
      const replacement = item.userReplacement || item.replacement;
      text = text.replaceAll(item.original, replacement);
    }

    updateState({ checkedScript: text });
    onNext();
  };

  const totalFound = items.reduce((sum, i) => sum + i.positions.length, 0);
  const totalAccepted = items.filter((i) => i.accepted).reduce((sum, i) => sum + i.positions.length, 0);

  const categoryColors: Record<string, string> = {
    "绝对化用语": "bg-red-100 text-red-700",
    "虚假承诺": "bg-orange-100 text-orange-700",
    "医疗功效": "bg-purple-100 text-purple-700",
    "导流违规": "bg-blue-100 text-blue-700",
    "低俗歧视": "bg-gray-100 text-gray-700",
    "虚假营销": "bg-yellow-100 text-yellow-700",
    "虚假宣称": "bg-pink-100 text-pink-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 5: 违禁词检测</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          系统已自动扫描话术中的违禁词，你可以确认或修改替换方案
        </p>
      </div>

      {checking && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">正在检测违禁词...</p>
        </div>
      )}

      {hasChecked && (
        <>
          {/* Summary */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-4",
              totalFound === 0 ? "bg-green-50" : "bg-amber-50"
            )}
          >
            {totalFound === 0 ? (
              <>
                <ShieldCheck className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-800">恭喜，未检测到违禁词！</p>
                  <p className="text-sm text-green-600">你的话术内容合规，可以直接使用</p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold text-amber-800">
                    检测到 {totalFound} 处违禁词（{items.length} 个不同词）
                  </p>
                  <p className="text-sm text-amber-600">
                    已选择替换 {totalAccepted} 处，请确认替换方案
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Replacement list */}
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    item.accepted
                      ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[item.category] || "bg-gray-100 text-gray-700")}>
                          {item.category}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          出现 {item.positions.length} 次
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="forbidden-word">{item.original}</span>
                        <span className="text-[var(--color-text-secondary)]">&rarr;</span>
                        <input
                          type="text"
                          value={item.userReplacement || ""}
                          onChange={(e) => updateReplacement(idx, e.target.value)}
                          className="replacement-word border-none bg-transparent outline-none"
                          style={{ width: `${Math.max(4, (item.userReplacement || "").length + 2)}ch` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAccept(idx)}
                      className={cn(
                        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        item.accepted
                          ? "bg-[var(--color-primary)] text-white"
                          : "border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      )}
                    >
                      {item.accepted ? "已选择替换" : "保留原词"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {items.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">话术预览（违禁词高亮）</span>
              </div>
              <div className="max-h-64 overflow-y-auto text-sm leading-relaxed">
                {renderHighlightedText(state.generatedScript, items)}
              </div>
            </div>
          )}
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
          onClick={applyReplacements}
          disabled={checking}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {totalFound > 0 ? `应用替换并继续` : "下一步：终版输出"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function renderHighlightedText(text: string, items: ReplacementItem[]) {
  if (!items.length) return text;

  type Marker = { start: number; end: number; word: string; replacement: string; accepted: boolean };
  const markers: Marker[] = [];

  for (const item of items) {
    for (const pos of item.positions) {
      markers.push({
        start: pos,
        end: pos + item.original.length,
        word: item.original,
        replacement: item.userReplacement || item.replacement,
        accepted: item.accepted,
      });
    }
  }

  markers.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    if (m.start < lastEnd) continue;

    if (m.start > lastEnd) {
      parts.push(<span key={`t-${i}`}>{text.slice(lastEnd, m.start)}</span>);
    }

    parts.push(
      <span key={`m-${i}`} className={m.accepted ? "forbidden-word" : "bg-yellow-100 rounded px-0.5"}>
        {m.word}
      </span>
    );

    lastEnd = m.end;
  }

  if (lastEnd < text.length) {
    parts.push(<span key="tail">{text.slice(lastEnd)}</span>);
  }

  return <>{parts}</>;
}
