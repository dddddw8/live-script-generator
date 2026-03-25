import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { imageBase64, fileName, mimeType } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

  try {
    const response = await fetch(
      `${process.env.DOMESTIC_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DOMESTIC_API_KEY}`,
        },
        body: JSON.stringify({
          model: "qwen3-vl-plus",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `你是一位资深直播带货运营专家。请仔细分析这张产品图片，提取以下信息。请直接输出分析结果，不要输出思考过程。

请用简洁的中文描述，格式如下：
产品识别：xxx
外观特征：xxx
功能卖点：xxx
包装内容：xxx（如果能看到的话）
目标人群：xxx
使用场景：xxx`,
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Vision API error:", response.status, errText);

      const fallbackRes = await fetch(
        `${process.env.DOMESTIC_BASE_URL}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DOMESTIC_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-v3",
            messages: [
              {
                role: "user",
                content: `用户上传了一张名为「${fileName}」的产品图片，但图片识别服务暂时不可用。请根据文件名推测这可能是什么产品，并给出一个通用的产品信息模板，提示用户手动补充以下信息：产品名称、外观特征、功能卖点、目标人群、使用场景。用简洁的中文回复。`,
              },
            ],
            max_tokens: 500,
          }),
        }
      );

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackText =
          fallbackData.choices?.[0]?.message?.content || "请手动补充产品信息";
        return NextResponse.json({ analysis: fallbackText });
      }

      return NextResponse.json(
        { error: "图片分析失败，请手动输入产品信息" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysisText =
      data.choices?.[0]?.message?.content || "未能识别图片内容";

    return NextResponse.json({ analysis: analysisText });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: "图片分析失败，请手动输入产品信息" },
      { status: 500 }
    );
  }
}
