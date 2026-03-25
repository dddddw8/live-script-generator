"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerateState } from "@/app/generate/page";
import { streamChat, chatCompletion } from "@/lib/ai-client";
import { SCRIPT_STRUCTURE, STYLE_OPTIONS } from "@/lib/script-templates";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Copy, Check, Layers, Zap, Star, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
  onPrev: () => void;
};

type ModelVersion = {
  modelId: string;
  modelName: string;
  text: string;
  wordCount: number;
  score?: number;
  scoreReason?: string;
  isRecommended?: boolean;
};

function countChineseChars(text: string): number {
  return text.replace(/[\s\p{P}\p{S}\p{N}]/gu, "").length;
}

function buildPrompts(state: GenerateState) {
  const styleOption = STYLE_OPTIONS.find((o) => o.id === state.style);
  const sectionsGuide = SCRIPT_STRUCTURE.sections
    .map((s) => `### ${s.name}\n要求：${s.prompt_hint}\n运用技巧：${s.techniques.join("、")}`)
    .join("\n\n");

  const perSectionWords = Math.round(state.wordCount / 6);

  const system = `你是一位资深直播带货话术专家。你精通 AIDA 模型和 FABE 卖点原则。

## 话术品牌化三要素
品牌加持化、痛点场景化、卖点利他化

## 促单四大心理
从众心理、损失恐惧、稀缺效应、互惠效应

## 话术结构要求
${sectionsGuide}

## 话术风格
${styleOption?.name || "知识科普型"}：${styleOption?.prompt_extra || ""}

## 【极其重要】字数硬性要求
- 这里说的字数是指有效汉字数量（不含标点符号、空格、换行）
- 有效汉字总数必须严格控制在 ${state.wordCount} 字左右（允许上下浮动10%，即 ${Math.round(state.wordCount * 0.9)}-${Math.round(state.wordCount * 1.1)} 字之间）
- 对应 ${state.loopMinutes} 分钟的话术闭环（按每分钟约200字的语速计算）
- 每个章节平均约 ${perSectionWords} 个有效汉字，根据重要程度可适当调整
- 绝对不能超过 ${Math.round(state.wordCount * 1.15)} 个有效汉字！如果内容太多，请精简表达，突出重点
- 内容要充实饱满，不要为了凑字数而水，也不要为了控制字数而过于精简导致话术缺乏感染力

## 其他规则
口语化、有感染力、加互动引导、运用FABE原则、不用违禁词、自然过渡。`;

  const prompt = `请为以下产品生成直播话术：

产品信息：${state.productInfo}

核心卖点：
${state.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

【再次强调】请严格控制有效汉字总数在 ${state.wordCount} 字左右（${Math.round(state.wordCount * 0.9)}-${Math.round(state.wordCount * 1.1)}字），对应 ${state.loopMinutes} 分钟话术闭环。每个部分用 ### 标题分隔。`;

  return { system, prompt };
}

export function StepGenerate({ state, updateState, onNext, onPrev }: Props) {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [multiVersions, setMultiVersions] = useState<ModelVersion[]>([]);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiProgress, setMultiProgress] = useState<Record<string, string>>({});
  const [scoring, setScoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(0);

  const startSingleGeneration = useCallback(async () => {
    setHasGenerated(false);
    setMode("single");
    setIsLoading(true);
    setStreamingText("");

    const { system, prompt } = buildPrompts(state);

    streamChat({
      model: "sonnet-4.6",
      node: "oversea",
      system,
      prompt,
      onChunk: (text) => setStreamingText(text),
      onDone: (fullText) => {
        updateState({ generatedScript: fullText });
        setHasGenerated(true);
        setIsLoading(false);
      },
      onError: (err) => {
        console.error("Generation failed:", err);
        setIsLoading(false);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.productInfo, state.sellingPoints, state.style, state.wordCount, state.loopMinutes]);

  useEffect(() => {
    if (state.generatedScript) {
      setStreamingText(state.generatedScript);
      setHasGenerated(true);
      return;
    }
    startSingleGeneration();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMultiGeneration = async () => {
    setMode("multi");
    setMultiLoading(true);
    setMultiVersions([]);
    setMultiProgress({});
    setScoring(false);

    const { system, prompt } = buildPrompts(state);
    const models = [
      { id: "sonnet-4.6", name: "Claude 4.6 Sonnet", node: "oversea" as const },
      { id: "deepseek-v3", name: "DeepSeek V3", node: "domestic" as const },
      { id: "qwen3-235b-a22b", name: "Qwen3 235B", node: "domestic" as const },
    ];

    const versions: ModelVersion[] = [];

    await Promise.allSettled(
      models.map(async (m) => {
        setMultiProgress((prev) => ({ ...prev, [m.id]: "生成中..." }));

        return new Promise<void>((resolve) => {
          streamChat({
            model: m.id,
            node: m.node,
            system,
            prompt,
            onChunk: (text) => {
              setMultiProgress((prev) => ({
                ...prev,
                [m.id]: `已生成 ${countChineseChars(text)} 字`,
              }));
            },
            onDone: (fullText) => {
              const wc = countChineseChars(fullText);
              setMultiProgress((prev) => ({ ...prev, [m.id]: `完成 ${wc} 字` }));
              versions.push({ modelId: m.id, modelName: m.name, text: fullText, wordCount: wc });
              resolve();
            },
            onError: (err) => {
              setMultiProgress((prev) => ({ ...prev, [m.id]: `失败: ${err.slice(0, 30)}` }));
              resolve();
            },
          });
        });
      })
    );

    if (versions.length > 0) {
      setMultiVersions(versions);
      setSelectedVersion(0);
      updateState({ generatedScript: versions[0].text });
      setStreamingText(versions[0].text);
      setHasGenerated(true);
      setMultiLoading(false);

      scoreVersions(versions);
    } else {
      setMultiLoading(false);
    }
  };

  const scoreVersions = async (versions: ModelVersion[]) => {
    setScoring(true);
    try {
      const summaries = versions
        .map((v, i) => `【版本${i + 1}: ${v.modelName}】（${v.wordCount}字）\n${v.text.slice(0, 500)}...`)
        .join("\n\n---\n\n");

      const result = await chatCompletion({
        model: "deepseek-v3",
        node: "domestic",
        system: `你是一位直播话术评审专家。请对以下几个版本的直播话术进行评分和对比。

评分维度（每项1-10分）：
1. 开场吸引力：开场是否能快速抓住用户注意力
2. 卖点说服力：卖点展示是否具体、有数据、有对比
3. 情感感染力：是否能打动用户，产生购买欲望
4. 促单有效性：促单环节是否有紧迫感和行动引导
5. 整体流畅度：话术是否口语化、自然、过渡流畅
6. 字数合规性：是否符合要求的字数范围

请直接输出JSON数组，不要输出思考过程，不要包含markdown代码块标记：
[
  {"version": 1, "score": 85, "reason": "一句话点评优劣势"},
  {"version": 2, "score": 78, "reason": "一句话点评优劣势"}
]`,
        prompt: summaries,
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const scores: { version: number; score: number; reason: string }[] = JSON.parse(cleaned);

      const maxScore = Math.max(...scores.map((s) => s.score));

      const scored = versions.map((v, i) => {
        const s = scores.find((sc) => sc.version === i + 1);
        return {
          ...v,
          score: s?.score,
          scoreReason: s?.reason,
          isRecommended: s?.score === maxScore,
        };
      });

      setMultiVersions(scored);

      const bestIdx = scored.findIndex((v) => v.isRecommended);
      if (bestIdx >= 0) {
        setSelectedVersion(bestIdx);
        updateState({ generatedScript: scored[bestIdx].text });
        setStreamingText(scored[bestIdx].text);
      }
    } catch (err) {
      console.error("Scoring failed:", err);
    } finally {
      setScoring(false);
    }
  };

  const handleCopy = async () => {
    const text = mode === "multi" && multiVersions.length > 0 ? multiVersions[selectedVersion].text : (state.generatedScript || streamingText);
    if (text) { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleEdit = () => {
    setEditText(mode === "multi" && multiVersions.length > 0 ? multiVersions[selectedVersion].text : (state.generatedScript || streamingText));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateState({ generatedScript: editText });
    setStreamingText(editText);
    setIsEditing(false);
    setHasGenerated(true);
  };

  const selectMultiVersion = (idx: number) => {
    setSelectedVersion(idx);
    updateState({ generatedScript: multiVersions[idx].text });
    setStreamingText(multiVersions[idx].text);
  };

  const displayText = mode === "multi" && multiVersions.length > 0 ? multiVersions[selectedVersion].text : (state.generatedScript || streamingText);
  const effectiveWordCount = countChineseChars(displayText);
  const loading = isLoading || multiLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 4: AI 生成话术</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">AI 正在根据你的产品信息和参数设置生成专业话术</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { if (!loading) startSingleGeneration(); }} disabled={loading} className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all", mode === "single" && !loading ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] hover:bg-gray-50 disabled:opacity-50")}>
          <Zap className="h-4 w-4" />单模型快速生成
        </button>
        <button onClick={() => { if (!loading) startMultiGeneration(); }} disabled={loading} className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all", mode === "multi" && !loading ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] hover:bg-gray-50 disabled:opacity-50")}>
          <Layers className="h-4 w-4" />多模型交叉对比
        </button>
      </div>

      {/* Single model loading */}
      {isLoading && mode === "single" && (
        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-indigo-700">AI 正在生成话术...</span>
          <span className="text-xs text-indigo-500">已生成 {countChineseChars(streamingText)} 字（有效汉字）</span>
        </div>
      )}

      {/* Multi model progress */}
      {(multiLoading || scoring) && mode === "multi" && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-sm font-medium">
            {scoring ? (
              <><Lightbulb className="mr-1.5 inline h-4 w-4 text-amber-500" />AI 正在评分对比各版本话术...</>
            ) : (
              <><Loader2 className="mr-1.5 inline h-4 w-4 animate-spin text-[var(--color-primary)]" />多个 AI 模型正在同时生成...</>
            )}
          </p>
          <div className="space-y-2">
            {[
              { id: "sonnet-4.6", name: "Claude 4.6 Sonnet" },
              { id: "deepseek-v3", name: "DeepSeek V3" },
              { id: "qwen3-235b-a22b", name: "Qwen3 235B" },
            ].map((m) => {
              const progress = multiProgress[m.id];
              const isDone = progress?.startsWith("完成");
              const isFailed = progress?.startsWith("失败");
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                  {isDone ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : isFailed ? (
                    <span className="text-sm text-red-500">✗</span>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                  )}
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className={cn("ml-auto text-xs", isDone ? "text-green-600" : isFailed ? "text-red-500" : "text-[var(--color-text-secondary)]")}>
                    {progress || "等待中..."}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-model version tabs */}
      {mode === "multi" && multiVersions.length > 1 && !multiLoading && (
        <div className="flex flex-wrap gap-2">
          {multiVersions.map((v, idx) => (
            <button key={v.modelId} onClick={() => selectMultiVersion(idx)} className={cn("relative rounded-lg px-4 py-2 text-sm font-medium transition-all", selectedVersion === idx ? "bg-[var(--color-primary)] text-white shadow-md" : "border border-[var(--color-border)] hover:bg-gray-50")}>
              {v.isRecommended && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow-sm">
                  <Star className="h-3 w-3 text-white" />
                </span>
              )}
              {v.modelName}
              <span className="ml-2 text-xs opacity-70">{v.wordCount}字</span>
              {v.score && <span className="ml-1 text-xs opacity-70">{v.score}分</span>}
            </button>
          ))}
        </div>
      )}

      {/* Score reason for selected version */}
      {mode === "multi" && multiVersions.length > 0 && multiVersions[selectedVersion]?.scoreReason && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <span className="font-medium text-amber-800">AI 评价：</span>
            <span className="text-amber-700">{multiVersions[selectedVersion].scoreReason}</span>
            {multiVersions[selectedVersion].isRecommended && (
              <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                <Star className="h-2.5 w-2.5" />推荐
              </span>
            )}
          </div>
        </div>
      )}

      {/* Script display */}
      <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{mode === "multi" && multiVersions.length > 0 ? `${multiVersions[selectedVersion].modelName} 版本` : "生成结果"}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{effectiveWordCount} 有效字</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} disabled={!displayText} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100 disabled:opacity-50">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "已复制" : "复制"}
            </button>
            {!isEditing && hasGenerated && <button onClick={handleEdit} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10">编辑</button>}
            <button onClick={mode === "multi" ? startMultiGeneration : startSingleGeneration} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100 disabled:opacity-50">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />重新生成
            </button>
          </div>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-3">
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={20} className="w-full rounded-lg border border-[var(--color-border)] p-4 text-sm leading-relaxed focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">保存修改</button>
                <button onClick={() => setIsEditing(false)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium">取消</button>
              </div>
            </div>
          ) : (
            <div className="prose-script whitespace-pre-wrap text-sm leading-relaxed">
              {displayText || (<div className="flex items-center gap-2 text-[var(--color-text-secondary)]"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>)}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"><ArrowLeft className="h-4 w-4" />上一步</button>
        <button onClick={() => { if (!state.generatedScript && streamingText) updateState({ generatedScript: streamingText }); onNext(); }} disabled={loading || !displayText} className={cn("inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all", !loading && displayText ? "bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)]" : "cursor-not-allowed bg-gray-200 text-gray-400")}>
          下一步：违禁词检测<ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
