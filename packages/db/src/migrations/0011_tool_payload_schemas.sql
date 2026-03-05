-- V5 Phase 6: Inter-Agent Payload Validation
CREATE TABLE IF NOT EXISTS tool_payload_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input_schema JSONB,
  output_schema JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tool_payload_schema_unique_idx
  ON tool_payload_schemas (project_id, tool_name, version);

CREATE INDEX IF NOT EXISTS tool_payload_schema_project_idx
  ON tool_payload_schemas (project_id);

CREATE INDEX IF NOT EXISTS tool_payload_schema_tool_idx
  ON tool_payload_schemas (tool_name);
