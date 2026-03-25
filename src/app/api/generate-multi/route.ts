import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SCRIPT_STRUCTURE, STYLE_OPTIONS } from "@/lib/script-templates";

export const maxDuration = 120;

const oversea = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const domestic = createOpenAI({
  apiKey: process.env.DOMESTIC_API_KEY,
  baseURL: process.env.DOMESTIC_BASE_URL,
});

export async function POST(req: Request) {
  const { productInfo, sellingPoints, style, wordCount, loopMinutes } = await req.json();

  const styleOption = STYLE_OPTIONS.find((o) => o.id === style);

  const sectionsGuide = SCRIPT_STRUCTURE.sections
    .map((s) => `### ${s.name}\n要求：${s.prompt_hint}\n运用技巧：${s.techniques.join("、")}`)
    .join("\n\n");

  const systemPrompt = `你是一位资深直播带货话术专家，拥有丰富的抖音直播运营经验。你精通 AIDA 模型（Attention-Interest-Desire-Action）和 FABE 卖点原则（Feature-Advantage-Benefit-Evidence）。

## 话术品牌化三要素
- 品牌加持化：品牌实力背书 + 产品细节展示
- 痛点场景化：场景描述痛点 + 场景放大后果
- 卖点利他化：解决什么问题 + 带来什么好处

## 促单四大心理
从众心理、损失恐惧、稀缺效应、互惠效应

## 话术结构要求
${sectionsGuide}

## 风格要求
${styleOption?.name || "知识科普型"}：${styleOption?.prompt_extra || ""}

## 字数要求
总字数约 ${wordCount} 字（对应约 ${loopMinutes} 分钟的话术闭环）

## 重要规则
1. 话术必须口语化，像真人在直播间说话一样自然流畅
2. 多用反问句、感叹句增强感染力
3. 适当加入互动引导
4. 卖点介绍要运用 FABE 原则
5. 促单环节要运用四大心理，但不能虚假营销
6. 不要使用违禁词
7. 每个部分之间要有自然的过渡`;

  const userPrompt = `请为以下产品生成直播话术：

## 产品信息
${productInfo}

## 核心卖点
${sellingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

请按照话术结构要求，生成约 ${wordCount} 字的完整直播话术。`;

  const models = [
    { provider: oversea, id: "sonnet-4.6", name: "Claude 4.6 Sonnet" },
    { provider: domestic, id: "deepseek-v3", name: "DeepSeek V3" },
    { provider: domestic, id: "qwen3-235b-a22b", name: "Qwen3 235B" },
  ];

  try {
    const results = await Promise.allSettled(
      models.map(async (m) => {
        const result = await generateText({
          model: m.provider(m.id),
          system: systemPrompt,
          prompt: userPrompt,
        });
        return {
          modelId: m.id,
          modelName: m.name,
          text: result.text,
          wordCount: result.text.length,
        };
      })
    );

    const versions = results
      .filter((r): r is PromiseFulfilledResult<{ modelId: string; modelName: string; text: string; wordCount: number }> => r.status === "fulfilled")
      .map((r) => r.value);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Multi-model generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
