import { SCRIPT_STRUCTURE, STYLE_OPTIONS } from "@/lib/script-templates";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { productInfo, sellingPoints, style, wordCount, loopMinutes } = await req.json();

  const styleOption = STYLE_OPTIONS.find((o) => o.id === style);

  const sectionsGuide = SCRIPT_STRUCTURE.sections
    .map((s) => `### ${s.name}\n要求：${s.prompt_hint}\n运用技巧：${s.techniques.join("、")}`)
    .join("\n\n");

  const systemPrompt = `你是一位资深直播带货话术专家，拥有丰富的抖音直播运营经验。你精通以下方法论：

## 核心方法论

### AIDA 模型
- Attention：开头第一句话引起用户注意
- Interest：让用户对你说的感兴趣
- Desire：让用户产生购买的渴望
- Action：引导转化，下单购买

### FABE 卖点原则
- Feature：产品是什么，有什么特点
- Advantage：与竞品相比有什么优势
- Benefit：能给用户带来什么好处
- Evidence：有什么证据支撑

### 话术品牌化三要素
- 品牌加持化：品牌实力背书 + 产品细节展示
- 痛点场景化：场景描述痛点 + 场景放大后果
- 卖点利他化：解决什么问题 + 带来什么好处

### 促单四大心理
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

请按照话术结构要求，生成约 ${wordCount} 字的完整直播话术。每个部分用 ### 标题分隔。`;

  const response = await fetch(
    `${process.env.OPENAI_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonnet-4.6",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    return new Response(JSON.stringify({ error: errText }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return new Response("No response body", { status: 500 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.trim().startsWith("data:"));

        for (const line of lines) {
          const data = line.replace("data:", "").trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          } catch {
            // skip
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
