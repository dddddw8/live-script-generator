-- 话术记录表
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL DEFAULT '未命名产品',
  product_info TEXT NOT NULL,
  selling_points JSONB NOT NULL DEFAULT '[]',
  style TEXT NOT NULL DEFAULT 'knowledge',
  word_count INTEGER NOT NULL DEFAULT 1500,
  loop_minutes INTEGER NOT NULL DEFAULT 8,
  generated_script TEXT NOT NULL,
  final_script TEXT NOT NULL,
  forbidden_check_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 违禁词库表（可选，当前使用本地数据）
CREATE TABLE IF NOT EXISTS forbidden_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  replacement TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为 scripts 表创建索引
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scripts_product_name ON scripts(product_name);

-- RLS 策略（允许匿名读写，适合演示）
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on scripts" ON scripts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE forbidden_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on forbidden_words" ON forbidden_words FOR ALL USING (true) WITH CHECK (true);
