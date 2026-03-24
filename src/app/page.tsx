import Link from "next/link";
import { Mic, Zap, ShieldCheck, Clock, ArrowRight, Sparkles, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI 智能生成",
    desc: "基于大模型，输入产品信息即可生成专业直播话术",
  },
  {
    icon: BarChart3,
    title: "结构化话术",
    desc: "内置「痛点→背书→卖点→促单」经过实战验证的话术闭环",
  },
  {
    icon: ShieldCheck,
    title: "违禁词检测",
    desc: "内置 500+ 抖音违禁词库，自动检测并推荐合规替换词",
  },
  {
    icon: Zap,
    title: "多模型交叉",
    desc: "多个 AI 模型同时生成，交叉比对输出最优版本",
  },
  {
    icon: Clock,
    title: "5 分钟出稿",
    desc: "从输入到终版话术，全流程 5 分钟内完成",
  },
  {
    icon: Mic,
    title: "灵活定制",
    desc: "支持选择话术风格、字数、闭环时间，满足不同场景",
  },
];

const steps = [
  { num: "01", title: "输入产品信息", desc: "描述你要售卖的产品和策略" },
  { num: "02", title: "AI 分析卖点", desc: "AI 搜索背景信息，提炼核心卖点" },
  { num: "03", title: "选择参数", desc: "选择话术风格、字数和闭环时间" },
  { num: "04", title: "生成话术", desc: "多模型交叉生成最优话术" },
  { num: "05", title: "违禁词检测", desc: "自动检测并替换违规用词" },
  { num: "06", title: "输出终版", desc: "编辑确认后保存终版话术" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              AI 驱动的直播话术工具
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              直播话术
              <span className="block bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                智能生成器
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              输入产品信息，AI 自动生成符合「痛点→背书→卖点→促单」结构的专业直播话术。
              内置违禁词检测，让你的每一场直播都安全合规、转化拉满。
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
              >
                开始生成话术
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                查看历史记录
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">核心功能</h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            专为直播运营人员打造的 AI 话术工具
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all hover:border-[var(--color-primary)]/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">使用流程</h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              6 步完成从产品信息到终版话术的全流程
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-[var(--color-primary-dark)] hover:shadow-xl"
            >
              立即体验
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-secondary)]">
        <p>直播话术智能生成器 &copy; 2026 | AI 驱动 &middot; 实战验证</p>
      </footer>
    </div>
  );
}
