"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Sparkles, ShieldCheck, FileText } from "lucide-react";

const DEMO_INPUT = "斑马科学探究显微镜，299元，1200倍放大，适合3-12岁...";

const DEMO_SCRIPT_LINES = [
  "### 开场痛点",
  "家长朋友们，你家的宝贝是不是总有十万个为什么？",
  "叶子为什么是绿色的？细菌长什么样？",
  "今天斑马科学显微镜直接安排上！",
  "",
  "### 品牌背书",
  "斑马，专业做儿童教育启蒙的大品牌，",
  "全国3000万家庭的选择，品质有保障！",
  "",
  "### 主卖点展示",
  "1200倍专业放大，看清细胞核的细节！",
  "双光源设计，室内户外随时能用...",
];

const DEMO_FORBIDDEN = [
  { word: "最好的", replacement: "非常优质的", done: false },
  { word: "第一品牌", replacement: "知名品牌", done: false },
];

type Phase = "input" | "analyze" | "generate" | "check" | "done";

export function DemoAnimation() {
  const [phase, setPhase] = useState<Phase>("input");
  const [inputIdx, setInputIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [checkIdx, setCheckIdx] = useState(-1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Typing input
    for (let i = 0; i <= DEMO_INPUT.length; i++) {
      timers.push(setTimeout(() => setInputIdx(i), i * 50));
    }

    // Phase 2: Analyzing
    timers.push(setTimeout(() => setPhase("analyze"), DEMO_INPUT.length * 50 + 500));

    // Phase 3: Generating script lines
    timers.push(setTimeout(() => setPhase("generate"), DEMO_INPUT.length * 50 + 2000));
    for (let i = 0; i < DEMO_SCRIPT_LINES.length; i++) {
      timers.push(setTimeout(() => setLineIdx(i + 1), DEMO_INPUT.length * 50 + 2000 + i * 300));
    }

    // Phase 4: Forbidden word check
    const genEnd = DEMO_INPUT.length * 50 + 2000 + DEMO_SCRIPT_LINES.length * 300;
    timers.push(setTimeout(() => setPhase("check"), genEnd + 500));
    timers.push(setTimeout(() => setCheckIdx(0), genEnd + 1000));
    timers.push(setTimeout(() => setCheckIdx(1), genEnd + 1800));

    // Phase 5: Done
    timers.push(setTimeout(() => setPhase("done"), genEnd + 2800));

    // Restart loop
    timers.push(setTimeout(() => {
      setPhase("input");
      setInputIdx(0);
      setLineIdx(0);
      setCheckIdx(-1);
    }, genEnd + 5000));

    return () => timers.forEach(clearTimeout);
  }, [phase === "input" && inputIdx === 0 ? Date.now() : 0]);

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">看看它是怎么工作的</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">从输入产品信息到生成终版话术，全流程自动化</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
          {/* Mock browser bar */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-gray-50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="ml-2 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400">
              live-script-generator.app/generate
            </div>
          </div>

          <div className="p-6">
            {/* Step indicator mini */}
            <div className="mb-5 flex items-center justify-center gap-1">
              {["输入", "分析", "生成", "检测", "完成"].map((label, i) => {
                const phases: Phase[] = ["input", "analyze", "generate", "check", "done"];
                const currentIdx = phases.indexOf(phase);
                return (
                  <div key={label} className="flex items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${i <= currentIdx ? "bg-[var(--color-primary)] text-white" : "bg-gray-200 text-gray-400"}`}>
                      {i < currentIdx ? "✓" : i + 1}
                    </div>
                    {i < 4 && <div className={`mx-0.5 h-0.5 w-6 transition-all duration-300 ${i < currentIdx ? "bg-[var(--color-primary)]" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Phase: Input */}
            {phase === "input" && (
              <div className="animate-fade-in space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" />
                  输入产品信息
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm">
                  <span>{DEMO_INPUT.slice(0, inputIdx)}</span>
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-[var(--color-primary)]" />
                </div>
              </div>
            )}

            {/* Phase: Analyze */}
            {phase === "analyze" && (
              <div className="animate-fade-in flex flex-col items-center gap-3 py-4">
                <Sparkles className="h-8 w-8 animate-pulse text-[var(--color-primary)]" />
                <p className="text-sm font-medium">AI 正在分析产品卖点...</p>
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Phase: Generate */}
            {phase === "generate" && (
              <div className="animate-fade-in space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                  AI 生成话术中...
                  <span className="text-xs text-[var(--color-primary)]">{lineIdx * 25} 字</span>
                </div>
                <div className="max-h-48 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm leading-relaxed">
                  {DEMO_SCRIPT_LINES.slice(0, lineIdx).map((line, i) => (
                    <div key={i} className={line.startsWith("###") ? "mt-2 font-bold text-[var(--color-primary)]" : "text-gray-700"}>
                      {line.startsWith("###") ? line.replace("### ", "") : line}
                    </div>
                  ))}
                  {lineIdx < DEMO_SCRIPT_LINES.length && <span className="inline-block h-4 w-0.5 animate-pulse bg-[var(--color-primary)]" />}
                </div>
              </div>
            )}

            {/* Phase: Check */}
            {phase === "check" && (
              <div className="animate-fade-in space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  违禁词检测中...
                </div>
                <div className="space-y-2">
                  {DEMO_FORBIDDEN.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-all duration-500 ${i <= checkIdx ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5" : "border-gray-200 opacity-30"}`}>
                      <span className="forbidden-word">{item.word}</span>
                      <span className="text-gray-400">→</span>
                      <span className="replacement-word">{item.replacement}</span>
                      {i <= checkIdx && <span className="ml-auto text-xs text-green-600">✓ 已替换</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase: Done */}
            {phase === "done" && (
              <div className="animate-fade-in flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-base font-semibold text-green-700">话术生成完成！</p>
                <p className="text-xs text-[var(--color-text-secondary)]">1200字 · 6分钟闭环 · 2处违禁词已替换</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
