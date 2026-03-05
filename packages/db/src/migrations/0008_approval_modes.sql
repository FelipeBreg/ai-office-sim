-- V5 Phase 2: Approval Mode System

-- New enums
DO $$ BEGIN
  CREATE TYPE approval_mode AS ENUM ('manual', 'supervised', 'autonomous');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_override AS ENUM ('inherit', 'always_require', 'always_allow');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add approval mode to orchestrator config
ALTER TABLE orchestrator_config ADD COLUMN IF NOT EXISTS approval_mode approval_mode NOT NULL DEFAULT 'manual';
ALTER TABLE orchestrator_config ADD COLUMN IF NOT EXISTS trust_threshold integer NOT NULL DEFAULT 10;

-- Add approval override to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS approval_override approval_override NOT NULL DEFAULT 'inherit';

-- Agent trust scores table
CREATE TABLE IF NOT EXISTS agent_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  last_failure_at timestamptz,
  auto_approved boolean NOT NULL DEFAULT false,
  threshold integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trust_agent_tool_idx ON agent_trust_scores(agent_id, tool_name);
CREATE INDEX IF NOT EXISTS trust_project_id_idx ON agent_trust_scores(project_id);
CREATE INDEX IF NOT EXISTS trust_agent_id_idx ON agent_trust_scores(agent_id);
