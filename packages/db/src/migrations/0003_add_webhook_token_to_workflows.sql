-- Add webhook_token column for workflow webhook triggers
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS webhook_token text;
CREATE UNIQUE INDEX IF NOT EXISTS workflow_webhook_token_idx ON workflows(webhook_token) WHERE webhook_token IS NOT NULL;
