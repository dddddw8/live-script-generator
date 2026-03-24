# 直播话术智能生成器

> AI 驱动的直播带货话术生成工具，输入产品信息即可自动生成专业话术，内置违禁词检测与替换。

## 项目简介

### 解决什么问题

直播运营人员在日常工作中，**单品话术撰写耗时 1-2 小时**，且容易触碰平台违禁词导致直播间被处罚。本工具将话术撰写时间缩短至 **5-10 分钟**，并自动检测违禁词，大幅提升工作效率和合规安全性。

### 核心功能

1. **AI 智能生成话术**：基于「痛点→背书→卖点→促单」经过实战验证的话术闭环结构
2. **多模型交叉对比**：GPT-4o 和 GPT-4o Mini 同时生成，选择最优版本
3. **违禁词检测与替换**：内置 150+ 抖音违禁词库（6大类），自动标红违禁词、标绿替换词
4. **灵活参数配置**：支持选择话术风格（知识科普/情感共鸣/促销逼单）、字数、闭环时间
5. **历史记录管理**：所有生成的话术自动保存，支持搜索、编辑、下载

### 使用流程

1. 输入产品信息（支持快捷模板）
2. AI 自动分析提炼核心卖点
3. 选择话术风格、字数、闭环时间
4. AI 生成话术（支持单模型/多模型对比）
5. 违禁词自动检测与可视化替换
6. 终版话术输出、编辑、保存

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS 4 + Lucide Icons |
| AI | Vercel AI SDK + OpenAI GPT-4o |
| 存储 | localStorage（本地）/ Supabase PostgreSQL（云端） |
| 部署 | Vercel |

## 存储说明

项目支持**双模式存储**：

- **本地模式（默认）**：使用浏览器 localStorage 存储话术记录，无需配置数据库，开箱即用
- **云端模式**：配置 Supabase 后自动切换为 PostgreSQL 存储，数据持久化、跨设备同步

数据可保存、可持久化、重启后可回放验证。

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 API Key

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可使用。

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API Key | 是 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 否（不填则使用 localStorage） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 Key | 否 |

### Supabase 建表（可选）

如需使用云端存储，在 Supabase SQL Editor 中执行 `supabase-schema.sql`。

## AI 使用说明

### AI 在各环节的使用方式

| 环节 | AI 使用方式 |
|------|-----------|
| 卖点分析 | 调用 GPT-4o 分析产品信息，自动提炼 5-8 个核心卖点并分类 |
| 话术生成 | 基于预设的话术结构 Prompt（痛点→背书→卖点→促单），调用大模型流式生成 |
| 多模型对比 | 同时调用 GPT-4o 和 GPT-4o Mini，并行生成两个版本供用户选择 |
| 违禁词检测 | 基于本地违禁词库进行文本匹配检测，AI 辅助推荐替换词 |
| 代码开发 | 使用 Cursor + Claude 进行全部代码开发 |

### 话术结构模板

系统内置的话术结构基于直播运营实战经验验证：

1. **开场痛点**：用痛点场景吸引目标用户停留
2. **品牌背书 + 引出产品**：用品牌实力建立信任
3. **主卖点展示 + 竞品对比**：逐一展示核心卖点
4. **首次促单 + 售后保障**：第一次促单闭环
5. **感情升华 + 应用场景**：从功能升华到情感价值
6. **二次促单 + 收尾**：最后一波促单

## 团队分工

| 成员 | 职责 |
|------|------|
| 杜文（队长） | 产品需求定义、话术结构设计、违禁词库整理、测试验收、路演 |
| 队友A | 配合 Cursor 进行页面调整和内容填充 |
| 队友B | 演示视频制作、README 文档完善 |

## 项目结构

```
src/
├── app/
│   ├── page.tsx                 # 首页
│   ├── generate/page.tsx        # 话术生成主页面（6步流程）
│   ├── history/page.tsx         # 历史记录列表
│   ├── history/[id]/page.tsx    # 话术详情页
│   ├── forbidden-words/page.tsx # 违禁词库管理
│   └── api/
│       ├── generate/route.ts    # 单模型话术生成 API
│       ├── generate-multi/route.ts # 多模型对比生成 API
│       ├── analyze/route.ts     # 卖点分析 API
│       └── check-forbidden/route.ts # 违禁词检测 API
├── components/
│   ├── navbar.tsx               # 导航栏
│   └── steps/                   # 6个步骤组件
│       ├── step-input.tsx       # Step 1: 产品信息输入
│       ├── step-analyze.tsx     # Step 2: AI 卖点分析
│       ├── step-params.tsx      # Step 3: 参数设置
│       ├── step-generate.tsx    # Step 4: AI 生成话术
│       ├── step-forbidden.tsx   # Step 5: 违禁词检测
│       └── step-final.tsx       # Step 6: 终版输出
└── lib/
    ├── utils.ts                 # 工具函数
    ├── supabase.ts              # Supabase 客户端
    ├── storage.ts               # 存储层（双模式）
    ├── script-templates.ts      # 话术结构模板
    └── forbidden-words-data.ts  # 违禁词库数据
```
