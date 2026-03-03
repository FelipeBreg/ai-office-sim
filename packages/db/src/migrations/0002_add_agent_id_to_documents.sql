-- Phase 1.2: Add agentId column to documents for per-agent knowledge base scoping
ALTER TABLE documents ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS document_agent_id_idx ON documents(agent_id);
