import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SCRIPT_STRUCTURE, STYLE_OPTIONS } from "@/lib/script-templates";

export const maxDuration = 60;

const oversea = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {
  const { productInfo, sellingPoints, style, wordCount, loopMinutes } = await req.json();

  const styleOption = STYLE_OPTIONS.find((o) => o.id === style);

  const sectionsGuide = SCRIPT_STRUCTURE.sections
    .map((s) => `### ${s.name}\n要求：${s.prompt_hint}\n运用技巧：${s.techniques.join("、")}`)
    .join("\n\n");

  const systemPrompt = `你是一位资深直播带货话术专家，拥有丰富的抖音直播运营经验。你精通以下方法论：

## 核心方法论

### AIDA 模型（世界公认推销成功率最高的表达框架）
- Attention（引起注意）：开头第一句话引起用户注意
- Interest（提起兴趣）：让用户对你说的感兴趣
- Desire（激起欲望）：让用户产生购买的渴望
- Action（促成行动）：引导转化，下单购买

### FABE 卖点原则
- Feature（特征）：产品是什么，有什么特点
- Advantage（优势）：与竞品相比有什么优势
- Benefit（利益）：能给用户带来什么好处
- Evidence（证据）：有什么证据支撑（数据、认证、口碑等）

### 话术品牌化三要素
- 品牌加持化：品牌实力背书 + 产品细节展示
- 痛点场景化：场景描述痛点 + 场景放大后果
- 卖点利他化：解决什么问题 + 带来什么好处

### 促单四大心理
- 从众心理：展示其他人都在买
- 损失恐惧：强调错过的损失
- 稀缺效应：限量、限时制造紧迫感
- 互惠效应：额外赠品让用户觉得占便宜

### 十大话术类型（按需灵活运用）
1. 场景话术：塑造具体使用场景，让用户产生代入感
2. 优势话术：对标竞品做对比，突出差异化
3. 共情话术：情感鸡汤牌，打动用户内心
4. 性价比话术：折算折扣价/单品价/功能价
5. 比价话术：竞品vs自己、线上vs线下、日常vs活动
6. 价值话术：产品细节+赠品价值+品牌背书+价值升华
7. 停留话术：福袋礼品、加赠好礼、活动包装
8. 评论话术：点对点评论、提问式互动、选择式互动
9. 抽奖话术：礼品价值呈现，中奖条件引导
10. 促销成单话术：痛点放大+品牌保障+卖点重复

## 话术结构要求
必须严格按照以下结构生成话术，每个部分用 ### 标题分隔：

${sectionsGuide}

## 风格要求
${styleOption?.name || "知识科普型"}：${styleOption?.prompt_extra || ""}

## 字数要求
总字数约 ${wordCount} 字（对应约 ${loopMinutes} 分钟的话术闭环）

## 重要规则
1. 话术必须口语化，像真人在直播间说话一样自然流畅
2. 多用反问句、感叹句增强感染力
3. 适当加入互动引导（如"扣1"、"点关注"、"想看的打在评论区"等）
4. 卖点介绍要运用 FABE 原则，有数据、有对比、有场景、有证据
5. 促单环节要运用四大心理，但不能虚假营销
6. 不要使用违禁词（如"最好"、"第一"、"100%有效"等绝对化用语）
7. 每个部分之间要有自然的过渡，不能生硬跳转
8. 语速语调提示：催下单时节奏快，讲品时节奏慢；形容词语气强，名词语气弱
9. 让用户从 认识品牌→认知品牌→认同→认购`;

  const userPrompt = `请为以下产品生成直播话术：

## 产品信息
${productInfo}

## 核心卖点
${sellingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

请按照话术结构要求，运用 AIDA 模型和 FABE 原则，生成约 ${wordCount} 字的完整直播话术。每个部分用 ### 标题分隔。`;

  const result = streamText({
    model: oversea("sonnet-4.6"),
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result.toTextStreamResponse();
}
