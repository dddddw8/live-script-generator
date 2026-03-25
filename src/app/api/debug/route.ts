import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const results: Record<string, unknown> = {};

  results.env = {
    hasDomesticKey: !!process.env.DOMESTIC_API_KEY,
    hasDomesticUrl: !!process.env.DOMESTIC_BASE_URL,
    hasOpenaiKey: !!process.env.OPENAI_API_KEY,
    hasOpenaiUrl: !!process.env.OPENAI_BASE_URL,
    domesticUrl: process.env.DOMESTIC_BASE_URL || "NOT SET",
    openaiUrl: process.env.OPENAI_BASE_URL || "NOT SET",
    domesticKeyPrefix: process.env.DOMESTIC_API_KEY?.slice(0, 10) || "NOT SET",
    openaiKeyPrefix: process.env.OPENAI_API_KEY?.slice(0, 10) || "NOT SET",
  };

  try {
    const url = `${process.env.DOMESTIC_BASE_URL}/chat/completions`;
    results.requestUrl = url;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DOMESTIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v3",
        messages: [{ role: "user", content: "说OK" }],
        max_tokens: 5,
      }),
    });

    results.apiStatus = response.status;
    results.apiHeaders = Object.fromEntries(response.headers.entries());

    const body = await response.text();
    results.apiBody = body.slice(0, 500);
  } catch (error) {
    results.apiError = String(error);
    results.apiErrorStack = (error as Error).stack?.slice(0, 500);
  }

  return NextResponse.json(results, { status: 200 });
}
