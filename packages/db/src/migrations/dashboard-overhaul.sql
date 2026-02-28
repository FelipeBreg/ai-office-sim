-- Dashboard Overhaul Migration (commit #66)
-- Run against Neon with: DATABASE_URL=<url> node -e "..."

-- 1A. pipeline_stages — custom kanban columns
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00C8E0',
  sort_order INT NOT NULL DEFAULT 0,
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pipeline_stage_project_id_idx ON pipeline_stages(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS pipeline_stage_project_slug_idx ON pipeline_stages(project_id, slug);

-- 1B. deals — add stage_id FK
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS deal_stage_id_idx ON deals(stage_id);

-- 1C. marketing_campaigns
DO $$ BEGIN
  CREATE TYPE campaign_platform AS ENUM ('meta_ads','youtube_ads','email','linkedin','instagram','google_ads','tiktok','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('active','paused','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE funnel_stage AS ENUM ('top','middle','bottom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform campaign_platform NOT NULL DEFAULT 'other',
  status campaign_status NOT NULL DEFAULT 'active',
  spend NUMERIC(12,2) DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  funnel_stage funnel_stage NOT NULL DEFAULT 'top',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS campaign_project_id_idx ON marketing_campaigns(project_id);
CREATE INDEX IF NOT EXISTS campaign_status_idx ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS campaign_funnel_idx ON marketing_campaigns(funnel_stage);

-- 1D. brand_touchpoints
DO $$ BEGIN
  CREATE TYPE touchpoint_type AS ENUM ('linkedin','instagram','twitter','facebook','domain','physical','youtube','tiktok','email','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE touchpoint_status AS ENUM ('active','inactive','planned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS brand_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type touchpoint_type NOT NULL DEFAULT 'other',
  label TEXT NOT NULL,
  url TEXT,
  description TEXT,
  status touchpoint_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS touchpoint_project_id_idx ON brand_touchpoints(project_id);
CREATE INDEX IF NOT EXISTS touchpoint_type_idx ON brand_touchpoints(type);

-- 1E. financial_records
DO $$ BEGIN
  CREATE TYPE financial_record_type AS ENUM ('revenue','expense','tax','investment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_category AS ENUM ('mrr','arr','cogs','salary','tax_obligation','marketing_spend','infrastructure','software','consulting','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type financial_record_type NOT NULL,
  category financial_category NOT NULL DEFAULT 'other',
  label TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS financial_record_project_id_idx ON financial_records(project_id);
CREATE INDEX IF NOT EXISTS financial_record_type_idx ON financial_records(type);
CREATE INDEX IF NOT EXISTS financial_record_category_idx ON financial_records(category);

-- 1F. Wiki schema additions
ALTER TABLE wiki_categories ADD COLUMN IF NOT EXISTS is_blueprint BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS template_key TEXT;
