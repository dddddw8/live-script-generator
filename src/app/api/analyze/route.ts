import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 60;

const domestic = createOpenAI({
  apiKey: process.env.DOMESTIC_API_KEY,
  baseURL: process.env.DOMESTIC_BASE_URL,
});

export async function POST(req: Request) {
  const { productInfo } = await req.json();

  const result = streamText({
    model: domestic("deepseek-v3"),
    system: `你是一位资深直播带货运营专家，同时具备丰富的市场调研能力。用户会给你一段产品信息描述，你需要：

1. **背景分析**：基于你的知识，分析这个产品所在行业的市场情况、竞品格局、目标用户特征
2. **卖点提炼**：提炼 5-8 个核心卖点，每个卖点用一句话概括，要具体、有力
3. **卖点分类**：将卖点分为四类——功能卖点、情感卖点、价格卖点、信任卖点
4. **参数推荐**：根据产品类型和客单价，推荐话术字数和闭环时间

分析时请考虑：
- 该产品在抖音直播间的展示优势和劣势
- 目标用户（如宝妈群体）的核心痛点和决策因素
- 同类竞品的常见定价和卖点
- 抖音直播带货的最佳实践

请用以下 JSON 格式返回（不要包含 markdown 代码块标记）：
{
  "product_name": "产品名称",
  "market_analysis": "简要市场分析（2-3句话）",
  "target_audience": "目标用户画像（1-2句话）",
  "selling_points": [
    {"text": "卖点描述", "category": "功能卖点"},
    {"text": "卖点描述", "category": "情感卖点"},
    {"text": "卖点描述", "category": "价格卖点"},
    {"text": "卖点描述", "category": "信任卖点"}
  ],
  "recommended_word_count": 1500,
  "recommended_loop_minutes": 8,
  "recommendation_reason": "推荐理由（包含市场分析结论）"
}`,
    prompt: productInfo,
  });

  return result.toTextStreamResponse();
}
