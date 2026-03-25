"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerateState } from "@/app/generate/page";
import { streamChat, chatCompletion } from "@/lib/ai-client";
import { SCRIPT_STRUCTURE, STYLE_OPTIONS } from "@/lib/script-templates";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Copy, Check, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onNext: () => void;
  onPrev: () => void;
};

type ModelVersion = { modelId: string; modelName: string; text: string; wordCount: number };

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
- 总字数必须严格控制在 ${state.wordCount} 字左右（允许上下浮动10%，即 ${Math.round(state.wordCount * 0.9)}-${Math.round(state.wordCount * 1.1)} 字之间）
- 对应 ${state.loopMinutes} 分钟的话术闭环（按每分钟约200字的语速计算）
- 每个章节平均约 ${perSectionWords} 字，根据重要程度可适当调整
- 绝对不能超过 ${Math.round(state.wordCount * 1.15)} 字！如果内容太多，请精简表达，突出重点
- 写完后请自行检查字数，确保符合要求

## 其他规则
口语化、有感染力、加互动引导、运用FABE原则、不用违禁词、自然过渡。`;

  const prompt = `请为以下产品生成直播话术：

产品信息：${state.productInfo}

核心卖点：
${state.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

【再次强调】请严格控制总字数在 ${state.wordCount} 字左右（${Math.round(state.wordCount * 0.9)}-${Math.round(state.wordCount * 1.1)}字），对应 ${state.loopMinutes} 分钟话术闭环。每个部分用 ### 标题分隔。`;

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
  }, [state, updateState]);

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

    const { system, prompt } = buildPrompts(state);
    const models = [
      { id: "sonnet-4.6", name: "Claude 4.6 Sonnet", node: "oversea" as const },
      { id: "deepseek-v3", name: "DeepSeek V3", node: "domestic" as const },
      { id: "qwen3-235b-a22b", name: "Qwen3 235B", node: "domestic" as const },
    ];

    try {
      const results = await Promise.allSettled(
        models.map(async (m) => {
          const text = await chatCompletion({ model: m.id, node: m.node, system, prompt });
          return { modelId: m.id, modelName: m.name, text, wordCount: text.length };
        })
      );

      const versions = results
        .filter((r): r is PromiseFulfilledResult<ModelVersion> => r.status === "fulfilled")
        .map((r) => r.value);

      if (versions.length > 0) {
        setMultiVersions(versions);
        setSelectedVersion(0);
        updateState({ generatedScript: versions[0].text });
        setStreamingText(versions[0].text);
        setHasGenerated(true);
      }
    } catch (err) {
      console.error("Multi-model failed:", err);
    } finally {
      setMultiLoading(false);
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
  const wordCount = displayText.length;
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

      {loading && (
        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-indigo-700">{mode === "multi" ? "多个 AI 模型正在同时生成..." : "AI 正在生成话术..."}</span>
          {mode === "single" && <span className="text-xs text-indigo-500">已生成 {streamingText.length} 字</span>}
        </div>
      )}

      {mode === "multi" && multiVersions.length > 1 && (
        <div className="flex gap-2">
          {multiVersions.map((v, idx) => (
            <button key={v.modelId} onClick={() => selectMultiVersion(idx)} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-all", selectedVersion === idx ? "bg-[var(--color-primary)] text-white shadow-md" : "border border-[var(--color-border)] hover:bg-gray-50")}>
              {v.modelName}<span className="ml-2 text-xs opacity-70">{v.wordCount}字</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{mode === "multi" && multiVersions.length > 0 ? `${multiVersions[selectedVersion].modelName} 版本` : "生成结果"}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{wordCount} 字</span>
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

      <div className="flex justify-between">
        <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"><ArrowLeft className="h-4 w-4" />上一步</button>
        <button onClick={() => { if (!state.generatedScript && streamingText) updateState({ generatedScript: streamingText }); onNext(); }} disabled={loading || !displayText} className={cn("inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all", !loading && displayText ? "bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)]" : "cursor-not-allowed bg-gray-200 text-gray-400")}>
          下一步：违禁词检测<ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
