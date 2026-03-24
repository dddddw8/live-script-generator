import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url === "your_supabase_url_here") return null;
  if (!_supabase) {
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export type ScriptRecord = {
  id: string;
  product_name: string;
  product_info: string;
  selling_points: string[];
  style: string;
  word_count: number;
  loop_minutes: number;
  generated_script: string;
  final_script: string;
  forbidden_check_result: ForbiddenCheckResult | null;
  created_at: string;
  updated_at: string;
};

export type ForbiddenWord = {
  id: string;
  word: string;
  replacement: string;
  category: string;
  created_at: string;
};

export type ForbiddenCheckResult = {
  total_found: number;
  total_replaced: number;
  replacements: {
    original: string;
    replacement: string;
    category: string;
    positions: number[];
  }[];
};
