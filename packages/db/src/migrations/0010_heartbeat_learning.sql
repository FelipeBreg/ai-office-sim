-- V5 Phase 4: Heartbeat Learning Upgrade
-- Add structured lessons field to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS lessons jsonb;
