-- V5 Phase 3: Performance Metrics & Data Analysis Layer

-- KPI source enum
DO $$ BEGIN
  CREATE TYPE kpi_source AS ENUM ('agent', 'manual', 'sync', 'system');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Agent performance snapshots (daily rollup)
CREATE TABLE IF NOT EXISTS agent_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  sessions_run integer NOT NULL DEFAULT 0,
  actions_executed integer NOT NULL DEFAULT 0,
  actions_succeeded integer NOT NULL DEFAULT 0,
  actions_failed integer NOT NULL DEFAULT 0,
  tokens_used integer NOT NULL DEFAULT 0,
  cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  avg_session_duration_ms integer NOT NULL DEFAULT 0,
  tool_breakdown jsonb,
  outcome_signals jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS perf_agent_date_idx ON agent_performance_snapshots(agent_id, snapshot_date);
CREATE INDEX IF NOT EXISTS perf_project_id_idx ON agent_performance_snapshots(project_id);
CREATE INDEX IF NOT EXISTS perf_agent_id_idx ON agent_performance_snapshots(agent_id);

-- KPI history (time-series)
CREATE TABLE IF NOT EXISTS kpi_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kpi_id uuid NOT NULL,
  value numeric(20,6) NOT NULL,
  source kpi_source NOT NULL DEFAULT 'system',
  source_id text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kpi_history_kpi_id_idx ON kpi_history(kpi_id, recorded_at);
CREATE INDEX IF NOT EXISTS kpi_history_project_id_idx ON kpi_history(project_id);
