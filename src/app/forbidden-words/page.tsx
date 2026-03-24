"use client";

import { useState } from "react";
import { FORBIDDEN_WORDS_DATA, type ForbiddenWordEntry } from "@/lib/forbidden-words-data";
import { ShieldAlert, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "全部",
  "绝对化用语",
  "虚假承诺",
  "医疗功效",
  "导流违规",
  "低俗歧视",
  "虚假营销",
  "虚假宣称",
];

const categoryColors: Record<string, string> = {
  "绝对化用语": "bg-red-100 text-red-700",
  "虚假承诺": "bg-orange-100 text-orange-700",
  "医疗功效": "bg-purple-100 text-purple-700",
  "导流违规": "bg-blue-100 text-blue-700",
  "低俗歧视": "bg-gray-100 text-gray-700",
  "虚假营销": "bg-yellow-100 text-yellow-700",
  "虚假宣称": "bg-pink-100 text-pink-700",
};

export default function ForbiddenWordsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = FORBIDDEN_WORDS_DATA.filter((w) => {
    const matchSearch =
      w.word.includes(search) || w.replacement.includes(search);
    const matchCategory =
      activeCategory === "全部" || w.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const categoryCounts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] =
        cat === "全部"
          ? FORBIDDEN_WORDS_DATA.length
          : FORBIDDEN_WORDS_DATA.filter((w) => w.category === cat).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">违禁词库</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              共收录 {FORBIDDEN_WORDS_DATA.length} 个违禁词及替换方案
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索违禁词或替换词..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Filter className="mt-1.5 h-4 w-4 text-[var(--color-text-secondary)]" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === cat
                ? "bg-[var(--color-primary)] text-white"
                : "bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200"
            )}
          >
            {cat}（{categoryCounts[cat]}）
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border-b border-[var(--color-border)] bg-gray-50 px-4 py-3 text-xs font-medium text-[var(--color-text-secondary)]">
          <span>违禁词</span>
          <span className="px-4">分类</span>
          <span>推荐替换</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.map((w, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-0 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 hover:bg-gray-50"
            >
              <span className="forbidden-word inline-block w-fit">{w.word}</span>
              <span
                className={cn(
                  "mx-4 rounded-full px-2 py-0.5 text-xs font-medium",
                  categoryColors[w.category] || "bg-gray-100 text-gray-700"
                )}
              >
                {w.category}
              </span>
              <span className="replacement-word inline-block w-fit">{w.replacement}</span>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
            没有找到匹配的违禁词
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">说明</p>
        <ul className="mt-2 space-y-1 text-blue-600">
          <li>违禁词库基于抖音平台规则整理，仅供参考</li>
          <li>实际直播中请以平台最新规则为准</li>
          <li>替换词为推荐方案，可在话术生成时自行修改</li>
        </ul>
      </div>
    </div>
  );
}
