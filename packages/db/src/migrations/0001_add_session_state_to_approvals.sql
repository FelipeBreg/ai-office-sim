-- Phase 0.2: Add session_state column for agent pause/resume on approval
-- Also make action_log_id nullable (approval can be created before action log)
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS session_state jsonb;
ALTER TABLE approvals ALTER COLUMN action_log_id DROP NOT NULL;
