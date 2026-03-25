"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GenerateState } from "@/app/generate/page";
import { saveScript } from "@/lib/storage";
import { ArrowLeft, Copy, Check, Save, Download, FileText, FileType, FileCode } from "lucide-react";

type Props = {
  state: GenerateState;
  updateState: (u: Partial<GenerateState>) => void;
  onPrev: () => void;
};

function countChineseChars(text: string): number {
  return text.replace(/[\s\p{P}\p{S}\p{N}]/gu, "").length;
}

export function StepFinal({ state, updateState, onPrev }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const finalText = state.checkedScript || state.generatedScript;
  const fileName = state.productName || "话术";
  const dateStr = new Date().toLocaleDateString("zh-CN");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveScript({
        product_name: state.productName || "未命名产品",
        product_info: state.productInfo,
        selling_points: state.sellingPoints,
        style: state.style,
        word_count: state.wordCount,
        loop_minutes: state.loopMinutes,
        generated_script: state.generatedScript,
        final_script: finalText,
        forbidden_check_result: state.forbiddenResult,
      });
      setSaved(true);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditText(finalText);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateState({ checkedScript: editText });
    setIsEditing(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${fileName}_${dateStr}.txt`);
  };

  const downloadMd = () => {
    const md = `# ${state.productName || "直播话术"}\n\n> 生成时间：${dateStr} | 字数：${countChineseChars(finalText)} | 闭环：${state.loopMinutes}分钟\n\n---\n\n${finalText}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${fileName}_${dateStr}.md`);
  };

  const downloadHtml = () => {
    const sections = finalText.split(/###\s*/g).filter(Boolean);
    const bodyHtml = sections.map((s) => {
      const lines = s.trim().split("\n");
      const title = lines[0];
      const content = lines.slice(1).join("\n").trim();
      return `<h2 style="color:#4f46e5;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-top:24px;">${title}</h2>\n<div style="line-height:2;white-space:pre-wrap;">${content}</div>`;
    }).join("\n");

    const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>${state.productName || "直播话术"}</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1e293b;line-height:1.8;}
h1{text-align:center;color:#4f46e5;}
.meta{text-align:center;color:#64748b;font-size:14px;margin-bottom:30px;}
</style></head><body>
<h1>${state.productName || "直播话术"}</h1>
<p class="meta">生成时间：${dateStr} | 有效字数：${countChineseChars(finalText)} | 闭环时间：${state.loopMinutes}分钟</p>
${bodyHtml}
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `${fileName}_${dateStr}.html`);
  };

  const downloadDocx = () => {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${state.productName}</title>
<style>body{font-family:宋体,SimSun,sans-serif;font-size:14px;line-height:2;}h2{color:#4f46e5;}</style></head>
<body><h1 style="text-align:center;">${state.productName || "直播话术"}</h1>
<p style="text-align:center;color:gray;">生成时间：${dateStr} | 字数：${countChineseChars(finalText)} | 闭环：${state.loopMinutes}分钟</p>
<hr/>${finalText.replace(/### (.*)/g, "<h2>$1</h2>").replace(/\n/g, "<br/>")}</body></html>`;
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    downloadBlob(blob, `${fileName}_${dateStr}.doc`);
  };

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 6: 终版话术</h2>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          以下是经过违禁词检测和替换后的终版话术，你可以继续编辑或直接保存
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-indigo-50 p-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{countChineseChars(finalText)}</p>
          <p className="text-xs text-indigo-500">有效字数</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{state.loopMinutes}min</p>
          <p className="text-xs text-purple-500">闭环时间</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{state.forbiddenResult?.total_replaced || 0}</p>
          <p className="text-xs text-green-500">违禁词已替换</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{state.sellingPoints.length}</p>
          <p className="text-xs text-amber-500">核心卖点</p>
        </div>
      </div>

      {/* Final script */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="text-sm font-medium">{state.productName || "终版话术"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制全文"}
            </button>
            {!isEditing && (
              <button onClick={handleEdit} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10">编辑</button>
            )}
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
            <div className="prose-script whitespace-pre-wrap text-sm leading-relaxed">{finalText}</div>
          )}
        </div>
      </div>

      {/* Download buttons - prominent */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="mb-3 text-sm font-semibold">
          <Download className="mr-1.5 inline h-4 w-4 text-[var(--color-primary)]" />
          下载话术
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button onClick={downloadDocx} className="flex flex-col items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition-all hover:border-blue-400 hover:shadow-md active:scale-95">
            <FileType className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Word 文档</span>
            <span className="text-[10px] text-blue-500">.doc 格式</span>
          </button>
          <button onClick={downloadHtml} className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 p-4 transition-all hover:border-purple-400 hover:shadow-md active:scale-95">
            <FileText className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">网页版</span>
            <span className="text-[10px] text-purple-500">.html 格式</span>
          </button>
          <button onClick={downloadMd} className="flex flex-col items-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 p-4 transition-all hover:border-green-400 hover:shadow-md active:scale-95">
            <FileCode className="h-6 w-6 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Markdown</span>
            <span className="text-[10px] text-green-500">.md 格式</span>
          </button>
          <button onClick={downloadTxt} className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 p-4 transition-all hover:border-gray-400 hover:shadow-md active:scale-95">
            <FileText className="h-6 w-6 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">纯文本</span>
            <span className="text-[10px] text-gray-500">.txt 格式</span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button onClick={onPrev} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />上一步
        </button>
        <div className="flex gap-3">
          {saved ? (
            <button onClick={() => router.push("/history")} className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white">
              <Check className="h-4 w-4" />已保存，查看历史记录
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? "保存中..." : "保存到历史记录"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
