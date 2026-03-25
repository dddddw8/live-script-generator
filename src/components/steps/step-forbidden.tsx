"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerateState } from "@/app/generate/page";
import { chatCompletion } from "@/lib/ai-client";
import { FORBIDDEN_WORDS_DATA } from "@/lib/forbidden-words-data";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, ShieldAlert, Plus, X, Eye } from "lucide-react";
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
  context: string;
  isFalsePositive: boolean;
  userReplacement?: string;
  accepted: boolean;
};

function getCustomWords(): { word: string; replacement: string; category: string }[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("custom_forbidden_words");
  return raw ? JSON.parse(raw) : [];
}

function saveCustomWords(words: { word: string; replacement: string; category: string }[]) {
  localStorage.setItem("custom_forbidden_words", JSON.stringify(words));
}

export function StepForbidden({ state, updateState, onNext, onPrev }: Props) {
  const [checking, setChecking] = useState(false);
  const [checkPhase, setCheckPhase] = useState("");
  const [items, setItems] = useState<ReplacementItem[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setCheckPhase("正在扫描违禁词库...");
    setItems([]);
    setHasChecked(false);

    const allWords = [...FORBIDDEN_WORDS_DATA, ...getCustomWords()];
    const sorted = [...allWords].sort((a, b) => b.word.length - a.word.length);
    const text = state.generatedScript;

    const candidates: ReplacementItem[] = [];
    for (const entry of sorted) {
      let searchFrom = 0;
      while (true) {
        const idx = text.indexOf(entry.word, searchFrom);
        if (idx === -1) break;
        const start = Math.max(0, idx - 15);
        const end = Math.min(text.length, idx + entry.word.length + 15);
        const context = (start > 0 ? "..." : "") + text.slice(start, idx) + "【" + entry.word + "】" + text.slice(idx + entry.word.length, end) + (end < text.length ? "..." : "");

        const alreadyFound = candidates.some((c) => c.original === entry.word && c.context === context);
        if (!alreadyFound) {
          candidates.push({
            original: entry.word,
            replacement: entry.replacement,
            category: entry.category,
            context,
            isFalsePositive: false,
            userReplacement: entry.replacement,
            accepted: true,
          });
        }
        searchFrom = idx + entry.word.length;
      }
    }

    if (candidates.length === 0) {
      setItems([]);
      setChecking(false);
      setHasChecked(true);
      return;
    }

    setCheckPhase(`找到 ${candidates.length} 处疑似违禁词，AI 正在分析语境...`);
    setItems(candidates);

    try {
      const checkList = candidates.map((c, i) => `${i + 1}. 词："${c.original}"，语境："${c.context}"，分类：${c.category}`).join("\n");

      const result = await chatCompletion({
        model: "deepseek-v3",
        node: "domestic",
        system: `你是抖音直播合规审核专家。以下是从直播话术中通过关键词匹配找到的疑似违禁词列表。请逐条判断每个词在其语境中是否真的违规。

判断规则：
- "第一时间"中的"第一"→不违规（时间副词）
- "行业第一"中的"第一"→违规（排名宣称）
- "最后确认一下"中的"最后"→不违规（顺序词）
- "最后一批库存"中的"最后"→违规（虚假营销）
- "永远支持你"中的"永远"→不违规（情感表达）
- "永远不会坏"中的"永远"→违规（绝对化承诺）

请直接输出JSON数组，不要输出思考过程，不要包含markdown代码块标记。对每条返回是否违规：
[
  {"index": 1, "is_violation": true, "better_replacement": "推荐替换词（如果有更好的替换建议）"},
  {"index": 2, "is_violation": false, "reason": "不违规的原因"}
]`,
        prompt: checkList,
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const judgments: { index: number; is_violation: boolean; better_replacement?: string; reason?: string }[] = JSON.parse(cleaned);

      const refined = candidates.map((c, i) => {
        const j = judgments.find((jj) => jj.index === i + 1);
        if (j && !j.is_violation) {
          return { ...c, isFalsePositive: true, accepted: false };
        }
        if (j?.better_replacement) {
          return { ...c, replacement: j.better_replacement, userReplacement: j.better_replacement };
        }
        return c;
      });

      const realViolations = refined.filter((r) => !r.isFalsePositive);
      setItems(refined);

      updateState({
        forbiddenResult: {
          total_found: realViolations.length,
          total_replaced: realViolations.length,
          replacements: realViolations.map((m) => ({
            original: m.original,
            replacement: m.replacement,
            category: m.category,
            positions: [],
          })),
        },
      });
    } catch (err) {
      console.error("AI context check failed:", err);
    } finally {
      setChecking(false);
      setHasChecked(true);
      setCheckPhase("");
    }
  }, [state.generatedScript, updateState]);

  useEffect(() => {
    runCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAccept = (idx: number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, accepted: !item.accepted } : item)));
  };

  const updateReplacement = (idx: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, userReplacement: value } : item)));
  };

  const handleAddWord = () => {
    if (newWord.trim() && newReplacement.trim()) {
      const custom = getCustomWords();
      custom.push({ word: newWord.trim(), replacement: newReplacement.trim(), category: "自定义" });
      saveCustomWords(custom);
      setNewWord("");
      setNewReplacement("");
      setShowAddDialog(false);
      runCheck();
    }
  };

  const applyReplacements = () => {
    let text = state.generatedScript;
    const accepted = items.filter((i) => i.accepted && !i.isFalsePositive);
    for (const item of accepted) {
      const replacement = item.userReplacement || item.replacement;
      text = text.replaceAll(item.original, replacement);
    }
    updateState({ checkedScript: text });
    onNext();
  };

  const realItems = items.filter((i) => !i.isFalsePositive);
  const falsePositives = items.filter((i) => i.isFalsePositive);
  const totalFound = realItems.length;
  const totalAccepted = realItems.filter((i) => i.accepted).length;

  const categoryColors: Record<string, string> = {
    "绝对化用语": "bg-red-100 text-red-700",
    "虚假承诺": "bg-orange-100 text-orange-700",
    "医疗功效": "bg-purple-100 text-purple-700",
    "导流违规": "bg-blue-100 text-blue-700",
    "低俗歧视": "bg-gray-100 text-gray-700",
    "虚假营销": "bg-yellow-100 text-yellow-700",
    "虚假宣称": "bg-pink-100 text-pink-700",
    "自定义": "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Step 5: 违禁词检测</h2>
          <p className="mt-1 text-[var(--color-text-secondary)]">先扫描词库匹配，再由 AI 分析语境排除误判</p>
        </div>
        <button onClick={() => setShowAddDialog(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50">
          <Plus className="h-3.5 w-3.5" />添加自定义违禁词
        </button>
      </div>

      {/* Add custom word dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddDialog(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-5 shadow-2xl">
            <h3 className="mb-4 text-base font-bold">添加自定义违禁词</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">违禁词</label>
                <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="如：秒杀价" className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">替换词</label>
                <input type="text" value={newReplacement} onChange={(e) => setNewReplacement(e.target.value)} placeholder="如：限时优惠价" className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleAddWord} disabled={!newWord.trim() || !newReplacement.trim()} className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">添加并重新检测</button>
              <button onClick={() => setShowAddDialog(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm">取消</button>
            </div>
            {getCustomWords().length > 0 && (
              <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">已添加的自定义违禁词：</p>
                <div className="flex flex-wrap gap-1.5">
                  {getCustomWords().map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      {w.word}→{w.replacement}
                      <button onClick={() => { const cw = getCustomWords(); cw.splice(i, 1); saveCustomWords(cw); setShowAddDialog(false); setTimeout(() => setShowAddDialog(true), 50); }} className="text-indigo-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checking progress */}
      {checking && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{checkPhase}</p>
        </div>
      )}

      {hasChecked && !checking && (
        <>
          {/* Summary */}
          <div className={cn("flex items-center gap-3 rounded-xl p-4", totalFound === 0 ? "bg-green-50" : "bg-amber-50")}>
            {totalFound === 0 ? (
              <>
                <ShieldCheck className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-800">检测通过，未发现违禁词！</p>
                  <p className="text-sm text-green-600">
                    {falsePositives.length > 0 ? `扫描到 ${falsePositives.length} 处疑似词，经 AI 语境分析均为正常用法` : "话术内容合规，可以直接使用"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold text-amber-800">检测到 {totalFound} 处违禁词{falsePositives.length > 0 ? `（另有 ${falsePositives.length} 处经 AI 判断为正常用法已排除）` : ""}</p>
                  <p className="text-sm text-amber-600">已选择替换 {totalAccepted} 处，请确认替换方案</p>
                </div>
              </>
            )}
          </div>

          {/* Violation items */}
          {realItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">需要处理的违禁词：</p>
              {realItems.map((item, idx) => (
                <div key={idx} className={cn("rounded-xl border p-4 transition-all", item.accepted ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[item.category] || "bg-gray-100 text-gray-700")}>{item.category}</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">语境：{item.context}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="forbidden-word">{item.original}</span>
                        <span className="text-[var(--color-text-secondary)]">&rarr;</span>
                        <input type="text" value={item.userReplacement || ""} onChange={(e) => updateReplacement(items.indexOf(item), e.target.value)} className="replacement-word border-none bg-transparent outline-none" style={{ width: `${Math.max(4, (item.userReplacement || "").length + 2)}ch` }} />
                      </div>
                    </div>
                    <button onClick={() => toggleAccept(items.indexOf(item))} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", item.accepted ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] text-[var(--color-text-secondary)]")}>
                      {item.accepted ? "替换" : "保留"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* False positives (collapsed) */}
          {falsePositives.length > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-medium text-green-700">AI 语境分析排除的误判（{falsePositives.length} 处）：</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {falsePositives.map((item, idx) => (
                  <span key={idx} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    "{item.original}" — 正常用法
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview with highlights */}
          {realItems.length > 0 && (
            <div>
              <button onClick={() => setShowPreview(!showPreview)} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline">
                <Eye className="h-4 w-4" />{showPreview ? "收起预览" : "展开话术预览（违禁词高亮）"}
              </button>
              {showPreview && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed">
                  {renderHighlightedText(state.generatedScript, realItems.filter((i) => i.accepted))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />上一步
        </button>
        <button onClick={applyReplacements} disabled={checking} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">
          {totalFound > 0 ? `应用 ${totalAccepted} 处替换并继续` : "下一步：终版输出"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function renderHighlightedText(text: string, items: ReplacementItem[]) {
  if (!items.length) return text;

  type Marker = { start: number; end: number; word: string; replacement: string };
  const markers: Marker[] = [];

  for (const item of items) {
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(item.original, searchFrom);
      if (idx === -1) break;
      markers.push({ start: idx, end: idx + item.original.length, word: item.original, replacement: item.userReplacement || item.replacement });
      searchFrom = idx + item.original.length;
    }
  }

  markers.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    if (m.start < lastEnd) continue;
    if (m.start > lastEnd) parts.push(<span key={`t-${i}`}>{text.slice(lastEnd, m.start)}</span>);
    parts.push(
      <span key={`m-${i}`}>
        <span className="forbidden-word">{m.word}</span>
        <span className="replacement-word ml-0.5">{m.replacement}</span>
      </span>
    );
    lastEnd = m.end;
  }

  if (lastEnd < text.length) parts.push(<span key="tail">{text.slice(lastEnd)}</span>);
  return <>{parts}</>;
}
