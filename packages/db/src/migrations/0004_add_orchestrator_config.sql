-- Phase 3.1: Orchestrator Config table
CREATE TABLE IF NOT EXISTS orchestrator_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  max_concurrency integer NOT NULL DEFAULT 5,
  daily_token_budget integer NOT NULL DEFAULT 0,
  monthly_token_budget integer NOT NULL DEFAULT 0,
  daily_spend_limit_usd numeric(10,2) NOT NULL DEFAULT 0,
  monthly_spend_limit_usd numeric(10,2) NOT NULL DEFAULT 0,
  priority_rules jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS orchestrator_config_project_id_idx ON orchestrator_config(project_id);
