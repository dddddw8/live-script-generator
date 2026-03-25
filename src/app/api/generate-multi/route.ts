import { NextResponse } from "next/server";
import { SCRIPT_STRUCTURE, STYLE_OPTIONS } from "@/lib/script-templates";

export const maxDuration = 120;

async function callModel(baseUrl: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(req: Request) {
  const { productInfo, sellingPoints, style, wordCount, loopMinutes } = await req.json();

  const styleOption = STYLE_OPTIONS.find((o) => o.id === style);

  const sectionsGuide = SCRIPT_STRUCTURE.sections
    .map((s) => `### ${s.name}\n要求：${s.prompt_hint}\n运用技巧：${s.techniques.join("、")}`)
    .join("\n\n");

  const systemPrompt = `你是一位资深直播带货话术专家。你精通 AIDA 模型和 FABE 卖点原则。

## 话术结构要求
${sectionsGuide}

## 风格：${styleOption?.name || "知识科普型"}
## 字数：约 ${wordCount} 字（${loopMinutes}分钟闭环）

规则：口语化、有感染力、加互动引导、不用违禁词、自然过渡。`;

  const userPrompt = `请为以下产品生成直播话术：

产品信息：${productInfo}

核心卖点：
${sellingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

生成约 ${wordCount} 字的完整直播话术。`;

  const overseaUrl = process.env.OPENAI_BASE_URL!;
  const overseaKey = process.env.OPENAI_API_KEY!;
  const domesticUrl = process.env.DOMESTIC_BASE_URL!;
  const domesticKey = process.env.DOMESTIC_API_KEY!;

  const models = [
    { baseUrl: overseaUrl, apiKey: overseaKey, id: "sonnet-4.6", name: "Claude 4.6 Sonnet" },
    { baseUrl: domesticUrl, apiKey: domesticKey, id: "deepseek-v3", name: "DeepSeek V3" },
    { baseUrl: domesticUrl, apiKey: domesticKey, id: "qwen3-235b-a22b", name: "Qwen3 235B" },
  ];

  try {
    const results = await Promise.allSettled(
      models.map(async (m) => {
        const text = await callModel(m.baseUrl, m.apiKey, m.id, systemPrompt, userPrompt);
        return { modelId: m.id, modelName: m.name, text, wordCount: text.length };
      })
    );

    const versions = results
      .filter((r): r is PromiseFulfilledResult<{ modelId: string; modelName: string; text: string; wordCount: number }> => r.status === "fulfilled")
      .map((r) => r.value);

    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json({ error: "Generation failed: " + String(error) }, { status: 500 });
  }
}
