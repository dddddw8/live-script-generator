export const maxDuration = 60;

export async function POST(req: Request) {
  const { productInfo } = await req.json();

  const response = await fetch(
    `${process.env.DOMESTIC_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DOMESTIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v3",
        stream: true,
        messages: [
          {
            role: "system",
            content: `你是一位资深直播带货运营专家，同时具备丰富的市场调研能力。用户会给你一段产品信息描述，你需要：

1. 背景分析：分析这个产品所在行业的市场情况、竞品格局、目标用户特征
2. 卖点提炼：提炼 5-8 个核心卖点，每个卖点用一句话概括
3. 卖点分类：将卖点分为四类——功能卖点、情感卖点、价格卖点、信任卖点
4. 参数推荐：根据产品类型和客单价，推荐话术字数和闭环时间

请直接输出JSON，不要输出思考过程，不要包含markdown代码块标记。格式：
{
  "product_name": "产品名称",
  "market_analysis": "简要市场分析",
  "target_audience": "目标用户画像",
  "selling_points": [
    {"text": "卖点描述", "category": "功能卖点"},
    {"text": "卖点描述", "category": "情感卖点"},
    {"text": "卖点描述", "category": "价格卖点"},
    {"text": "卖点描述", "category": "信任卖点"}
  ],
  "recommended_word_count": 1500,
  "recommended_loop_minutes": 8,
  "recommendation_reason": "推荐理由"
}`,
          },
          { role: "user", content: productInfo },
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
            // skip unparseable chunks
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
