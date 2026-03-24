import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SCRIPT_STRUCTURE } from "@/lib/script-templates";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { productInfo, sellingPoints, style, wordCount, loopMinutes } = await req.json();

  const styleDesc: Record<string, string> = {
    knowledge: "知识科普型：侧重产品知识讲解，用专业数据和对比建立信任，语气专业但不枯燥",
    emotion: "情感共鸣型：侧重场景描绘和情感连接，多用生活化语言和故事，打动用户内心",
    promotion: "促销逼单型：侧重价格优势和紧迫感，节奏快、利益点密集，快速促进转化",
  };

  const sectionsGuide = SCRIPT_STRUCTURE.sections
    .map((s) => `### ${s.name}\n${s.prompt_hint}`)
    .join("\n\n");

  const systemPrompt = `你是一位资深直播带货话术专家，拥有丰富的抖音直播运营经验。你的任务是根据用户提供的产品信息生成专业的直播话术。

## 话术结构要求
必须严格按照以下结构生成话术，每个部分用 ### 标题分隔：

${sectionsGuide}

## 风格要求
${styleDesc[style] || styleDesc.knowledge}

## 字数要求
总字数约 ${wordCount} 字（对应约 ${loopMinutes} 分钟的话术闭环）

## 重要规则
1. 话术必须口语化，像真人在直播间说话一样自然流畅
2. 多用反问句、感叹句增强感染力
3. 适当加入互动引导（如"扣1"、"点关注"等）
4. 卖点介绍要具体，有数据、有对比、有场景
5. 促单环节要有紧迫感但不能虚假营销
6. 不要使用违禁词（如"最好"、"第一"、"100%有效"等绝对化用语）
7. 每个部分之间要有自然的过渡，不能生硬跳转`;

  const userPrompt = `请为以下产品生成直播话术：

## 产品信息
${productInfo}

## 核心卖点
${sellingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

请按照话术结构要求，生成约 ${wordCount} 字的完整直播话术。`;

  const models = [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  ];

  try {
    const results = await Promise.allSettled(
      models.map(async (m) => {
        const result = await generateText({
          model: openai(m.id),
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
