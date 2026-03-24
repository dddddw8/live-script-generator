"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getScriptById, updateScript } from "@/lib/storage";
import type { ScriptRecord } from "@/lib/supabase";
import { ArrowLeft, Copy, Check, Save, Download, FileText, Clock, Hash } from "lucide-react";

export default function ScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [script, setScript] = useState<ScriptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadScript();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadScript = async () => {
    const data = await getScriptById(id);
    setScript(data);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (script) {
      await navigator.clipboard.writeText(script.final_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEdit = () => {
    if (script) {
      setEditText(script.final_script);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (script) {
      setSaving(true);
      await updateScript(script.id, { final_script: editText });
      setScript({ ...script, final_script: editText });
      setIsEditing(false);
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!script) return;
    const blob = new Blob([script.final_script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.product_name}_${new Date(script.created_at).toLocaleDateString("zh-CN")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const styleLabels: Record<string, string> = {
    knowledge: "知识科普型",
    emotion: "情感共鸣型",
    promotion: "促销逼单型",
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="text-[var(--color-text-secondary)]">未找到该话术记录</p>
        <button
          onClick={() => router.push("/history")}
          className="mt-4 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/history")}
          className="rounded-lg border border-[var(--color-border)] p-2 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{script.product_name}</h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
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
              {script.loop_minutes}分钟闭环
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">产品信息</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{script.product_info}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">核心卖点</h3>
          <ul className="space-y-1">
            {script.selling_points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
                  {idx + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Script content */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="text-sm font-medium">终版话术</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制"}
            </button>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
              >
                编辑
              </button>
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100"
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </button>
          </div>
        </div>
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-[var(--color-border)] p-4 text-sm leading-relaxed focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "保存中..." : "保存修改"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="prose-script whitespace-pre-wrap text-sm leading-relaxed">
              {script.final_script}
            </div>
          )}
        </div>
      </div>

      {/* Forbidden words result */}
      {script.forbidden_check_result && script.forbidden_check_result.total_found > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-medium text-amber-800">
            违禁词检测结果：共替换 {script.forbidden_check_result.total_replaced} 处
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {script.forbidden_check_result.replacements.map((r, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-xs">
                <span className="forbidden-word">{r.original}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="replacement-word">{r.replacement}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
