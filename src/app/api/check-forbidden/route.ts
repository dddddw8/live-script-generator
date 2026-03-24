import { NextResponse } from "next/server";
import { FORBIDDEN_WORDS_DATA } from "@/lib/forbidden-words-data";
import type { ForbiddenCheckResult } from "@/lib/supabase";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const replacements: ForbiddenCheckResult["replacements"] = [];

  const sortedWords = [...FORBIDDEN_WORDS_DATA].sort((a, b) => b.word.length - a.word.length);

  for (const entry of sortedWords) {
    const positions: number[] = [];
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(entry.word, searchFrom);
      if (idx === -1) break;
      positions.push(idx);
      searchFrom = idx + entry.word.length;
    }

    if (positions.length > 0) {
      replacements.push({
        original: entry.word,
        replacement: entry.replacement,
        category: entry.category,
        positions,
      });
    }
  }

  const result: ForbiddenCheckResult = {
    total_found: replacements.reduce((sum, r) => sum + r.positions.length, 0),
    total_replaced: replacements.reduce((sum, r) => sum + r.positions.length, 0),
    replacements,
  };

  return NextResponse.json(result);
}
