import {
  Bot,
  Workflow,
  MessageSquare,
  ShieldCheck,
  Wrench,
  BookOpen,
  CreditCard,
  Globe,
  Layers,
  Radio,
  Building2,
  Users,
  Cpu,
  Map,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Re-export shared helpers from common location                      */
/* ------------------------------------------------------------------ */

import { StatusBadge, SectionHeading, FeatureList, LimitationList, QuickStart } from '../../_components/reference-components';
export { StatusBadge, SectionHeading, FeatureList, LimitationList, QuickStart };

import { agentCapabilitiesContent } from './content/agent-capabilities';

/* ------------------------------------------------------------------ */
/*  TOC structure                                                      */
/* ------------------------------------------------------------------ */

import type { ReferenceTopic, ReferenceSubtopic } from '../../_components/reference-types';

export type DocSubtopic = ReferenceSubtopic;
export type DocTopic = ReferenceTopic;

export const topics: DocTopic[] = [
  { slug: 'overview', label: 'Overview', icon: Globe },
  {
    slug: 'agents',
    label: 'AI Agents',
    icon: Bot,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'archetypes', label: 'Archetypes' },
      { id: 'execution-modes', label: 'Execution Modes' },
      { id: 'llm-config', label: 'LLM Config' },
      { id: 'agent-memory', label: 'Memory' },
      { id: 'knowledge', label: 'Knowledge Base' },
      { id: 'health', label: 'Health & Recovery' },
      { id: 'sandbox', label: 'Sandbox' },
      { id: 'teams', label: 'Teams' },
    ],
  },
  {
    slug: 'tools',
    label: 'Tools & Integrations',
    icon: Wrench,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'built-in', label: 'Built-in' },
      { id: 'communication-tools', label: 'Communication' },
      { id: 'crm', label: 'CRM' },
      { id: 'productivity', label: 'Productivity' },
      { id: 'finance', label: 'Finance' },
      { id: 'devops', label: 'DevOps' },
      { id: 'ads', label: 'Ads & Analytics' },
      { id: 'self-config', label: 'Self-Configuration' },
      { id: 'fleet-tools', label: 'Fleet' },
      { id: 'strategy-tools', label: 'Strategy' },
    ],
  },
  {
    slug: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'editor', label: 'Visual Editor' },
      { id: 'nodes', label: 'Node Types' },
      { id: 'triggers', label: 'Triggers' },
      { id: 'templates', label: 'Templates' },
      { id: 'monitoring', label: 'Monitoring' },
    ],
  },
  {
    slug: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'whatsapp', label: 'WhatsApp' },
      { id: 'email', label: 'Email' },
      { id: 'inbox', label: 'Messaging Inbox' },
    ],
  },
  {
    slug: 'knowledge',
    label: 'Knowledge & RAG',
    icon: BookOpen,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'documents', label: 'Documents' },
      { id: 'wiki', label: 'Wiki' },
      { id: 'curated', label: 'Curated Knowledge' },
      { id: 'rag-search', label: 'RAG Search' },
    ],
  },
  {
    slug: 'atlas',
    label: 'ATLAS',
    icon: Radio,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'atlas-orb', label: 'Orb Visualization' },
      { id: 'atlas-loop', label: 'Agentic Loop' },
      { id: 'atlas-tools', label: 'Tool Categories' },
      { id: 'atlas-voice', label: 'Voice' },
      { id: 'atlas-briefing', label: 'CEO Briefing' },
    ],
  },
  {
    slug: 'safety',
    label: 'Safety & Governance',
    icon: ShieldCheck,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'rbac', label: 'RBAC' },
      { id: 'audit', label: 'Audit Logging' },
      { id: 'pii', label: 'PII Masking' },
      { id: 'cascades', label: 'Cascade Safety' },
      { id: 'lgpd', label: 'LGPD Compliance' },
    ],
  },
  {
    slug: 'orchestrator',
    label: 'Fleet Orchestrator',
    icon: Cpu,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'engine', label: 'Engine' },
      { id: 'cost-tracking', label: 'Cost Tracking' },
      { id: 'config', label: 'Configuration' },
      { id: 'ceo-agent', label: 'CEO Agent' },
    ],
  },
  {
    slug: 'screens',
    label: 'Screen Guide',
    icon: Building2,
    subtopics: [
      { id: 'office', label: 'Virtual Office' },
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'strategy-screen', label: 'Strategy' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'devops-screen', label: 'DevOps' },
      { id: 'community', label: 'Community' },
      { id: 'settings-screen', label: 'Settings' },
      { id: 'onboarding-screen', label: 'Onboarding' },
    ],
  },
  {
    slug: 'tech',
    label: 'Architecture',
    icon: Layers,
    subtopics: [
      { id: 'frontend', label: 'Frontend' },
      { id: 'backend', label: 'Backend' },
      { id: 'ai-stack', label: 'AI' },
      { id: 'infrastructure', label: 'Infrastructure' },
      { id: 'security', label: 'Security' },
      { id: 'realtime', label: 'Real-time' },
    ],
  },
  {
    slug: 'billing',
    label: 'Billing & Plans',
    icon: CreditCard,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'plans', label: 'Plans' },
      { id: 'payment-methods', label: 'Payment Methods' },
      { id: 'usage', label: 'Usage & Tokens' },
    ],
  },
  {
    slug: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    subtopics: [
      { id: 'upcoming', label: 'Upcoming Features' },
      { id: 'latam', label: 'LatAm Expansion' },
      { id: 'enterprise', label: 'Enterprise' },
    ],
  },
  {
    slug: 'agent-capabilities',
    label: 'Agents & Capabilities',
    icon: Users,
    subtopics: [
      { id: 'overview', label: 'Overview' },
      { id: 'juridico', label: 'Juridico' },
      { id: 'tributario', label: 'Tributario' },
      { id: 'contabilidade', label: 'Contabilidade' },
      { id: 'rh', label: 'RH' },
      { id: 'vendas', label: 'Vendas' },
      { id: 'marketing', label: 'Marketing' },
      { id: 'operacoes', label: 'Operacoes' },
      { id: 'atendimento', label: 'Atendimento' },
      { id: 'ti', label: 'TI' },
      { id: 'compliance', label: 'Compliance' },
      { id: 'tesouraria', label: 'Tesouraria' },
      { id: 'planejamento', label: 'Planejamento' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Content map  (slug → JSX)                                          */
/* ------------------------------------------------------------------ */

export const topicContent: Record<string, React.ReactNode> = {
  /* ---- Overview -------------------------------------------------- */
  overview: (
    <section>
      <SectionHeading id="overview" icon={Globe} title="Overview" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        AI Office Sim is a virtual office platform where AI agents work autonomously on real business
        tasks. You create agents, assign them roles and tools, and they execute tasks — from sending
        WhatsApp messages to managing CRM contacts, writing emails, analyzing spreadsheets, running
        multi-step workflows, and more.
      </p>
      <p className="mb-6 text-sm leading-relaxed text-text-secondary">
        Think of it as a fully staffed office that runs 24/7, powered by Claude (Anthropic) with
        built-in approval workflows, fleet orchestration, safety guardrails, and a visual workflow
        engine so you stay in control of high-risk actions.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { value: '21', label: 'Agent archetypes' },
          { value: '42+', label: 'Agent tools' },
          { value: '88', label: 'Workflow templates' },
          { value: '17', label: 'Screens' },
          { value: '30', label: 'ATLAS tools' },
          { value: '22', label: 'Company templates' },
        ].map((stat) => (
          <div key={stat.label} className="border border-border-default bg-bg-base p-4">
            <p className="mb-1 text-2xl font-bold text-accent-cyan">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Key Capabilities
      </h3>
      <FeatureList
        items={[
          'Autonomous AI agents with 21 role archetypes and 42+ tools',
          'Visual workflow editor with conditional branching, approvals, and delays',
          'WhatsApp, Email, and internal messaging with bi-directional I/O',
          'Knowledge base with RAG (Retrieval-Augmented Generation) via pgvector',
          'ATLAS — voice-enabled AI advisor with 30 tools and agentic loop',
          'Fleet orchestrator with cost tracking, priority scheduling, and CEO agent',
          'Safety layer: approval gates, RBAC, audit logging, PII masking, LGPD compliance',
          'Real-time 3D virtual office with agent status visualization',
          'Full i18n (en-US / pt-BR) and Brazil-specific payments (PIX, boleto)',
        ]}
      />
    </section>
  ),

  /* ---- AI Agents ------------------------------------------------- */
  agents: (
    <section>
      <SectionHeading id="agents" icon={Bot} title="AI Agents" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Agents are the core of AI Office Sim. Each agent has a role archetype, a set of tools,
        persistent memory, knowledge base access, and configurable execution behavior. They can be
        triggered manually, on a schedule, by events, by other agents, or run continuously.
      </p>

      <QuickStart
        steps={[
          'Navigate to the Agents page from the sidebar',
          'Click "Create Agent" and choose an archetype (e.g. Support, Sales, CEO Strategist)',
          'Configure the agent\'s LLM model, temperature, and token budget',
          'Assign tools the agent is allowed to use (WhatsApp, Email, CRM, etc.)',
          'Set an execution mode (manual for testing) and click Save',
        ]}
      />

      <h3 id="archetypes" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Archetypes
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        21 pre-configured agent templates for common business roles.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          'Support', 'Sales', 'Marketing', 'Data Analyst', 'Content Writer',
          'Developer', 'Project Manager', 'HR', 'Finance', 'Email Campaign Manager',
          'Research', 'Recruiter', 'Social Media', 'Mercado Livre', 'Inventory Monitor',
          'Legal Research', 'Ad Analyst', 'Account Manager', 'Deployment Monitor',
          'CEO Strategist', 'Custom',
        ].map((a) => (
          <span
            key={a}
            className="border border-border-default px-2 py-1 text-xs text-text-secondary"
          >
            {a}
          </span>
        ))}
      </div>

      <h3 id="execution-modes" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Execution Modes
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Define how and when agents start working.
      </p>
      <FeatureList
        items={[
          'Manual — trigger from the UI or via API',
          'Scheduled — cron-based recurring execution (e.g. daily at 9am)',
          'Event-driven — react to incoming messages, webhooks, or system events',
          'Agent-chained — triggered by another agent via the trigger_agent tool',
          'Always-on — continuously listening and responding to incoming requests',
        ]}
      />

      <h3 id="llm-config" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        LLM Config
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Fine-tune the AI model backing each agent.
      </p>
      <FeatureList
        items={[
          'Select model per agent (Claude Sonnet, Haiku, or Opus)',
          'Temperature slider for creativity vs determinism',
          'Max tokens limit per response',
          'Budget cap per agent (USD) to control costs',
          'Bilingual system prompts (English & Portuguese)',
        ]}
      />

      <h3 id="agent-memory" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Memory
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Persistent memory that survives across sessions.
      </p>
      <FeatureList
        items={[
          'Key-value store with JSONB values per agent',
          'Semantic search via pgvector embeddings for recall',
          'Memory persists across sessions — agents learn over time',
          'Manual memory inspection and editing in the agent config panel',
        ]}
      />

      <h3 id="knowledge" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Knowledge Base Access
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Agents access company knowledge during execution.
      </p>
      <FeatureList
        items={[
          'RAG search via the search_company_memory tool',
          'Search results injected into agent context as reference material',
          'Agents can also create and update documents and wiki articles',
        ]}
      />

      <h3 id="health" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Health & Recovery
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Monitor agent health and handle failures gracefully.
      </p>
      <FeatureList
        items={[
          'Heartbeat tracking — agents report status periodically',
          'Automatic error detection with status indicators (idle, working, error, awaiting approval)',
          'Per-agent safety limits: max actions per session, token budgets, cost caps',
          'Pause and resume agents individually or by team',
        ]}
      />

      <h3 id="sandbox" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Sandbox
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Test agents safely before deploying to production.
      </p>
      <FeatureList
        items={[
          'Agent inspector panel with real-time action feed',
          'Manual trigger mode for step-by-step testing',
          'Full I/O payload visibility in the activity log',
          'Tool-level approval rules to prevent accidental mutations',
        ]}
      />

      <h3 id="teams" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Teams
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Group agents by department for organization and office placement.
      </p>
      <FeatureList
        items={[
          'Teams: development, research, marketing, sales, support, finance, operations',
          'Team assignment controls desk placement in the Virtual Office',
          'Pause/resume agents by team via fleet management tools',
          'Team-based priority scheduling in the orchestrator',
        ]}
      />

      <LimitationList
        items={[
          'No agent team hierarchy or permission scoping between teams',
          'No multi-model routing within a single agent session',
        ]}
      />
    </section>
  ),

  /* ---- Tools & Integrations -------------------------------------- */
  tools: (
    <section>
      <SectionHeading id="tools" icon={Wrench} title="Tools & Integrations" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Tools are the actions agents can perform. 42+ tools across 11 categories are registered in
        a central registry. Each tool has defined inputs, outputs, and an optional approval
        requirement. Tools can be assigned to any agent individually.
      </p>

      <QuickStart
        steps={[
          'Open an agent\'s configuration page',
          'Scroll to the "Tools" section and toggle on the tools you need',
          'For external tools (WhatsApp, Email, CRM), set up credentials in Settings → Tool Credentials',
          'Configure approval rules per tool (always allow, require approval, or block)',
          'Test by manually triggering the agent and checking the Activity Log',
        ]}
      />

      <div className="mb-6 space-y-4">
        {[
          {
            id: 'built-in',
            category: 'Built-in',
            tools: [
              { name: 'get_current_time', desc: 'Returns ISO 8601 timestamp with timezone' },
              { name: 'search_company_memory', desc: 'Semantic search over uploaded documents (RAG)' },
              { name: 'log_message', desc: 'Structured logging (info, warning, error levels)' },
              { name: 'search_web', desc: 'Web search via Serper API for real-time information' },
              { name: 'trigger_agent', desc: 'Trigger another agent with a message payload' },
            ],
          },
          {
            id: 'communication-tools',
            category: 'Communication',
            tools: [
              { name: 'send_whatsapp_message', desc: 'Send message to a contact (requires approval)' },
              { name: 'read_whatsapp_messages', desc: 'Fetch conversation history with a contact' },
              { name: 'send_email', desc: 'Send email with HTML body and attachments (requires approval)' },
              { name: 'read_email', desc: 'Read emails from inbox via IMAP' },
              { name: 'send_conversation_message', desc: 'Send messages in internal conversations' },
            ],
          },
          {
            id: 'crm',
            category: 'CRM — RD Station',
            tools: [
              { name: 'search_contacts', desc: 'Find contacts by criteria' },
              { name: 'create_contact', desc: 'Add new contact to CRM' },
              { name: 'update_contact', desc: 'Modify existing contact fields' },
              { name: 'list_deals', desc: 'Fetch sales pipeline deals' },
              { name: 'create_deal', desc: 'Create new deal in pipeline' },
            ],
          },
          {
            id: 'productivity',
            category: 'Productivity — Google Workspace',
            tools: [
              { name: 'read_spreadsheet', desc: 'Fetch cell ranges from Google Sheets' },
              { name: 'write_spreadsheet', desc: 'Update specific cells in Google Sheets' },
              { name: 'append_to_spreadsheet', desc: 'Append new rows to a sheet' },
              { name: 'schedule_event', desc: 'Schedule Google Calendar events' },
              { name: 'sync_google_calendar', desc: 'Sync Google Calendar data' },
            ],
          },
          {
            id: 'finance',
            category: 'Finance (Brazil)',
            tools: [
              { name: 'monitor_pix_transactions', desc: 'Track PIX instant payments via EFI Bank API' },
              { name: 'check_nfe_status', desc: 'Check NFe invoice status' },
            ],
          },
          {
            id: 'devops',
            category: 'DevOps',
            tools: [
              { name: 'create_deploy_request', desc: 'Request a deployment to an environment' },
              { name: 'create_pr_review_request', desc: 'Request code review on a PR' },
              { name: 'create_human_task', desc: 'Create a task for a human team member' },
            ],
          },
          {
            id: 'ads',
            category: 'Ads & Analytics',
            tools: [
              { name: 'meta_marketing', desc: 'Meta (Facebook/Instagram) ad management and analytics' },
              { name: 'google_ads', desc: 'Google Ads campaign management and reporting' },
            ],
          },
          {
            id: 'self-config',
            category: 'Self-Configuration',
            tools: [
              { name: 'update_my_heartbeat', desc: 'Agent updates its own health heartbeat' },
              { name: 'update_my_schedule', desc: 'Agent adjusts its own schedule' },
            ],
          },
          {
            id: 'fleet-tools',
            category: 'Fleet Management',
            tools: [
              { name: 'get_fleet_status', desc: 'Get agent fleet status summary' },
              { name: 'update_agent_schedule', desc: 'Update another agent\'s schedule' },
              { name: 'update_agent_heartbeat', desc: 'Update another agent\'s heartbeat' },
              { name: 'get_cost_report', desc: 'Get cost/billing report for agents' },
              { name: 'search_action_logs', desc: 'Search agent action logs' },
              { name: 'pause_agents_by_team', desc: 'Pause all agents in a team' },
              { name: 'resume_agents_by_team', desc: 'Resume all agents in a team' },
            ],
          },
          {
            id: 'strategy-tools',
            category: 'Strategy & Knowledge',
            tools: [
              { name: 'update_strategy_kpi', desc: 'Update strategy KPI values' },
              { name: 'get_kpi_trends', desc: 'Get KPI trend data over time' },
              { name: 'create_document', desc: 'Save searchable documents in knowledge base' },
              { name: 'generate_document', desc: 'Generate documents from templates' },
              { name: 'update_document', desc: 'Update existing documents' },
              { name: 'update_wiki_article', desc: 'Update wiki articles' },
            ],
          },
        ].map((group) => (
          <div key={group.category} id={group.id} className="border border-border-default bg-bg-base p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-accent-cyan">
              {group.category}
            </h4>
            <div className="space-y-2">
              {group.tools.map((t) => (
                <div key={t.name} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <code className="shrink-0 text-xs text-text-primary">{t.name}</code>
                  <span className="text-xs text-text-muted">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <LimitationList
        items={[
          'Google Sheets and RD Station require OAuth2 credential setup',
          'No native Slack, GitHub API, or database query tools yet',
          'Ad tools require active Meta/Google Ads API credentials',
        ]}
      />
    </section>
  ),

  /* ---- Workflows ------------------------------------------------- */
  workflows: (
    <section>
      <SectionHeading id="workflows" icon={Workflow} title="Workflows" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Workflows let you chain multiple agent tasks into automated pipelines using a visual graph
        editor (React Flow). Build multi-agent pipelines with conditional branching, approval gates,
        delays, and output destinations. Choose from 88 pre-built templates or create from scratch.
      </p>

      <QuickStart
        steps={[
          'Navigate to Workflows from the sidebar',
          'Click "Create Workflow" — choose from 88 templates or start blank',
          'Drag nodes onto the canvas: agent tasks, conditions, approvals, delays',
          'Connect nodes with edges to define execution flow',
          'Set a trigger (manual, scheduled, webhook, or event) and activate',
        ]}
      />

      <h3 id="editor" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Visual Editor
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Drag-and-drop canvas for building multi-agent pipelines.
      </p>
      <FeatureList
        items={[
          'React Flow-based visual graph editor with zoom, pan, and snap-to-grid',
          'Drag nodes from a palette onto the canvas',
          'Connect nodes with edges to define execution order and branching',
          'Activate/deactivate workflows without deleting them',
          'Full workflow definition stored as JSON for portability',
        ]}
      />

      <h3 id="nodes" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Node Types
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Six node types for building complex automation flows.
      </p>
      <div className="mb-6 space-y-2">
        {[
          { type: 'Trigger', desc: 'Entry point — defines how the workflow starts (manual, cron, webhook, event)' },
          { type: 'Agent', desc: 'Executes an AI agent with a prompt template, receives predecessor output as context' },
          { type: 'Condition', desc: 'Evaluates conditions with branching (LLM eval, contains, JSON path matching)' },
          { type: 'Approval', desc: 'Human approval gate — pauses execution until approved/rejected, with configurable timeout and auto-action' },
          { type: 'Delay', desc: 'Pauses execution for a configured duration (minutes, hours, or days)' },
          { type: 'Output', desc: 'Sends results to external systems (email, webhook, or log)' },
        ].map((n) => (
          <div key={n.type} className="flex gap-3 border border-border-default bg-bg-base p-3">
            <span className="shrink-0 text-xs font-bold text-accent-cyan">{n.type}</span>
            <p className="text-xs text-text-muted">{n.desc}</p>
          </div>
        ))}
      </div>

      <h3 id="triggers" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Trigger Types
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Four ways to start a workflow.
      </p>
      <FeatureList
        items={[
          'Manual — trigger from the UI or via API',
          'Scheduled — cron expression for recurring execution',
          'Webhook — external systems trigger via HTTP POST',
          'Event — react to system events (e.g. new message, agent completion)',
        ]}
      />

      <h3 id="templates" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Templates
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        88 pre-built workflow templates covering universal and Brazil-specific use cases.
      </p>
      <FeatureList
        items={[
          '12 universal templates (onboarding, lead nurturing, content pipeline, etc.)',
          '76 department-specific templates for Brazilian businesses',
          'Templates cover legal, tax, accounting, HR, sales, marketing, ops, support, IT, compliance, treasury, and planning',
          'One-click import with automatic node and edge generation',
        ]}
      />

      <h3 id="monitoring" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Run Monitoring
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Track workflow execution progress in real time.
      </p>
      <FeatureList
        items={[
          'Per-node execution tracking: input, output, status, duration',
          'Workflow-level status: running, completed, failed, cancelled, waiting_approval',
          'Node-level status indicators: pending, running, completed, failed',
          'Resource limits enforced per plan (e.g. 5 workflows on Starter)',
        ]}
      />

      <LimitationList
        items={[
          'No loop/retry nodes — use agent-chaining for retry patterns',
          'No parallel branch execution — conditions route to one path at a time',
        ]}
      />
    </section>
  ),

  /* ---- Communication --------------------------------------------- */
  communication: (
    <section>
      <SectionHeading id="communication" icon={MessageSquare} title="Communication" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Unified communication layer covering WhatsApp, email, and internal messaging. Agents can
        send and receive messages across all channels with full status tracking and webhook handling.
      </p>

      <QuickStart
        steps={[
          'Go to Settings → Tool Credentials and add your provider credentials (WhatsApp, Email)',
          'Assign communication tools (send_whatsapp_message, send_email, etc.) to an agent',
          'Set a default handler agent for automatic responses to incoming messages',
          'Monitor all conversations in the Messaging Inbox',
        ]}
      />

      <h3 id="whatsapp" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        WhatsApp
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Connect your WhatsApp Business number and let agents send/receive messages.
      </p>
      <div className="mb-4 flex gap-3">
        {['Z-API', 'Twilio', 'Meta Cloud API'].map((p) => (
          <span
            key={p}
            className="border border-border-default px-3 py-1.5 text-xs font-semibold text-text-secondary"
          >
            {p}
          </span>
        ))}
      </div>
      <FeatureList
        items={[
          'Bi-directional messaging with full status tracking (pending, sent, delivered, read, failed)',
          'Webhook signature verification (HMAC-SHA256/SHA1, Bearer token)',
          'Default handler agent per connection for auto-responses',
          'Contact name and phone indexing with automatic message routing',
          'Pre-approved message templates for Meta Cloud API compliance',
          'Media URL support for images and files',
        ]}
      />

      <h3 id="email" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Email
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Send and receive emails through your preferred provider.
      </p>
      <div className="mb-4 flex gap-3">
        {['SMTP', 'SendGrid', 'AWS SES'].map((p) => (
          <span
            key={p}
            className="border border-border-default px-3 py-1.5 text-xs font-semibold text-text-secondary"
          >
            {p}
          </span>
        ))}
      </div>
      <FeatureList
        items={[
          'Send emails with HTML body, plain text fallback, and attachments',
          'To, CC, BCC recipient support with status tracking',
          'Inbound email worker for receiving and processing incoming messages',
          'Reusable email templates (transactional and marketing) with variable substitution',
          'IMAP inbox reading with configurable host/port/credentials',
        ]}
      />

      <h3 id="inbox" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Messaging Inbox
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Unified inbox for viewing all message activity across channels.
      </p>
      <FeatureList
        items={[
          'Internal conversation system with send_conversation_message tool',
          'Message history with timestamps and delivery status',
          'Agent-to-agent communication via trigger_agent tool',
          'Automatic routing of inbound messages to designated handler agents',
        ]}
      />

      <LimitationList
        items={[
          'No WhatsApp group support',
          'Media via URL only — no direct file uploads',
          'No calendar or meeting scheduling via email',
        ]}
      />
    </section>
  ),

  /* ---- Knowledge & RAG ------------------------------------------- */
  knowledge: (
    <section>
      <SectionHeading id="knowledge" icon={BookOpen} title="Knowledge & RAG" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Build a company knowledge base from documents, wiki articles, and curated content. Agents
        search it using semantic similarity (RAG — Retrieval-Augmented Generation) to answer
        questions with real company data.
      </p>

      <QuickStart
        steps={[
          'Navigate to Documents from the sidebar and upload a document (PDF, TXT, or paste text)',
          'The system automatically chunks and embeds the content via pgvector',
          'Assign the search_company_memory tool to agents that need knowledge access',
          'Optionally organize knowledge in the Wiki with categories and articles',
          'Test by asking an agent a question that requires document knowledge',
        ]}
      />

      <h3 id="documents" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Documents
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Upload and manage documents for the knowledge base.
      </p>
      <FeatureList
        items={[
          'File upload: PDF, TXT, and raw text content',
          'Web sources: paste a URL for content extraction',
          'Agent-generated: agents can create documents via create_document and generate_document tools',
          'Metadata and source URL tracking per document',
          'Automatic chunking into searchable segments with embedding',
        ]}
      />

      <h3 id="wiki" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Wiki
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Structured knowledge base with hierarchical categories and articles.
      </p>
      <FeatureList
        items={[
          'Hierarchical categories up to 3 levels deep with custom icons and sort order',
          'Articles with title, summary, content body, and tags',
          'Attach documents to articles for RAG integration',
          'Agents can update wiki articles via the update_wiki_article tool',
        ]}
      />

      <h3 id="curated" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Curated Knowledge
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Company-specific knowledge curated by agents and humans.
      </p>
      <FeatureList
        items={[
          'Agent-generated learnings with confidence scores tied to strategies',
          'Strategy recommendations that can be applied or dismissed',
          'Agent memory (key-value store) acts as per-agent curated knowledge',
        ]}
      />

      <h3 id="rag-search" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        RAG Search
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Cosine similarity search for fast, relevant retrieval.
      </p>
      <FeatureList
        items={[
          'Embedding with OpenAI text-embedding-3-small (1536 dimensions)',
          'Cosine similarity search via pgvector',
          'Returns top-K most relevant chunks with similarity scores',
          'Project-scoped — agents only see their project\'s documents',
          'Search results injected into agent context as reference material',
        ]}
      />

      <LimitationList
        items={[
          'No document versioning',
          'No article version history or draft/published workflow',
          'Large document corpuses may have slower query times',
        ]}
      />
    </section>
  ),

  /* ---- ATLAS ----------------------------------------------------- */
  atlas: (
    <section>
      <SectionHeading id="atlas" icon={Radio} title="ATLAS — Agent Tracking & Live Advisory System" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        ATLAS is an interactive AI advisory interface with voice input (STT) and voice output (TTS).
        Powered by a real Claude agentic loop with 30 tools, ATLAS can read your project data,
        analyze agent performance, manage your fleet, and deliver CEO briefings with live data.
      </p>

      <QuickStart
        steps={[
          'Navigate to ATLAS from the sidebar',
          'Type a question or click the microphone for voice input (speech-to-text)',
          'ATLAS runs a Claude agentic loop — read-only tools auto-execute, mutations require approval',
          'Review the response in the transcript panel with full tool-use transparency',
          'Use CEO Briefing for a one-click executive summary of your project',
        ]}
      />

      <h3 id="atlas-orb" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Orb Visualization
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        A canvas-based animated orb that visually represents ATLAS&apos;s current state with dynamic effects.
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {[
          { state: 'Idle', color: '#00C8E0', desc: 'Cyan pulse — ready to listen' },
          { state: 'Listening', color: '#34D399', desc: 'Green pulse — speak now' },
          { state: 'Thinking', color: '#4493F8', desc: 'Blue pulse — analyzing context' },
          { state: 'Speaking', color: '#FBBF24', desc: 'Amber pulse — delivering response' },
        ].map((s) => (
          <div key={s.state} className="flex items-center gap-3 border border-border-default bg-bg-base p-3">
            <span
              className="inline-block h-3 w-3 shrink-0"
              style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}
            />
            <div>
              <p className="text-xs font-bold text-text-primary">{s.state}</p>
              <p className="text-[10px] text-text-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <FeatureList
        items={[
          'Pulsing orb with outer glow rings and wave distortion effects',
          'Orbiting particles that increase with state activity (3–8 particles)',
          'Intensity modulation responds to conversation flow in real time',
          'Retina-ready rendering (2x canvas resolution)',
        ]}
      />

      <h3 id="atlas-loop" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Agentic Loop
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        ATLAS runs a real Claude agentic loop — not mock data.
      </p>
      <FeatureList
        items={[
          'Powered by Claude Sonnet with tool-use capabilities',
          'Up to 8 iterations per query for multi-step reasoning',
          '30 tools: 15 auto-execute (read-only) + 15 approval-required (mutations)',
          'Full tool-call transparency: every tool invocation visible in the response',
          'Streaming responses with real-time status updates in the orb',
        ]}
      />

      <h3 id="atlas-tools" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Tool Categories
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        30 tools organized by domain, split between auto-execute and approval-required.
      </p>
      <div className="mb-6 space-y-4">
        {[
          {
            category: 'Auto-Execute (Read-Only)',
            tools: [
              'list_agents', 'get_agent', 'list_workflows', 'get_workflow',
              'list_strategies', 'get_strategy', 'get_analytics',
              'list_pending_approvals', 'list_human_tasks', 'search_memory',
              'get_fleet_status', 'get_cost_report', 'get_orchestrator_config',
              'search_action_logs', 'get_kpi_trends',
            ],
          },
          {
            category: 'Approval-Required (Mutations)',
            tools: [
              'create_agent', 'update_agent', 'trigger_agent',
              'create_workflow', 'update_strategy', 'create_human_task',
              'update_orchestrator_config', 'pause_agents_by_team',
              'resume_agents_by_team', 'set_agent_priority', 'trigger_workflow',
              'update_wiki_article', 'manage_calendar',
              'create_strategy_kpi', 'update_strategy_kpi',
            ],
          },
        ].map((group) => (
          <div key={group.category} className="border border-border-default bg-bg-base p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-cyan">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.tools.map((t) => (
                <code key={t} className="text-xs text-text-secondary">{t}</code>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 id="atlas-voice" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Voice
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Full voice pipeline with speech-to-text input and text-to-speech output.
      </p>
      <FeatureList
        items={[
          'Speech-to-text (STT) via microphone button for voice queries',
          'Text-to-speech (TTS) for spoken responses in the speaking state',
          'Mute toggle, reset button, and volume controls',
          'Orb visualization syncs with voice state transitions',
        ]}
      />

      <h3 id="atlas-briefing" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        CEO Briefing
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        One-click executive summary of your project status.
      </p>
      <FeatureList
        items={[
          'Proactive CEO briefing with project health overview',
          'Agent performance summary, cost analysis, and risk assessment',
          'Starter suggestions: MRR status, risk assessment, weekly priorities',
          'Actionable recommendations for fleet optimization',
        ]}
      />

      <LimitationList
        items={[
          'No persistent conversation memory across sessions',
          'CEO briefing is query-triggered — not auto-scheduled yet',
        ]}
      />
    </section>
  ),

  /* ---- Safety & Governance --------------------------------------- */
  safety: (
    <section>
      <SectionHeading id="safety" icon={ShieldCheck} title="Safety & Governance" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Comprehensive safety layer ensuring agents operate within defined boundaries. Includes
        approval gates, role-based access control, audit logging, PII masking, cascade protection,
        and LGPD compliance.
      </p>

      <QuickStart
        steps={[
          'Approval rules are set per agent + tool combination in agent config',
          'RBAC roles (owner, admin, viewer) are managed in Settings → Members',
          'Audit logs are viewable in the Activity Log screen',
          'PII masking and cascade limits are enforced automatically by the engine',
        ]}
      />

      <h3 id="approvals" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Approval System
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Human-in-the-loop review for high-risk agent actions.
      </p>
      <FeatureList
        items={[
          'Three modes per tool: always allow, require approval, always block',
          'Four risk levels: low, medium, high, critical',
          'Approval requests pause agent execution until reviewed',
          'Full action context: tool name, input payload, agent identity, risk level',
          'Review with optional comments (approve or reject)',
          '48-hour timeout on pending approvals with configurable auto-action',
          'Approved actions resume agent execution automatically',
        ]}
      />

      <h3 id="rbac" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        RBAC (Role-Based Access Control)
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Control who can do what within your organization.
      </p>
      <FeatureList
        items={[
          'Three roles: owner (full access), admin (manage agents & tools), viewer (read-only)',
          'Role assignment during member invitation',
          'Project-level scoping — members only see assigned projects',
          'Clerk-powered authentication with SSO support',
        ]}
      />

      <h3 id="audit" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Audit Logging
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Complete audit trail of all agent actions and system events.
      </p>
      <FeatureList
        items={[
          'Every tool call logged with full input/output payloads',
          'LLM responses tracked with token count, duration, and cost',
          'Session timeline view showing all actions within an agent execution',
          'Filterable by agent, status (pending, completed, failed, cancelled)',
          'Paginated table with relative timestamps and action detail drawer',
        ]}
      />

      <h3 id="pii" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        PII Masking
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Protect sensitive personal information in agent communications.
      </p>
      <FeatureList
        items={[
          'Automatic detection and masking of PII in agent outputs',
          'CPF, CNPJ, and Brazilian document number recognition',
          'Email and phone number masking in logs and responses',
        ]}
      />

      <h3 id="cascades" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Cascade Safety
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Prevent runaway agent chains and infinite loops.
      </p>
      <FeatureList
        items={[
          'Max actions per session limit prevents infinite execution loops',
          'Token budget caps per agent prevent cost overruns',
          'Agent-chaining depth limits prevent cascade failures',
          'Automatic pause on repeated failures or budget exhaustion',
        ]}
      />

      <h3 id="lgpd" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        LGPD Compliance
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Built with Brazilian data protection law (LGPD) requirements in mind.
      </p>
      <FeatureList
        items={[
          'Data scoped per project — no cross-project data leakage',
          'Audit trail for all data access and modifications',
          'PII masking for sensitive Brazilian documents (CPF, CNPJ)',
          'Project deletion with full data cleanup',
        ]}
      />

      <LimitationList
        items={[
          'No approval delegation or escalation paths',
          'No IP allowlisting or geographic access restrictions',
          'GDPR compliance not yet implemented (EU expansion planned)',
        ]}
      />
    </section>
  ),

  /* ---- Fleet Orchestrator ---------------------------------------- */
  orchestrator: (
    <section>
      <SectionHeading id="orchestrator" icon={Cpu} title="Fleet Orchestrator" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        The Fleet Orchestrator is the engine that manages all agent execution across your
        organization. It handles scheduling, priority routing, cost tracking, and provides a
        dedicated CEO agent for fleet-level operations.
      </p>

      <QuickStart
        steps={[
          'The orchestrator runs automatically when agents are active',
          'View fleet status in the Dashboard or via ATLAS (get_fleet_status tool)',
          'Configure orchestrator settings via the CEO Strategist agent or ATLAS',
          'Monitor costs in real time with the cost projection system',
        ]}
      />

      <h3 id="engine" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Engine
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        BullMQ-powered execution engine with priority scheduling.
      </p>
      <FeatureList
        items={[
          'BullMQ + Redis job queue for reliable agent task execution',
          'Priority-based scheduling — critical tasks execute first',
          'Concurrent execution with configurable worker concurrency',
          'Automatic retry with exponential backoff on transient failures',
          'Job status tracking: waiting, active, completed, failed, delayed',
        ]}
      />

      <h3 id="cost-tracking" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Cost Tracking
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Real-time cost monitoring and projection for AI token usage.
      </p>
      <FeatureList
        items={[
          'Per-agent cost tracking with token-level granularity',
          'Cost breakdown by input tokens, output tokens, and model tier',
          'Budget caps per agent with automatic pause on budget exhaustion',
          'Fleet-level cost reports accessible via ATLAS (get_cost_report tool)',
          'Project-wide cost aggregation and trend analysis',
        ]}
      />

      <h3 id="config" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Configuration
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Fine-tune orchestrator behavior for your workload.
      </p>
      <FeatureList
        items={[
          'Orchestrator config accessible via ATLAS (get_orchestrator_config / update_orchestrator_config)',
          'Worker concurrency and rate limiting settings',
          'Global token budget and cost ceiling configuration',
          'Team-level pause/resume for controlled rollouts',
        ]}
      />

      <h3 id="ceo-agent" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        CEO Agent
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        A specialized agent archetype with fleet management privileges.
      </p>
      <FeatureList
        items={[
          'CEO Strategist archetype with access to fleet management tools',
          'Can pause/resume agents by team, set priorities, and view fleet status',
          'Cost report generation and budget optimization recommendations',
          'Available through both ATLAS interface and direct agent execution',
        ]}
      />

      <LimitationList
        items={[
          'No auto-scaling based on workload (manual concurrency config)',
          'No multi-region orchestration',
        ]}
      />
    </section>
  ),

  /* ---- Screen Guide ---------------------------------------------- */
  screens: (
    <section>
      <SectionHeading id="screens" icon={Building2} title="Screen Guide" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        AI Office Sim has 17 screens organized in a sidebar navigation. Each screen serves a
        specific function from real-time office visualization to strategy management.
      </p>

      <h3 id="office" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Virtual Office
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        3D isometric virtual office built with React Three Fiber.
      </p>
      <FeatureList
        items={[
          'Orthographic camera with pan, zoom, and rotate controls',
          'Agent avatars with status-driven colors (idle=green, working=cyan, error=red, approval=gold)',
          'Data flow particles stream from agents to the server room when working',
          '9 rooms: Open Workspace, Meeting Pod, Breakroom, Server Rack, Analysis, Data Lab, Marketing, Sales, Datacenter',
          'Click agent → Agent Inspector side panel with live action feed and quick controls',
          'Team Roster panel with status-sorted agent list',
        ]}
      />

      <h3 id="dashboard" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Dashboard
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Project-level analytics and status overview.
      </p>
      <FeatureList
        items={[
          'Agent count, active sessions, and fleet status at a glance',
          'Recent activity feed with tool calls and agent actions',
          'Cost and token usage summaries with trend indicators',
          'Quick-action buttons to trigger agents and view workflows',
        ]}
      />

      <h3 id="strategy-screen" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Strategy
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Define strategies, track KPIs, and review AI-generated insights.
      </p>
      <FeatureList
        items={[
          'Strategy types: growth, retention, brand, product with status tracking',
          'KPIs with current value, target value, unit, and direction per strategy',
          'Agent-generated learnings with confidence scores',
          'Actionable recommendations that can be applied or dismissed',
        ]}
      />

      <h3 id="calendar" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Calendar
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Schedule and track events, agent executions, and deadlines.
      </p>
      <FeatureList
        items={[
          'Calendar view with scheduled agent executions and workflow triggers',
          'Google Calendar integration via schedule_event and sync_google_calendar tools',
          'ATLAS can manage calendar events via the manage_calendar tool',
        ]}
      />

      <h3 id="devops-screen" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        DevOps
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Manage deployment requests, PR reviews, and infrastructure tasks.
      </p>
      <FeatureList
        items={[
          'Request types: deploy, PR review, rollback, infra change',
          'Metadata: branch, commit SHA, PR URL, environment, repo URL',
          'Review workflow: pending → in review → approved/rejected → deployed',
          'Human task board with priority levels (low, medium, high, urgent, critical)',
        ]}
      />

      <h3 id="community" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Community
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Community hub and marketplace for sharing templates and configurations.
      </p>
      <FeatureList
        items={[
          'Browse shared workflow templates and agent configurations',
          'Community-contributed content for common business use cases',
          'Template import with one-click setup',
        ]}
      />

      <h3 id="settings-screen" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Settings
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        8 configuration tabs for project and workspace management.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          'General', 'Members', 'Models', 'API Keys',
          'Tool Credentials', 'Billing', 'Notifications', 'Danger Zone',
        ].map((tab) => (
          <span key={tab} className="border border-border-default px-2 py-1 text-xs text-text-secondary">
            {tab}
          </span>
        ))}
      </div>
      <FeatureList
        items={[
          'General: project name, sector, accent color, language (en/pt-BR), timezone',
          'Members: team roster with roles (owner, admin, viewer), invite by email',
          'Models: per-use-case model selection (agent execution, ATLAS, embeddings)',
          'API Keys: encrypted Anthropic and OpenAI key management with validation',
          'Tool Credentials: OAuth2 for Google/RD Station, API keys for WhatsApp/Email providers',
          'Billing: current plan, resource usage meters, plan comparison grid',
          'Notifications: toggle controls for 6 event types (agent complete, error, approval, etc.)',
        ]}
      />

      <h3 id="onboarding-screen" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Onboarding
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        6-step animated setup wizard for first-time users.
      </p>
      <div className="mb-6 space-y-2">
        {[
          { step: '0', title: 'Welcome', desc: 'Animated typewriter intro with skip option' },
          { step: '1', title: 'Create Company & Project', desc: 'Company name and project name inputs' },
          { step: '2', title: 'Choose Template', desc: '22 industry/department templates with agent count display' },
          { step: '3', title: 'Set Up Integration', desc: 'WhatsApp (recommended), Email, or skip' },
          { step: '4', title: 'Create First Agent', desc: 'Name + archetype selector from 21 archetypes' },
          { step: '5', title: 'Done!', desc: 'Confetti animation + "Go to Office" button' },
        ].map((s) => (
          <div key={s.step} className="flex gap-3 border border-border-default bg-bg-base p-3">
            <span className="shrink-0 text-xs font-bold text-accent-cyan">{s.step}</span>
            <div>
              <p className="text-xs font-bold text-text-primary">{s.title}</p>
              <p className="text-[10px] text-text-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <LimitationList
        items={[
          'Virtual Office: single floor only, no drag-and-drop repositioning',
          'Community/Marketplace content is limited in alpha',
          'No mobile-optimized layouts for touch devices',
        ]}
      />
    </section>
  ),

  /* ---- Architecture ---------------------------------------------- */
  tech: (
    <section>
      <SectionHeading id="tech" icon={Layers} title="Architecture" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Built as a monorepo (Turborepo + pnpm) with clear separation between frontend, backend,
        AI engine, and infrastructure packages. Designed for real-time collaboration with
        Socket.IO and type-safe APIs end-to-end.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[
          {
            id: 'frontend',
            label: 'Frontend',
            items: [
              'Next.js 15 (App Router)',
              'Tailwind CSS v4',
              'Zustand (state management)',
              'Framer Motion (animations)',
              'next-intl (pt-BR / en-US)',
              'React Three Fiber (3D office)',
              'React Flow (workflow editor)',
            ],
          },
          {
            id: 'backend',
            label: 'Backend',
            items: [
              'tRPC v11 (type-safe API)',
              'Drizzle ORM',
              'PostgreSQL + pgvector',
              'BullMQ + Redis (job queue)',
              'Socket.IO (real-time)',
            ],
          },
          {
            id: 'ai-stack',
            label: 'AI',
            items: [
              'Claude (Anthropic) — agent execution & ATLAS',
              'OpenAI embeddings (text-embedding-3-small)',
              'Tool-use pattern with structured I/O',
              'RAG pipeline (chunk → embed → search)',
              'Agentic loop with multi-iteration reasoning',
            ],
          },
          {
            id: 'infrastructure',
            label: 'Infrastructure',
            items: [
              'Vercel (frontend hosting)',
              'Render (backend worker)',
              'Neon (PostgreSQL)',
              'Upstash (Redis)',
              'Clerk (auth & SSO)',
              'Stripe (billing)',
            ],
          },
        ].map((group) => (
          <div key={group.label} id={group.id} className="border border-border-default bg-bg-base p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-cyan">
              {group.label}
            </h4>
            <ul className="space-y-1 text-sm text-text-secondary">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-text-disabled">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 id="security" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Security
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Security measures built into every layer.
      </p>
      <FeatureList
        items={[
          'Clerk authentication with JWT verification on every API call',
          'API keys encrypted at rest — never displayed in full after saving',
          'RBAC enforcement at the tRPC middleware level',
          'Webhook signature verification (HMAC-SHA256/SHA1)',
          'Project-scoped data isolation — no cross-tenant access',
          'PII masking for sensitive Brazilian documents',
        ]}
      />

      <h3 id="realtime" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Real-time
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Live updates powered by Socket.IO.
      </p>
      <FeatureList
        items={[
          'Socket.IO server on the backend worker for real-time events',
          'Agent status updates pushed to connected clients',
          'Workflow execution progress streamed in real time',
          'ATLAS streaming responses with token-by-token delivery',
          'Office agent avatar state synchronized across sessions',
        ]}
      />
    </section>
  ),

  /* ---- Billing & Plans ------------------------------------------- */
  billing: (
    <section>
      <SectionHeading id="billing" icon={CreditCard} title="Billing & Plans" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        AI Office Sim offers tiered plans with resource limits. Payment is handled via Stripe
        with Brazil-specific options. Token usage is tracked per agent with real-time cost visibility.
      </p>

      <QuickStart
        steps={[
          'Go to Settings → Billing to view your current plan',
          'Compare plans in the plan comparison grid (monthly/annual toggle)',
          'Choose a plan and select a payment method (card, PIX, or boleto)',
          'Resource limits (agents, workflows, projects) adjust automatically',
        ]}
      />

      <h3 id="plans" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Plans
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Four tiers with increasing resource limits.
      </p>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { plan: 'Starter', projects: '1', agents: '3', workflows: '5' },
          { plan: 'Growth', projects: '5', agents: '10', workflows: '25' },
          { plan: 'Pro', projects: '20', agents: '50', workflows: '100' },
          { plan: 'Enterprise', projects: '∞', agents: '∞', workflows: '∞' },
        ].map((tier) => (
          <div
            key={tier.plan}
            className="border border-border-default bg-bg-base p-4"
          >
            <p className="mb-3 text-sm font-bold text-accent-cyan">{tier.plan}</p>
            <div className="space-y-1 text-xs text-text-secondary">
              <p>{tier.projects} projects</p>
              <p>{tier.agents} agents</p>
              <p>{tier.workflows} workflows</p>
            </div>
          </div>
        ))}
      </div>

      <h3 id="payment-methods" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Payment Methods
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Multiple payment options with Brazil-specific support.
      </p>
      <FeatureList
        items={[
          'Credit card (global)',
          'PIX instant payment (Brazil)',
          'Boleto bancário — annual plans only (Brazil)',
          'Currencies: USD and BRL with locale-aware pricing',
        ]}
      />

      <h3 id="usage" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Usage & Tokens
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Track token usage and costs across your fleet.
      </p>
      <FeatureList
        items={[
          'Per-agent token usage tracking (input + output tokens)',
          'Cost breakdown by model tier (Haiku, Sonnet, Opus)',
          'Resource usage meters: projects, agents, and workflows vs plan limits',
          'Invoice history table with PDF download',
          'Fleet-level cost reports via ATLAS',
        ]}
      />

      <LimitationList
        items={[
          'Stripe integration is in stub mode for alpha (requires STRIPE_SECRET_KEY)',
          'No usage-based billing yet — plan-based limits only',
        ]}
      />
    </section>
  ),

  /* ---- Roadmap --------------------------------------------------- */
  roadmap: (
    <section>
      <SectionHeading id="roadmap" icon={Map} title="Roadmap" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Upcoming features and expansion plans for AI Office Sim. The platform roadmap is organized
        into focused initiatives across localization, tools, enterprise, and compliance.
      </p>

      <h3 id="upcoming" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Upcoming Features
      </h3>
      <div className="mb-6 space-y-3">
        {[
          {
            title: 'Custom Tool Builder',
            desc: 'Let users define their own tools with custom API endpoints, schemas, and approval rules — no code required.',
            status: 'Planned',
          },
          {
            title: 'Marketplace',
            desc: 'Share and discover workflow templates, agent configurations, and custom tools created by the community.',
            status: 'Planned',
          },
          {
            title: 'Multi-model Routing',
            desc: 'Automatically route agent tasks to the optimal model based on complexity, cost, and latency requirements.',
            status: 'Planned',
          },
          {
            title: 'Advanced Analytics Dashboard',
            desc: 'KPI trend charts, agent performance comparisons, cost forecasting, and historical analysis.',
            status: 'Planned',
          },
        ].map((item) => (
          <div key={item.title} className="border border-border-default bg-bg-base p-4">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-xs font-bold text-text-primary">{item.title}</p>
              <span className="border border-text-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {item.status}
              </span>
            </div>
            <p className="text-xs text-text-muted">{item.desc}</p>
          </div>
        ))}
      </div>

      <h3 id="latam" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        LatAm Expansion
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Deepening support for Latin American markets.
      </p>
      <FeatureList
        items={[
          'Spanish language support (es-MX, es-AR, es-CO)',
          'Additional payment gateways for Latin American markets',
          'Tax and compliance tools for Mexico, Argentina, and Colombia',
          'Region-specific workflow templates for LatAm business practices',
        ]}
      />

      <h3 id="enterprise" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Enterprise & Compliance
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Enterprise-grade features and international compliance.
      </p>
      <FeatureList
        items={[
          'GDPR compliance for European Union deployment',
          'SSO/SAML integration for enterprise identity providers',
          'Dedicated infrastructure options for data residency requirements',
          'Advanced RBAC with custom role definitions and granular permissions',
          'SLA-backed uptime guarantees and priority support',
        ]}
      />
    </section>
  ),

  /* ---- Agents & Capabilities ------------------------------------- */
  'agent-capabilities': agentCapabilitiesContent,
};
