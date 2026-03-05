-- V5 Phase 1: Agent Hierarchy & Chain of Command
-- Creates teams, agent_team_memberships tables and adds hierarchy fields to agents

-- New enums
DO $$ BEGIN
  CREATE TYPE team_member_role AS ENUM ('lead', 'member', 'observer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE team_priority AS ENUM ('critical', 'high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_team_id uuid,
  lead_agent_id uuid,
  priority team_priority NOT NULL DEFAULT 'normal',
  max_concurrency integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_project_slug_idx ON teams(project_id, slug);
CREATE INDEX IF NOT EXISTS team_project_id_idx ON teams(project_id);

-- Agent team memberships table
CREATE TABLE IF NOT EXISTS agent_team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role team_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_agent_team_idx ON agent_team_memberships(agent_id, team_id);
CREATE INDEX IF NOT EXISTS membership_agent_id_idx ON agent_team_memberships(agent_id);
CREATE INDEX IF NOT EXISTS membership_team_id_idx ON agent_team_memberships(team_id);

-- Add hierarchy fields to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reports_to_agent_id uuid;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS hierarchy_level integer NOT NULL DEFAULT 2;

-- Set CEO agents to hierarchy level 0
UPDATE agents SET hierarchy_level = 0 WHERE is_system_agent = true AND archetype = 'ceo_strategist';
