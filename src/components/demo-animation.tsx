"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Sparkles, ShieldCheck, FileText } from "lucide-react";

const DEMO_INPUT = "斑马科学探究显微镜，299元，1200倍放大，适合3-12岁儿童...";

const DEMO_LINES = [
  { text: "开场痛点", isTitle: true },
  { text: "家长朋友们，你家的宝贝是不是总有十万个为什么？", isTitle: false },
  { text: "叶子为什么是绿色的？细菌长什么样？", isTitle: false },
  { text: "今天斑马科学显微镜直接安排上！", isTitle: false },
  { text: "品牌背书", isTitle: true },
  { text: "斑马，专业做儿童教育启蒙的大品牌，", isTitle: false },
  { text: "全国3000万家庭的选择！", isTitle: false },
  { text: "主卖点展示", isTitle: true },
  { text: "1200倍专业放大，看清细胞核的细节！", isTitle: false },
  { text: "双光源设计，室内户外随时能用...", isTitle: false },
];

const CHECKS = [
  { word: "最好的品质", fix: "非常优质的品质" },
  { word: "第一品牌", fix: "知名品牌" },
];

export function DemoAnimation() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);
  const [checked, setChecked] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sequence = [
      // Step 0: typing input
      () => { setStep(0); setTyped(0); setLines(0); setChecked(0); },
      // Step 1: analyzing
      () => { setStep(1); },
      // Step 2: generating
      () => { setStep(2); setLines(0); },
      // Step 3: checking
      () => { setStep(3); setChecked(0); },
      // Step 4: done
      () => { setStep(4); },
    ];

    let seqIdx = 0;
    sequence[0]();

    intervalRef.current = setInterval(() => {
      if (step === 0 && typed < DEMO_INPUT.length) return;
      if (step === 2 && lines < DEMO_LINES.length) return;
      if (step === 3 && checked < CHECKS.length) return;

      seqIdx = (seqIdx + 1) % sequence.length;
      sequence[seqIdx]();
    }, 2000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typing effect
  useEffect(() => {
    if (step !== 0) return;
    const t = setInterval(() => {
      setTyped((prev) => {
        if (prev >= DEMO_INPUT.length) { clearInterval(t); return prev; }
        return prev + 1;
      });
    }, 60);
    return () => clearInterval(t);
  }, [step]);

  // Auto advance from typing to analyzing
  useEffect(() => {
    if (step === 0 && typed >= DEMO_INPUT.length) {
      const t = setTimeout(() => setStep(1), 800);
      return () => clearTimeout(t);
    }
  }, [step, typed]);

  // Auto advance from analyzing to generating
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => { setStep(2); setLines(0); }, 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Line by line generation
  useEffect(() => {
    if (step !== 2) return;
    const t = setInterval(() => {
      setLines((prev) => {
        if (prev >= DEMO_LINES.length) { clearInterval(t); return prev; }
        return prev + 1;
      });
    }, 350);
    return () => clearInterval(t);
  }, [step]);

  // Auto advance from generating to checking
  useEffect(() => {
    if (step === 2 && lines >= DEMO_LINES.length) {
      const t = setTimeout(() => { setStep(3); setChecked(0); }, 800);
      return () => clearTimeout(t);
    }
  }, [step, lines]);

  // Check items one by one
  useEffect(() => {
    if (step !== 3) return;
    const t = setInterval(() => {
      setChecked((prev) => {
        if (prev >= CHECKS.length) { clearInterval(t); return prev; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Auto advance from checking to done
  useEffect(() => {
    if (step === 3 && checked >= CHECKS.length) {
      const t = setTimeout(() => setStep(4), 1000);
      return () => clearTimeout(t);
    }
  }, [step, checked]);

  // Auto restart
  useEffect(() => {
    if (step === 4) {
      const t = setTimeout(() => { setStep(0); setTyped(0); setLines(0); setChecked(0); }, 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const phases = ["输入", "分析", "生成", "检测", "完成"];

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">看看它是怎么工作的</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">从输入产品信息到生成终版话术，全流程自动化</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-xl">
          {/* Mock browser bar */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-gray-50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="ml-2 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400">话术生成器</div>
          </div>

          <div className="bg-white p-5 sm:p-6">
            {/* Mini step indicator */}
            <div className="mb-5 flex items-center justify-center gap-1">
              {phases.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${i <= step ? "bg-[var(--color-primary)] text-white" : "bg-gray-200 text-gray-400"}`}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span className={`mt-1 text-[9px] transition-colors duration-300 ${i <= step ? "text-[var(--color-primary)] font-medium" : "text-gray-400"}`}>{label}</span>
                  </div>
                  {i < 4 && <div className={`mx-1 mb-3 h-0.5 w-5 transition-all duration-500 ${i < step ? "bg-[var(--color-primary)]" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>

            <div className="min-h-[200px]">
              {/* Step 0: Typing */}
              {step === 0 && (
                <div className="animate-fade-in space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" />输入产品信息
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    {DEMO_INPUT.slice(0, typed)}
                    <span className="inline-block h-4 w-0.5 animate-pulse bg-[var(--color-primary)]" />
                  </div>
                </div>
              )}

              {/* Step 1: Analyzing */}
              {step === 1 && (
                <div className="animate-fade-in flex flex-col items-center gap-3 py-6">
                  <Sparkles className="h-8 w-8 animate-pulse text-[var(--color-primary)]" />
                  <p className="text-sm font-medium">AI 正在分析产品卖点...</p>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Generating */}
              {step === 2 && (
                <div className="animate-fade-in space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                    AI 生成话术中...
                    <span className="ml-auto text-xs text-[var(--color-primary)]">{lines * 28} 字</span>
                  </div>
                  <div className="max-h-44 overflow-hidden rounded-lg border border-[var(--color-border)] p-3 text-sm leading-relaxed">
                    {DEMO_LINES.slice(0, lines).map((line, i) => (
                      <p key={i} className={line.isTitle ? "mt-2 font-bold text-[var(--color-primary)] first:mt-0" : "text-gray-700"}>{line.isTitle ? `### ${line.text}` : line.text}</p>
                    ))}
                    {lines < DEMO_LINES.length && <span className="inline-block h-4 w-0.5 animate-pulse bg-[var(--color-primary)]" />}
                  </div>
                </div>
              )}

              {/* Step 3: Checking */}
              {step === 3 && (
                <div className="animate-fade-in space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <ShieldCheck className="h-4 w-4 text-amber-500" />违禁词检测
                  </div>
                  <div className="space-y-2">
                    {CHECKS.map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-all duration-500 ${i < checked ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-40"}`}>
                        <span className="forbidden-word">{item.word}</span>
                        <span className="text-gray-400">→</span>
                        <span className="replacement-word">{item.fix}</span>
                        {i < checked && <span className="ml-auto text-xs font-medium text-green-600">✓ 已替换</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Done */}
              {step === 4 && (
                <div className="animate-fade-in flex flex-col items-center gap-3 py-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <FileText className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-700">话术生成完成！</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">1200字 · 6分钟闭环 · 2处违禁词已替换</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
