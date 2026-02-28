-- Workflow Engine: extend workflow_runs and workflow_node_runs

ALTER TYPE workflow_run_status ADD VALUE IF NOT EXISTS 'waiting_approval';

ALTER TABLE workflow_runs ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '{}'::jsonb;
ALTER TABLE workflow_runs ADD COLUMN IF NOT EXISTS paused_at_node_id text;
ALTER TABLE workflow_runs ADD COLUMN IF NOT EXISTS completed_outputs jsonb DEFAULT '{}'::jsonb;

ALTER TABLE workflow_node_runs ADD COLUMN IF NOT EXISTS node_type text;
