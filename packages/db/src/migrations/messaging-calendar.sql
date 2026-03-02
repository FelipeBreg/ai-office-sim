-- Messaging + Calendar Migration (Phases 2-3)
-- Creates: 11 enums, 4 tables, 9 indexes
-- Run against Neon with: DATABASE_URL=<url> node -e "..."

-- ============================================================================
-- CONVERSATION ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE conversation_channel AS ENUM ('whatsapp', 'email', 'webchat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_status AS ENUM ('open', 'snoozed', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_message_direction AS ENUM ('inbound', 'outbound', 'internal_note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_sender_type AS ENUM ('agent', 'user', 'contact', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_content_type AS ENUM ('text', 'html', 'image', 'file', 'template');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- CALENDAR ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE calendar_event_type AS ENUM ('deadline', 'agent_run', 'meeting', 'reminder', 'renewal', 'obligation', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_event_status AS ENUM ('scheduled', 'completed', 'cancelled', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_event_source_type AS ENUM ('manual', 'agent', 'workflow', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_event_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_reminder_channel AS ENUM ('in_app', 'email', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel conversation_channel NOT NULL,
  contact_identifier TEXT NOT NULL,
  contact_name TEXT,
  status conversation_status NOT NULL DEFAULT 'open',
  priority conversation_priority NOT NULL DEFAULT 'medium',
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  handler_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  snoozed_until TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conv_project_status_idx ON conversations(project_id, status);
CREATE INDEX IF NOT EXISTS conv_project_channel_idx ON conversations(project_id, channel);
CREATE INDEX IF NOT EXISTS conv_project_contact_idx ON conversations(project_id, contact_identifier);

-- ============================================================================
-- CONVERSATION MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction conversation_message_direction NOT NULL,
  sender_type conversation_sender_type NOT NULL,
  sender_id UUID,
  content TEXT NOT NULL,
  content_type conversation_content_type NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conv_msg_conversation_idx ON conversation_messages(conversation_id, created_at);

-- ============================================================================
-- CALENDAR EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type calendar_event_type NOT NULL,
  source_type calendar_event_source_type NOT NULL DEFAULT 'manual',
  source_id UUID,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence JSONB,
  status calendar_event_status NOT NULL DEFAULT 'scheduled',
  priority calendar_event_priority NOT NULL DEFAULT 'medium',
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cal_event_project_start_idx ON calendar_events(project_id, start_at);
CREATE INDEX IF NOT EXISTS cal_event_project_status_idx ON calendar_events(project_id, status);
CREATE INDEX IF NOT EXISTS cal_event_project_type_idx ON calendar_events(project_id, event_type);

-- ============================================================================
-- CALENDAR REMINDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel calendar_reminder_channel NOT NULL DEFAULT 'in_app',
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS cal_reminder_event_idx ON calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS cal_reminder_pending_idx ON calendar_reminders(remind_at, sent);
