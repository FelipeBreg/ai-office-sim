-- Phase 4.2: Audit Log table (append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource text NOT NULL,
  action text NOT NULL,
  resource_id text,
  path text NOT NULL,
  input jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_org_created_idx ON audit_logs(org_id, created_at);
CREATE INDEX IF NOT EXISTS audit_log_project_created_idx ON audit_logs(project_id, created_at);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx ON audit_logs(resource, action);
