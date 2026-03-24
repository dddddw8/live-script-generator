"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getScripts, deleteScript } from "@/lib/storage";
import type { ScriptRecord } from "@/lib/supabase";
import { FileText, Trash2, Clock, Hash, Mic, Search } from "lucide-react";

export default function HistoryPage() {
  const [scripts, setScripts] = useState<ScriptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    const data = await getScripts();
    setScripts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条话术记录吗？")) return;
    await deleteScript(id);
    setScripts((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = scripts.filter(
    (s) =>
      s.product_name.toLowerCase().includes(search.toLowerCase()) ||
      s.final_script.toLowerCase().includes(search.toLowerCase())
  );

  const styleLabels: Record<string, string> = {
    knowledge: "知识科普",
    emotion: "情感共鸣",
    promotion: "促销逼单",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">历史记录</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            共 {scripts.length} 条话术记录
          </p>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)]"
        >
          <Mic className="h-4 w-4" />
          新建话术
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索产品名称或话术内容..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-[var(--color-text-secondary)]">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="text-[var(--color-text-secondary)]">
            {search ? "没有找到匹配的记录" : "还没有生成过话术"}
          </p>
          {!search && (
            <Link
              href="/generate"
              className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              去生成第一条话术
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((script) => (
            <div
              key={script.id}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-primary)]/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <Link href={`/history/${script.id}`} className="flex-1">
                  <h3 className="text-lg font-semibold group-hover:text-[var(--color-primary)]">
                    {script.product_name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(script.created_at).toLocaleString("zh-CN")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {script.final_script.length} 字
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">
                      {styleLabels[script.style] || script.style}
                    </span>
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-600">
                      {script.loop_minutes}分钟
                    </span>
                    {script.forbidden_check_result && script.forbidden_check_result.total_found > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-600">
                        替换{script.forbidden_check_result.total_replaced}处违禁词
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {script.final_script.slice(0, 150)}...
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(script.id)}
                  className="ml-4 shrink-0 rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
