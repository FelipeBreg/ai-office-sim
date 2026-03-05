# AI Office Sim — V5 Roadmap: Autonomy & Intelligence Layer

> 7 phases, strict dependency order. Each phase ships independently without
> breaking what's running. Builds on top of the existing P0 gaps from the spec
> (token budgets, heartbeat, KPI triggers, CEO agent) which remain the
> foundation — this roadmap adds the intelligence and usability layers that
> make the vision actually viable.

---

## Phase 1: Agent Hierarchy & Chain of Command

**Why first:** Every other phase references "who reports to whom." Onboarding
creates agents inside this hierarchy. Approvals flow through it. Cascades
respect it. The CEO Agent delegates through it. This is the skeleton.

### Data Model Changes

**New table: `teams`** (replaces the current flat enum)
```
teams
  id              uuid PK
  projectId       uuid FK -> projects
  name            text NOT NULL
  slug            text NOT NULL
  description     text
  parentTeamId    uuid FK -> teams (nullable, for nested teams)
  leadAgentId     uuid FK -> agents (nullable, the team's manager agent)
  priority        enum: critical | high | normal | low (default: normal)
  maxConcurrency  integer (default: 3)
  createdAt       timestamp
  updatedAt       timestamp
  UNIQUE(projectId, slug)
```

**New table: `agent_team_memberships`**
```
agent_team_memberships
  id        uuid PK
  agentId   uuid FK -> agents
  teamId    uuid FK -> teams
  role      enum: lead | member | observer
  joinedAt  timestamp
  UNIQUE(agentId, teamId)
```

**Modify `agents` table:**
- Keep `team` enum for backward compat (deprecated, migrate to memberships)
- Add `reportsToAgentId uuid FK -> agents` (direct supervisor, nullable)
- Add `hierarchyLevel integer` (0 = CEO, 1 = team lead, 2 = member)

### Chain of Command Logic

```
CEO Agent (level 0, isSystemAgent: true)
  |
  +-- Sales Team Lead (level 1, role: lead in sales team)
  |     +-- Sales Agent A (level 2, reportsTo: Sales Lead)
  |     +-- Sales Agent B (level 2, reportsTo: Sales Lead)
  |
  +-- Marketing Team Lead (level 1, role: lead in marketing team)
  |     +-- Content Writer (level 2)
  |     +-- Ad Analyst (level 2)
  |
  +-- Support Team Lead (level 1)
        +-- Support Agent A (level 2)
```

### Cascade Routing Rules
- Agent can only `trigger_agent` within its team OR one level up/down
- CEO Agent can trigger anyone (level 0 privilege)
- Team leads can trigger any member of their team
- Cross-team triggers require routing through a common ancestor (or CEO)
- Adds `cascadeRouteValid(sourceAgentId, targetAgentId)` check

### UI Changes
- New "Organization" page (or tab in Settings) with drag-and-drop org chart
- Agent detail page shows "Reports to" and "Direct reports" sections
- Team management: create teams, assign leads, move agents between teams
- Sidebar: teams shown as collapsible groups under Agents

### Files to touch
- `packages/db/src/schema/teams.ts` (NEW)
- `packages/db/src/schema/agent-team-memberships.ts` (NEW)
- `packages/db/src/schema/agents.ts` (add reportsToAgentId, hierarchyLevel)
- `packages/db/src/schema/enums.ts` (add team_role, keep team enum for compat)
- `packages/api/src/routers/teams.ts` (NEW — CRUD + membership management)
- `packages/api/src/routers/agents.ts` (update create/update to handle hierarchy)
- `apps/web/src/app/[locale]/(auth)/organization/page.tsx` (NEW — org chart)
- `apps/web/src/app/[locale]/(auth)/agents/[id]/page.tsx` (hierarchy display)
- `packages/ai/src/tools/fleet/` (update trigger_agent to validate routing)

---

## Phase 2: Approval Mode System

**Why second:** Agents need to run autonomously, but users need control. This
phase makes approvals flexible enough that the system doesn't drown users in
requests OR run unsafely. Uses hierarchy from Phase 1 (team leads can manage
their team's approval policies).

### Approval Modes (User-Configurable)

**Project-level mode** (new field on `orchestrator_config`):
```
approvalMode  enum: manual | supervised | autonomous
```

- **manual**: All tools marked `requiresApproval` pause for human review (current behavior)
- **supervised**: Trust escalation active — agents earn auto-approve after N successes
- **autonomous**: All actions auto-approved (user accepts full risk, shown warning)

**Per-agent override** (new field on `agents`):
```
approvalOverride  enum: inherit | always_require | always_allow (default: inherit)
```
- `inherit`: Follow project-level mode
- `always_require`: This agent always pauses for approval regardless of mode
- `always_allow`: This agent never pauses (user explicitly trusts it)

### Trust Escalation (supervised mode)

**New table: `agent_trust_scores`**
```
agent_trust_scores
  id              uuid PK
  projectId       uuid FK
  agentId         uuid FK -> agents
  toolName        text
  successCount    integer (default: 0)
  failureCount    integer (default: 0)
  lastFailureAt   timestamp
  autoApproved    boolean (default: false, flips to true at threshold)
  threshold       integer (default: 10, configurable per project)
  UNIQUE(agentId, toolName)
```

- After N consecutive successes with a tool, that tool becomes auto-approved
  for that agent
- Any failure resets the counter to 0 and revokes auto-approve
- Trust score visible on agent detail page (progress bar toward auto-approve)
- Team leads (from Phase 1) can manually grant/revoke trust for their team

### UI Changes
- Settings > Approval Mode: radio selector (manual/supervised/autonomous) with
  clear descriptions and risk warnings
- Agent detail > Configuration tab: approval override dropdown
- Agent detail > Overview tab: trust score badges per tool
- Approval queue: filter by "would have been auto-approved" in supervised mode

### Files to touch
- `packages/db/src/schema/agent-trust-scores.ts` (NEW)
- `packages/db/src/schema/orchestrator-config.ts` (add approvalMode)
- `packages/db/src/schema/agents.ts` (add approvalOverride)
- `packages/api/src/routers/approvals.ts` (check mode + trust before pausing)
- `packages/ai/src/harness/approval-check.ts` (NEW — centralized check logic)
- `apps/web/src/app/[locale]/(auth)/settings/` (approval mode UI)
- `apps/web/src/app/[locale]/(auth)/agents/[id]/page.tsx` (trust display)

---

## Phase 3: Performance Metrics & Data Analysis Layer

**Why third:** Before agents can "learn" (Phase 4), they need structured data
to learn FROM. Before the CEO Agent can make good decisions, it needs real
metrics, not just agent prose. This is the data foundation.

### What We're Building

A queryable metrics layer that:
1. Aggregates raw `action_logs` into structured per-agent performance stats
2. Stores time-series KPI snapshots (not just current value)
3. Exposes metrics to agents via a new tool

### Data Model

**New table: `agent_performance_snapshots`** (daily rollup)
```
agent_performance_snapshots
  id                  uuid PK
  projectId           uuid FK
  agentId             uuid FK -> agents
  snapshotDate        date
  sessionsRun         integer
  actionsExecuted     integer
  actionsSucceeded    integer
  actionsFailed       integer
  tokensUsed          integer
  costUsd             numeric(10,6)
  avgSessionDurationMs integer
  toolBreakdown       jsonb  -- { "send_email": { success: 10, fail: 1 }, ... }
  outcomeSignals      jsonb  -- { "emails_sent": 15, "replies_received": 2, ... }
  createdAt           timestamp
  UNIQUE(agentId, snapshotDate)
```

**New table: `kpi_history`** (time-series for KPI values)
```
kpi_history
  id          uuid PK
  projectId   uuid FK
  kpiId       uuid FK -> strategy_kpis
  value       numeric
  source      enum: agent | manual | sync | system
  sourceId    text (agentId or syncJobId that produced this value)
  recordedAt  timestamp
  INDEX(kpiId, recordedAt)
```

### New Agent Tool: `get_my_performance`
Returns the calling agent's own stats for the last N days:
- Success rate, sessions run, top tools used, failure reasons
- Injected automatically into context before heartbeat rewrite (Phase 4)

### New Agent Tool: `query_team_metrics` (team leads + CEO only)
Returns aggregated stats for a team:
- Per-agent performance, team success rate, cost, busiest agents
- CEO Agent uses this to make strategic decisions

### Rollup Worker
- New BullMQ job: `performance-rollup` (runs daily at midnight)
- Aggregates `action_logs` from the past day into `agent_performance_snapshots`
- Snapshots `strategy_kpis.currentValue` into `kpi_history`

### Files to touch
- `packages/db/src/schema/agent-performance.ts` (NEW)
- `packages/db/src/schema/kpi-history.ts` (NEW)
- `packages/ai/src/tools/analytics/get-my-performance.ts` (NEW)
- `packages/ai/src/tools/analytics/query-team-metrics.ts` (NEW)
- `apps/worker/src/workers/performance-rollup.ts` (NEW)
- `packages/api/src/routers/analytics.ts` (NEW — expose to frontend)

---

## Phase 4: Heartbeat Learning Upgrade

**Why fourth:** Now that structured metrics exist (Phase 3), we can inject them
into the agent's context before it rewrites its heartbeat. This turns the
heartbeat from "prose planning" into "data-informed planning."

### Changes to Heartbeat Rewrite Flow

**Before (current OpenClaw pattern):**
```
Agent runs -> writes heartbeatInstructions (prose) -> next run reads it
```

**After:**
```
Agent runs -> sees own performance stats + previous lessons -> writes
heartbeatInstructions (plan) + structured lessons (data) -> next run
gets both
```

### New Field on `agents`
```
lessons  jsonb  -- structured key-value learnings that persist across rewrites
                -- e.g. { "best_send_time": "10am", "low_reply_channels": ["email"] }
```

### New Tool: `update_my_lessons`
```typescript
{
  name: 'update_my_lessons',
  params: {
    set: Record<string, string>,    // upsert key-value pairs
    remove: string[],               // delete keys no longer relevant
  }
}
```
- Max 20 lesson pairs per agent (oldest auto-pruned)
- Logged to action_logs for audit trail

### Context Injection Changes
When building agent context for a heartbeat-triggered session:
1. Inject `agent_performance_snapshots` for last 7 days (from Phase 3)
2. Inject `lessons` field (structured learnings)
3. Inject `heartbeatInstructions` (the plan)

New context block (~300 tokens):
```
## Your Recent Performance (7d)
Sessions: 14 | Success rate: 87% | Tokens: 12,430
Top tools: send_email (10 ok, 2 fail), search_contacts (8 ok)

## Your Lessons
best_send_time: 10am-11am weekdays
low_reply_segment: cold leads older than 30 days
effective_subject_lines: questions outperform statements 3:1

## Your Current Plan
[heartbeatInstructions content here]
```

### Files to touch
- `packages/db/src/schema/agents.ts` (add `lessons` jsonb)
- `packages/ai/src/tools/self/update-my-lessons.ts` (NEW)
- `packages/ai/src/harness/context-builder.ts` (inject performance + lessons)
- `packages/ai/src/tools/self/update-my-heartbeat.ts` (keep as-is, works with new context)

---

## Phase 5: Cost Simulation

**Why fifth:** Independent feature, but placing it here because by now agents
have hierarchy, approval modes, and metrics — the simulation can use real
data patterns when available.

### How It Works

**Pre-activation estimate:**
Given an agent configuration (model, tools, heartbeat interval, trigger type),
estimate monthly cost:

```
estimatedTokensPerSession = baseTokens(model) + toolSchemaTokens(tools.length)
                          + contextOverhead + avgResponseTokens(archetype)

sessionsPerDay = triggers based on:
  - heartbeat: 1440 / heartbeatIntervalMin
  - scheduled: cron frequency
  - event/manual: historical average OR default estimate (3/day)

dailyCostUsd = estimatedTokensPerSession * sessionsPerDay * pricePerToken(model)
monthlyCostUsd = dailyCostUsd * 30
```

**LLM pricing table** (in `packages/shared/src/constants/`):
```typescript
const LLM_PRICING = {
  'claude-sonnet-4-20250514': { inputPer1M: 3.00, outputPer1M: 15.00 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.80, outputPer1M: 4.00 },
  'claude-opus-4-20250514':   { inputPer1M: 15.00, outputPer1M: 75.00 },
} as const;
```

**Fleet-level projection:**
Sum all agents' estimates + CEO Agent overhead. Show:
- Per-agent breakdown
- Total daily / monthly
- Comparison vs current plan limit
- Warning if projected > 80% of plan budget

### UI Components
- Agent wizard step: "Estimated cost" card shown after tool/trigger selection
- Agent detail > Configuration: live cost estimate updates as you change settings
- Settings > Billing: fleet cost projection dashboard
- Warning toast when enabling agent whose cost would exceed remaining budget

### Files to touch
- `packages/shared/src/constants/llm-pricing.ts` (NEW)
- `packages/ai/src/billing/cost-simulator.ts` (NEW — pure function, no DB)
- `packages/api/src/routers/billing.ts` (add `simulateAgentCost` endpoint)
- Agent wizard + detail page (display estimates)
- Settings billing page (fleet projection)

---

## Phase 6: Inter-Agent Payload Validation & Communication

**Why sixth:** With hierarchy established and agents running autonomously,
we need to ensure agent-to-agent communication doesn't cascade garbage data
through the org. This is the safety net for the fleet.

### Payload Schema Registry

**New table: `tool_payload_schemas`**
```
tool_payload_schemas
  id          uuid PK
  projectId   uuid FK
  toolName    text
  inputSchema jsonb  -- JSON Schema for expected input
  outputSchema jsonb -- JSON Schema for expected output
  version     integer
  UNIQUE(projectId, toolName, version)
```

### Validation Layer

When Agent A calls `trigger_agent` with a payload for Agent B:
1. Validate payload against target agent's expected input schema (if defined)
2. If validation fails:
   - Log structured error (not just "tool failed")
   - Return clear error to calling agent: "Payload rejected: field X expected
     string, got number"
   - Agent can self-correct in the same session (retry with fixed payload)
3. If no schema defined: pass through (backward compatible)

### Hierarchy-Aware Routing
- `trigger_agent` checks `cascadeRouteValid()` from Phase 1
- If invalid route: return error explaining the chain of command
- CEO Agent bypasses routing checks (global access)
- Team leads bypass within their team

### Communication Protocol
Standardize the payload shape for agent-to-agent messages:
```typescript
interface AgentMessage {
  from: string;         // source agentId
  to: string;           // target agentId
  type: 'task' | 'report' | 'escalation' | 'query';
  priority: 'low' | 'normal' | 'high' | 'critical';
  subject: string;      // short description
  body: string;         // detailed content
  context?: Record<string, unknown>; // structured data
  expectsReply: boolean;
  replyToMessageId?: string; // for threaded conversations
}
```

### Files to touch
- `packages/db/src/schema/tool-payload-schemas.ts` (NEW)
- `packages/ai/src/tools/fleet/trigger-agent.ts` (add validation + routing)
- `packages/ai/src/validation/payload-validator.ts` (NEW)
- `packages/api/src/routers/tool-schemas.ts` (NEW — CRUD for schemas)

---

## Phase 7: Smart Onboarding with Web Scraping

**Why last:** This is the capstone. It creates agents IN the hierarchy (Phase 1),
sets approval modes (Phase 2), seeds metrics baselines (Phase 3), configures
heartbeat plans (Phase 4), shows cost estimates (Phase 5), and sets up
communication schemas (Phase 6). Everything must exist first.

### Onboarding Flow (5 Steps)

**Step 1: Company Profile**
```
- Company name
- Sector / industry (dropdown + custom)
- Company size (1-10, 11-50, 51-200, 200+)
- Website URL
- Social media links (LinkedIn, Instagram, Facebook, X, TikTok)
- Primary language (pt-BR or en-US)
```

**Step 2: Web Scraping & Analysis** (async, shows loading animation)

Scrape provided URLs and extract:
- **Website**: company description, products/services, team page, pricing,
  contact info, tech stack (from meta tags), brand voice/tone
- **LinkedIn**: company size confirmation, industry, recent posts tone
- **Instagram**: content style, posting frequency, audience signals
- **Facebook**: page info, reviews if public

Use Claude Haiku to synthesize scraped data into:
```typescript
interface CompanyProfile {
  description: string;        // 2-3 sentence company summary
  products: string[];         // main products/services
  targetAudience: string;     // who they sell to
  brandVoice: string;         // formal, casual, technical, friendly
  channels: string[];         // active channels detected
  teamSize: string;           // from LinkedIn or user input
  techStack: string[];        // if detectable
  competitors: string[];      // if mentioned on site
  contentThemes: string[];    // from social media analysis
}
```

**Step 3: Strategy Setup**
Pre-filled from scraped data, user confirms/edits:
- Primary business goal (grow revenue, reduce churn, expand market, etc.)
- 3-5 KPIs with targets (pre-suggested based on sector + size)
- Timeline (3 months, 6 months, 1 year)

**Step 4: Fleet Recommendation**
Based on company profile + strategy, recommend:
- Which teams to create (sales, marketing, support, etc.)
- Which agents per team (with recommended archetypes)
- Team lead assignments
- Suggested approval mode
- Cost estimate for the full fleet (Phase 5)

User can:
- Accept all recommendations
- Toggle individual agents on/off
- Change team assignments
- Adjust approval mode

**Step 5: Deploy & Go Live**
One-click deployment that:
1. Creates team hierarchy (Phase 1 structures)
2. Creates all selected agents with:
   - Auto-generated system prompts using company profile + brand voice
   - Tools pre-selected per archetype
   - Heartbeat intervals based on role
   - Initial heartbeat instructions based on strategy
3. Seeds company wiki with scraped content (chunked + embedded for RAG)
4. Creates initial strategies with KPIs
5. Sets approval mode (Phase 2)
6. Shows cost projection dashboard (Phase 5)
7. CEO Agent auto-created (already exists from project creation, but now
   gets proper context from scraped data)

### Web Scraping Implementation

**New package: `packages/scraper/`**
```
packages/scraper/
  src/
    index.ts            -- main scrape orchestrator
    extractors/
      website.ts        -- generic website scraper (title, meta, headings, text)
      linkedin.ts       -- LinkedIn company page (public data only)
      instagram.ts      -- Instagram profile (public data only)
      facebook.ts       -- Facebook page (public data only)
    synthesizer.ts      -- Claude Haiku call to build CompanyProfile
    utils/
      html-to-text.ts   -- strip HTML, extract meaningful content
      rate-limiter.ts   -- respect robots.txt, rate limit requests
```

**Scraping approach:**
- Use `fetch` + cheerio for HTML parsing (no headless browser needed for
  public pages)
- Respect robots.txt
- Rate limit: max 2 requests/second per domain
- Timeout: 10s per URL
- Max content: 50KB text per URL (truncate, let Haiku summarize)
- Fallback: if scraping fails, user manually fills the profile

**BullMQ job: `onboarding-scrape`**
- Async processing (user sees progress animation)
- Socket.IO events: `onboarding:scrape_progress`, `onboarding:scrape_complete`
- Results cached in Redis (1h TTL) so user can go back/forward in wizard

### Agent Prompt Generation

Use Claude Haiku to generate system prompts per agent:
```
Input: company profile + agent archetype + team + brand voice + strategy
Output: bilingual system prompt (en-US + pt-BR) tailored to this specific company
```

Example for a sales agent at a SaaS company:
```
You are a sales agent for [CompanyName], a [description]. Your targets are
[audience]. Communicate in a [brandVoice] tone. Your primary KPI is [kpi].
Focus on [products]. Use WhatsApp for warm leads and email for cold outreach.
```

### Files to touch
- `packages/scraper/` (NEW package)
- `packages/scraper/package.json` (dependencies: cheerio, robots-parser)
- `apps/worker/src/workers/onboarding-scrape.ts` (NEW)
- `packages/api/src/routers/onboarding.ts` (NEW — orchestrate the flow)
- `packages/ai/src/onboarding/fleet-recommender.ts` (NEW — suggest agents)
- `packages/ai/src/onboarding/prompt-generator.ts` (NEW — generate prompts)
- `apps/web/src/app/[locale]/(auth)/onboarding/` (NEW — 5-step wizard UI)
- `apps/web/messages/en-US.json` (onboarding namespace)
- `apps/web/messages/pt-BR.json` (onboarding namespace)

---

## Dependency Graph

```
Phase 1: Hierarchy ─────┬──> Phase 2: Approvals ──┐
                        |                          |
                        ├──> Phase 6: Validation   |
                        |                          v
Phase 3: Metrics ───────┴──> Phase 4: Learning ──> Phase 7: Onboarding
                                                       ^
Phase 5: Cost Simulation ─────────────────────────────┘
```

Phase 5 (Cost Simulation) is the most independent — can be built in parallel
with Phases 3-4 if resources allow.

---

## Estimated Scope Per Phase

| Phase | New Tables | New Files | Modify Existing | Risk |
|-------|-----------|-----------|-----------------|------|
| 1. Hierarchy | 2 | ~8 | ~6 | Medium (data model migration) |
| 2. Approvals | 1 | ~4 | ~5 | Low (additive, backward compat) |
| 3. Metrics | 2 | ~5 | ~2 | Low (new worker, no breaking changes) |
| 4. Learning | 0 | ~2 | ~3 | Low (extends existing context builder) |
| 5. Cost Sim | 0 | ~3 | ~4 | Low (pure functions + UI) |
| 6. Validation | 1 | ~4 | ~2 | Low (additive, backward compat) |
| 7. Onboarding | 0 | ~12 | ~4 | Medium (new package, LLM calls, scraping) |

---

## Relationship to Existing P0 Gaps

The spec's P0 build order (token budgets, scheduled worker, strategy injection,
cascade safety, heartbeat, KPI triggers, session logs, CEO Agent) remains valid
and should be interleaved:

```
SPEC P0-A: Token Budgets          <-- can start now, no dependency
SPEC P0-B: Scheduled Worker       <-- can start now
SPEC P0-C: Strategy Injection     <-- can start now
V5 Phase 1: Hierarchy             <-- can start now
SPEC P0-D: Cascade Safety         <-- after Phase 1 (respects hierarchy)
V5 Phase 2: Approvals             <-- after Phase 1
V5 Phase 3: Metrics               <-- after P0-B (needs running agents)
SPEC P0-E: Heartbeat              <-- after P0-D
SPEC P0-F: KPI Triggers           <-- after P0-E
V5 Phase 4: Learning              <-- after Phase 3 + P0-E
V5 Phase 5: Cost Simulation       <-- anytime (independent)
SPEC P0-G: Session Logs -> Wiki   <-- after P0-F
V5 Phase 6: Validation            <-- after Phase 1
SPEC P0-H: CEO Agent              <-- after everything
V5 Phase 7: Onboarding            <-- after everything
```

---

## Implementation Status (as of 2026-03-05)

All 7 phases have been committed and pushed (commits #128–#134, migrations 0007–0011).
Schema, API routers, shared types, UI pages, and pure logic are **fully shipped**.

The following items are **stubbed / deferred** because they depend on V4 P0 foundation
work that hasn't been built yet:

### Phase 3: Performance Metrics
- **Rollup worker** (`performance-rollup` BullMQ job — daily aggregation of action_logs
  into agent_performance_snapshots): needs V4 P0-B (Scheduled Worker) first.
- **Agent tools** (`get_my_performance`, `query_team_metrics`): need the rollup worker
  to populate snapshot data. Tool definitions not yet created in `packages/ai/src/tools/`.

### Phase 4: Heartbeat Learning
- **Context injection** (injecting performance stats + lessons into agent context before
  heartbeat rewrite in `context-builder.ts`): needs V4 P0-E (Heartbeat System) first.
  The `lessons` jsonb field on agents is live and ready.

### Phase 6: Payload Validation
- **Runtime wiring** (calling `validatePayload()` and `cascadeRouteValid()` inside the
  actual `trigger_agent` tool execution): needs V4 P0-D (Cascade Safety) first. The
  validator functions and routing logic exist in `packages/shared/src/utils/payload-validator.ts`
  but aren't called from the agent harness yet.

### Phase 7: Smart Onboarding
- **Web scraping** (`scrapeCompany` endpoint returns a stub profile): full cheerio +
  robots-parser implementation deferred until worker infra is ready. The wizard works
  end-to-end with manual input — scraping step shows a progress animation and auto-advances.
- **Prompt generation** (using Claude Haiku to generate per-agent system prompts from
  company profile + brand voice): deferred. Agents deploy with default archetype prompts.

### Unlock order (V4 P0 dependencies):
```
V4 P0-B: Scheduled Worker  --> unlocks Phase 3 rollup worker
V4 P0-D: Cascade Safety    --> unlocks Phase 6 runtime wiring
V4 P0-E: Heartbeat System  --> unlocks Phase 4 context injection
All of the above            --> unlocks Phase 7 scraping + prompt gen
```

---

## Non-Goals (Explicitly Out of Scope)

- External API integrations (CRM sync, bank API, ad platforms) — deferred
- Stripe billing integration — deferred
- Mobile app — deferred
- Multi-language beyond pt-BR/en-US — deferred
- Headless browser scraping (Puppeteer/Playwright) — use fetch + cheerio only
- Real-time collaboration (multiple users editing same agent) — deferred
