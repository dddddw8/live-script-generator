import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const domestic = createOpenAI({
  apiKey: process.env.DOMESTIC_API_KEY,
  baseURL: process.env.DOMESTIC_BASE_URL,
});

export async function POST(req: Request) {
  const { imageBase64, fileName } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: domestic("qwen3-vl-plus"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `你是一位资深直播带货运营专家。请仔细分析这张产品图片，提取以下信息：

1. 产品名称/类型
2. 产品外观描述（颜色、材质、尺寸感受等）
3. 可见的功能特征和卖点
4. 包装内容（如果能看到的话）
5. 适合的目标人群
6. 可能的使用场景

请用简洁的中文描述，格式如下：
产品识别：xxx
外观特征：xxx
功能卖点：xxx
包装内容：xxx
目标人群：xxx
使用场景：xxx`,
            },
            {
              type: "image",
              image: imageBase64,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ analysis: result.text });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: "图片分析失败，请手动输入产品信息" },
      { status: 500 }
    );
  }
}
