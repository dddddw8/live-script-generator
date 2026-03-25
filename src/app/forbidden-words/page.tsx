"use client";

import { useState, useEffect, useRef } from "react";
import { FORBIDDEN_WORDS_DATA, type ForbiddenWordEntry } from "@/lib/forbidden-words-data";
import { chatCompletion } from "@/lib/ai-client";
import { ShieldAlert, Search, Filter, Plus, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "全部", "绝对化用语", "虚假承诺", "医疗功效", "导流违规", "低俗歧视", "虚假营销", "虚假宣称", "自定义",
];

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

function getCustomWords(): ForbiddenWordEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("custom_forbidden_words");
  return raw ? JSON.parse(raw) : [];
}

function saveCustomWords(words: ForbiddenWordEntry[]) {
  localStorage.setItem("custom_forbidden_words", JSON.stringify(words));
}

export default function ForbiddenWordsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [customWords, setCustomWords] = useState<ForbiddenWordEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "file">("manual");
  const [newWord, setNewWord] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const [newCategory, setNewCategory] = useState("自定义");
  const [fileAnalyzing, setFileAnalyzing] = useState(false);
  const [extractedWords, setExtractedWords] = useState<ForbiddenWordEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCustomWords(getCustomWords()); }, []);

  const allWords = [...FORBIDDEN_WORDS_DATA, ...customWords];

  const filtered = allWords.filter((w) => {
    const matchSearch = w.word.includes(search) || w.replacement.includes(search);
    const matchCategory = activeCategory === "全部" || w.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "全部" ? allWords.length : allWords.filter((w) => w.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const handleAddManual = () => {
    if (!newWord.trim() || !newReplacement.trim()) return;
    const updated = [...customWords, { word: newWord.trim(), replacement: newReplacement.trim(), category: newCategory }];
    setCustomWords(updated);
    saveCustomWords(updated);
    setNewWord("");
    setNewReplacement("");
  };

  const handleDeleteCustom = (idx: number) => {
    const updated = customWords.filter((_, i) => i !== idx);
    setCustomWords(updated);
    saveCustomWords(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileAnalyzing(true);
    setExtractedWords([]);

    try {
      let content = "";
      if (file.type.startsWith("image/")) {
        content = `[用户上传了一张图片：${file.name}，请根据文件名推测可能包含的违禁词]`;
      } else {
        content = await file.text();
      }

      const result = await chatCompletion({
        model: "deepseek-v3",
        node: "domestic",
        system: `你是抖音直播合规专家。请从以下内容中提取所有可能的直播违禁词，并给出推荐替换词和分类。

分类必须是以下之一：绝对化用语、虚假承诺、医疗功效、导流违规、低俗歧视、虚假营销、虚假宣称

请直接输出JSON数组，不要输出思考过程：
[{"word": "违禁词", "replacement": "替换词", "category": "分类"}]`,
        prompt: content.slice(0, 3000),
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const parsed: ForbiddenWordEntry[] = JSON.parse(cleaned);
      setExtractedWords(parsed);
    } catch (err) {
      console.error("File analysis failed:", err);
    } finally {
      setFileAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addExtractedWords = () => {
    const newOnes = extractedWords.filter((ew) => !allWords.some((aw) => aw.word === ew.word));
    const updated = [...customWords, ...newOnes];
    setCustomWords(updated);
    saveCustomWords(updated);
    setExtractedWords([]);
    setShowAddModal(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">违禁词库</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              共收录 {allWords.length} 个违禁词（内置 {FORBIDDEN_WORDS_DATA.length} + 自定义 {customWords.length}）
            </p>
          </div>
        </div>
        <button onClick={() => { setShowAddModal(true); setAddMode("manual"); setExtractedWords([]); }} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)]">
          <Plus className="h-4 w-4" />添加违禁词
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold">添加违禁词</h3>

            {/* Mode tabs */}
            <div className="mb-4 flex gap-2">
              <button onClick={() => setAddMode("manual")} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors", addMode === "manual" ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-[var(--color-text-secondary)]")}>
                手动添加
              </button>
              <button onClick={() => setAddMode("file")} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors", addMode === "file" ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-[var(--color-text-secondary)]")}>
                导入图片/文档
              </button>
            </div>

            {addMode === "manual" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">违禁词</label>
                    <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="如：秒杀价" className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">替换词</label>
                    <input type="text" value={newReplacement} onChange={(e) => setNewReplacement(e.target.value)} placeholder="如：限时优惠价" className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">分类</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none">
                    {CATEGORIES.filter((c) => c !== "全部").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={handleAddManual} disabled={!newWord.trim() || !newReplacement.trim()} className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  添加
                </button>
              </div>
            )}

            {addMode === "file" && (
              <div className="space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] p-6 transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5">
                  {fileAnalyzing ? (
                    <><Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" /><p className="text-sm text-[var(--color-text-secondary)]">AI 正在识别违禁词...</p></>
                  ) : (
                    <><Upload className="h-6 w-6 text-[var(--color-text-secondary)]" /><p className="text-sm text-[var(--color-text-secondary)]">上传文件，AI 自动识别违禁词</p><p className="text-xs text-[var(--color-text-secondary)]/70">支持图片、TXT、MD 等格式</p></>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,.txt,.md,.pdf" className="hidden" onChange={handleFileUpload} />

                {extractedWords.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">AI 识别到 {extractedWords.length} 个违禁词：</p>
                    <div className="max-h-48 space-y-1.5 overflow-y-auto">
                      {extractedWords.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                          <span className="forbidden-word">{w.word}</span>
                          <span className="text-gray-400">→</span>
                          <span className="replacement-word">{w.replacement}</span>
                          <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium", categoryColors[w.category] || "bg-gray-100 text-gray-700")}>{w.category}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={addExtractedWords} className="mt-3 w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white">
                      全部添加到词库
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Custom words list */}
            {customWords.length > 0 && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                <p className="mb-2 text-sm font-medium">已添加的自定义违禁词（{customWords.length}个）</p>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {customWords.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs">
                      <span className="font-medium text-indigo-700">{w.word}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-indigo-600">{w.replacement}</span>
                      <button onClick={() => handleDeleteCustom(i)} className="ml-auto text-indigo-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowAddModal(false)} className="mt-4 w-full rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium">关闭</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索违禁词或替换词..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Filter className="mt-1.5 h-4 w-4 text-[var(--color-text-secondary)]" />
        {CATEGORIES.filter((c) => categoryCounts[c] > 0 || c === "全部").map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", activeCategory === cat ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200")}>
            {cat}（{categoryCounts[cat]}）
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border-b border-[var(--color-border)] bg-gray-50 px-4 py-3 text-xs font-medium text-[var(--color-text-secondary)]">
          <span>违禁词</span><span className="px-4">分类</span><span>推荐替换</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.map((w, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto_1fr] items-center gap-0 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 hover:bg-gray-50">
              <span className="forbidden-word inline-block w-fit">{w.word}</span>
              <span className={cn("mx-4 rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[w.category] || "bg-gray-100 text-gray-700")}>{w.category}</span>
              <span className="replacement-word inline-block w-fit">{w.replacement}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">没有找到匹配的违禁词</div>}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">说明</p>
        <ul className="mt-2 space-y-1 text-blue-600">
          <li>违禁词库基于抖音平台规则整理，仅供参考</li>
          <li>实际直播中请以平台最新规则为准</li>
          <li>自定义违禁词保存在浏览器本地，清除浏览器数据后会丢失</li>
        </ul>
      </div>
    </div>
  );
}
