const DOMESTIC_URL = "https://ai-platform-test.zhenguanyu.com/litellm/v1";
const OVERSEA_URL = "https://ai-platform-test.zhenguanyu.com/litellm-oversea/v1";
const API_KEY = "sk-ZDolX3RGKGtyyWiaP0zXOQ";

export async function streamChat(
  options: {
    model: string;
    node: "domestic" | "oversea";
    system?: string;
    prompt: string;
    onChunk: (text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: string) => void;
  }
) {
  const baseUrl = options.node === "domestic" ? DOMESTIC_URL : OVERSEA_URL;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model,
        stream: true,
        messages: [
          ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
          { role: "user" as const, content: options.prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      options.onError(`API error ${response.status}: ${errText.slice(0, 200)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      options.onError("No response body");
      return;
    }

    const decoder = new TextDecoder();
    let fullText = "";

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
            fullText += content;
            options.onChunk(fullText);
          }
        } catch {
          // skip
        }
      }
    }

    options.onDone(fullText);
  } catch (error) {
    options.onError(String(error));
  }
}

export async function chatCompletion(
  options: {
    model: string;
    node: "domestic" | "oversea";
    system?: string;
    prompt: string;
  }
): Promise<string> {
  const baseUrl = options.node === "domestic" ? DOMESTIC_URL : OVERSEA_URL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user" as const, content: options.prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function visionChat(
  options: {
    imageBase64: string;
    mimeType: string;
    prompt: string;
  }
): Promise<string> {
  const dataUrl = `data:${options.mimeType};base64,${options.imageBase64}`;

  const response = await fetch(`${DOMESTIC_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "qwen3-vl-plus",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: options.prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
