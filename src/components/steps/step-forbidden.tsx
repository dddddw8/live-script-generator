"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerateState } from "@/app/generate/page";
import { chatCompletion } from "@/lib/ai-client";
import { FORBIDDEN_WORDS_DATA } from "@/lib/forbidden-words-data";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, ShieldAlert, AlertTriangle, Plus, X } from "lucide-react";
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
  const [items, setItems] = useState<ReplacementItem[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newReplacement, setNewReplacement] = useState("");

  const runCheck = useCallback(async () => {
    setChecking(true);
    setItems([]);

    const allWords = [...FORBIDDEN_WORDS_DATA, ...getCustomWords()];
    const wordsList = allWords.map((w) => `${w.word}→${w.replacement}（${w.category}）`).join("\n");

    try {
      const result = await chatCompletion({
        model: "deepseek-v3",
        node: "domestic",
        system: `你是一位抖音直播合规审核专家。请检查以下直播话术中是否包含违禁词或违规表述。

## 违禁词库参考
${wordsList}

## 检查规则
1. 逐句检查话术内容，找出可能违规的用词
2. 【重要】必须理解上下文语境，不要机械匹配：
   - "第一时间"中的"第一"不是绝对化用语，不算违禁
   - "最后一步操作"中的"最后"不是虚假营销，不算违禁
   - "永远爱你"中的"永远"如果用于情感表达而非产品承诺，不算违禁
   - 只有当这些词用于夸大产品功效、虚假宣传、绝对化承诺时才算违禁
3. 除了词库中的词，也要检查其他可能违规的表述（如变体、谐音等）
4. 给出每个违禁词的上下文（前后各10个字），方便用户理解

请直接输出JSON数组，不要输出思考过程，不要包含markdown代码块标记：
[
  {"original": "违禁词", "replacement": "推荐替换词", "category": "分类", "context": "...前文10字【违禁词】后文10字..."}
]
如果话术完全合规没有违禁词，返回：[]`,
        prompt: state.generatedScript,
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const parsed: { original: string; replacement: string; category: string; context: string }[] = JSON.parse(cleaned);

      const mapped: ReplacementItem[] = parsed.map((r) => ({
        ...r,
        userReplacement: r.replacement,
        accepted: true,
      }));

      setItems(mapped);
      updateState({
        forbiddenResult: {
          total_found: mapped.length,
          total_replaced: mapped.length,
          replacements: mapped.map((m) => ({
            original: m.original,
            replacement: m.replacement,
            category: m.category,
            positions: [],
          })),
        },
      });
    } catch (err) {
      console.error("AI check failed, falling back to local match:", err);
      runLocalCheck();
    } finally {
      setChecking(false);
      setHasChecked(true);
    }
  }, [state.generatedScript, updateState]);

  const runLocalCheck = () => {
    const allWords = [...FORBIDDEN_WORDS_DATA, ...getCustomWords()];
    const sorted = [...allWords].sort((a, b) => b.word.length - a.word.length);
    const found: ReplacementItem[] = [];

    for (const entry of sorted) {
      const idx = state.generatedScript.indexOf(entry.word);
      if (idx !== -1) {
        const start = Math.max(0, idx - 10);
        const end = Math.min(state.generatedScript.length, idx + entry.word.length + 10);
        const context = state.generatedScript.slice(start, end);
        found.push({
          original: entry.word,
          replacement: entry.replacement,
          category: entry.category,
          context: `...${context}...`,
          userReplacement: entry.replacement,
          accepted: true,
        });
      }
    }
    setItems(found);
  };

  useEffect(() => {
    if (state.forbiddenResult) {
      setHasChecked(true);
      return;
    }
    runCheck();
  }, [state.forbiddenResult, runCheck]);

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
      setHasChecked(false);
      runCheck();
    }
  };

  const applyReplacements = () => {
    let text = state.generatedScript;
    const accepted = items.filter((i) => i.accepted);
    for (const item of accepted) {
      const replacement = item.userReplacement || item.replacement;
      text = text.replaceAll(item.original, replacement);
    }
    updateState({ checkedScript: text });
    onNext();
  };

  const totalFound = items.length;
  const totalAccepted = items.filter((i) => i.accepted).length;

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
          <p className="mt-1 text-[var(--color-text-secondary)]">
            AI 智能检测话术中的违禁词（理解语境，避免误判）
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" />
          添加自定义违禁词
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
                      <button onClick={() => { const cw = getCustomWords(); cw.splice(i, 1); saveCustomWords(cw); setShowAddDialog(false); setTimeout(() => setShowAddDialog(true), 50); }} className="text-indigo-400 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {checking && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">AI 正在智能检测违禁词（理解语境中...）</p>
        </div>
      )}

      {hasChecked && !checking && (
        <>
          <div className={cn("flex items-center gap-3 rounded-xl p-4", totalFound === 0 ? "bg-green-50" : "bg-amber-50")}>
            {totalFound === 0 ? (
              <>
                <ShieldCheck className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-800">AI 检测通过，未发现违禁词！</p>
                  <p className="text-sm text-green-600">话术内容合规，可以直接使用</p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold text-amber-800">AI 检测到 {totalFound} 处可能违规的用词</p>
                  <p className="text-sm text-amber-600">已选择替换 {totalAccepted} 处，请确认替换方案</p>
                </div>
              </>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className={cn("rounded-xl border p-4 transition-all", item.accepted ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[item.category] || "bg-gray-100 text-gray-700")}>{item.category}</span>
                      </div>
                      {/* Context */}
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        语境：{item.context}
                      </p>
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
                    <button onClick={() => toggleAccept(idx)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", item.accepted ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] text-[var(--color-text-secondary)]")}>
                      {item.accepted ? "替换" : "保留"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex justify-between">
        <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />上一步
        </button>
        <button onClick={applyReplacements} disabled={checking} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">
          {totalFound > 0 ? "应用替换并继续" : "下一步：终版输出"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
