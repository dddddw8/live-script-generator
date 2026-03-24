import { getSupabase, type ScriptRecord, type ForbiddenCheckResult } from "./supabase";
import { v4 as uuidv4 } from "uuid";

function isLocal(): boolean {
  return !getSupabase();
}

function getLocalScripts(): ScriptRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("scripts");
  return raw ? JSON.parse(raw) : [];
}

function setLocalScripts(scripts: ScriptRecord[]) {
  localStorage.setItem("scripts", JSON.stringify(scripts));
}

export async function saveScript(data: {
  product_name: string;
  product_info: string;
  selling_points: string[];
  style: string;
  word_count: number;
  loop_minutes: number;
  generated_script: string;
  final_script: string;
  forbidden_check_result: ForbiddenCheckResult | null;
}): Promise<ScriptRecord> {
  const now = new Date().toISOString();
  const record: ScriptRecord = {
    id: uuidv4(),
    ...data,
    created_at: now,
    updated_at: now,
  };

  if (isLocal()) {
    const scripts = getLocalScripts();
    scripts.unshift(record);
    setLocalScripts(scripts);
    return record;
  }

  const supabase = getSupabase()!;
  const { error } = await supabase.from("scripts").insert(record);
  if (error) {
    console.error("Supabase insert error, falling back to local:", error);
    const scripts = getLocalScripts();
    scripts.unshift(record);
    setLocalScripts(scripts);
  }
  return record;
}

export async function updateScript(id: string, updates: Partial<ScriptRecord>): Promise<void> {
  const now = new Date().toISOString();

  if (isLocal()) {
    const scripts = getLocalScripts();
    const idx = scripts.findIndex((s) => s.id === id);
    if (idx !== -1) {
      scripts[idx] = { ...scripts[idx], ...updates, updated_at: now };
      setLocalScripts(scripts);
    }
    return;
  }

  const supabase = getSupabase()!;
  const { error } = await supabase.from("scripts").update({ ...updates, updated_at: now }).eq("id", id);
  if (error) {
    console.error("Supabase update error, falling back to local:", error);
    const scripts = getLocalScripts();
    const idx = scripts.findIndex((s) => s.id === id);
    if (idx !== -1) {
      scripts[idx] = { ...scripts[idx], ...updates, updated_at: now };
      setLocalScripts(scripts);
    }
  }
}

export async function getScripts(): Promise<ScriptRecord[]> {
  if (isLocal()) {
    return getLocalScripts();
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch error, falling back to local:", error);
    return getLocalScripts();
  }
  return data || [];
}

export async function getScriptById(id: string): Promise<ScriptRecord | null> {
  if (isLocal()) {
    const scripts = getLocalScripts();
    return scripts.find((s) => s.id === id) || null;
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase.from("scripts").select("*").eq("id", id).single();
  if (error) {
    console.error("Supabase fetch error, falling back to local:", error);
    const scripts = getLocalScripts();
    return scripts.find((s) => s.id === id) || null;
  }
  return data;
}

export async function deleteScript(id: string): Promise<void> {
  if (isLocal()) {
    const scripts = getLocalScripts().filter((s) => s.id !== id);
    setLocalScripts(scripts);
    return;
  }

  const supabase = getSupabase()!;
  const { error } = await supabase.from("scripts").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete error, falling back to local:", error);
    const scripts = getLocalScripts().filter((s) => s.id !== id);
    setLocalScripts(scripts);
  }
}
