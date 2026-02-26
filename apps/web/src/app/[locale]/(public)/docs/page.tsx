import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Bot,
  Workflow,
  MessageSquare,
  Mail,
  Search,
  ShieldCheck,
  Database,
  FileText,
  BarChart3,
  Users,
  Wrench,
  Clock,
  Terminal,
  Zap,
  AlertTriangle,
  BookOpen,
  CreditCard,
  Globe,
  Layers,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-accent-cyan bg-accent-cyan-dim px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
      {children}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: 'done' | 'partial' | 'stub' | 'planned';
}) {
  const colors = {
    done: 'border-status-success text-status-success',
    partial: 'border-status-warning text-status-warning',
    stub: 'border-status-error text-status-error',
    planned: 'border-text-muted text-text-muted',
  };
  const labels = {
    done: 'Complete',
    partial: 'Partial',
    stub: 'Stub',
    planned: 'Planned',
  };
  return (
    <span
      className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function SectionHeading({
  id,
  icon: Icon,
  title,
  status,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status?: 'done' | 'partial' | 'stub' | 'planned';
}) {
  return (
    <h2
      id={id}
      className="mb-4 flex items-center gap-3 border-b border-border-default pb-3 text-xl font-bold text-text-primary"
    >
      <Icon className="h-5 w-5 text-accent-cyan" />
      {title}
      {status && (
        <span className="ml-auto">
          <StatusBadge status={status} />
        </span>
      )}
    </h2>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mb-6 space-y-1.5 text-sm text-text-secondary">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-accent-cyan">{'>'}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function LimitationList({ items }: { items: string[] }) {
  return (
    <div className="mb-6 border border-border-default bg-bg-base p-4">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-status-warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        Current Limitations
      </p>
      <ul className="space-y-1 text-sm text-text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-text-disabled">-</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table of Contents                                                  */
/* ------------------------------------------------------------------ */

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'tools', label: 'Tools & Integrations' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'documents', label: 'Documents & RAG' },
  { id: 'wiki', label: 'Wiki' },
  { id: 'approvals', label: 'Approval System' },
  { id: 'tasks', label: 'Task Management' },
  { id: 'strategies', label: 'Strategies & KPIs' },
  { id: 'billing', label: 'Billing & Plans' },
  { id: 'tech', label: 'Tech Stack' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-bg-deepest text-text-primary">
      {/* Header */}
      <nav className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-mono text-sm font-bold text-accent-cyan">
          Documentation
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-up"
            className="border border-accent-cyan bg-accent-cyan-dim px-4 py-1.5 font-mono text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan hover:text-bg-deepest"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Terminal className="h-6 w-6 text-accent-cyan" />
            <Badge>v0.1 alpha</Badge>
          </div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            AI Office <span className="text-accent-cyan">Sim</span> — Docs
          </h1>
          <p className="text-text-secondary">
            Everything you need to know about setting up and running your AI-powered virtual office.
          </p>
        </div>

        {/* TOC */}
        <div className="mb-16 border border-border-default bg-bg-base p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-accent-cyan">
            Table of Contents
          </h2>
          <div className="grid gap-1 sm:grid-cols-2">
            {toc.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex gap-2 py-1 font-mono text-sm text-text-secondary transition-colors hover:text-accent-cyan"
              >
                <span className="text-text-disabled">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  SECTIONS                                                 */}
        {/* -------------------------------------------------------- */}

        {/* Overview */}
        <section className="mb-16">
          <SectionHeading id="overview" icon={Globe} title="Overview" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            AI Office Sim is a virtual office platform where AI agents work autonomously on real business tasks.
            You create agents, assign them roles and tools, and they execute tasks — from sending WhatsApp messages
            to managing CRM contacts, writing emails, analyzing spreadsheets, and more.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-text-secondary">
            Think of it as a fully staffed office that runs 24/7, powered by Claude (Anthropic) with
            built-in approval workflows so you stay in control of high-risk actions.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-border-default bg-bg-base p-4">
              <p className="mb-1 text-2xl font-bold text-accent-cyan">19</p>
              <p className="text-xs text-text-muted">Agent archetypes</p>
            </div>
            <div className="border border-border-default bg-bg-base p-4">
              <p className="mb-1 text-2xl font-bold text-accent-cyan">21+</p>
              <p className="text-xs text-text-muted">Built-in tools</p>
            </div>
            <div className="border border-border-default bg-bg-base p-4">
              <p className="mb-1 text-2xl font-bold text-accent-cyan">5</p>
              <p className="text-xs text-text-muted">External integrations</p>
            </div>
          </div>
        </section>

        {/* AI Agents */}
        <section className="mb-16">
          <SectionHeading id="agents" icon={Bot} title="AI Agents" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Agents are the core of AI Office Sim. Each agent has a role, a set of tools, memory, and configurable
            behavior. They can be triggered manually, on a schedule, by events, or by other agents.
          </p>

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Archetypes
          </h3>
          <p className="mb-3 text-sm text-text-secondary">
            Pre-configured agent templates for common business roles:
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              'Support', 'Sales', 'Marketing', 'Data Analyst', 'Content Writer',
              'Developer', 'Project Manager', 'HR', 'Finance', 'Email Campaign Manager',
              'Research', 'Recruiter', 'Social Media', 'Mercado Livre', 'Inventory Monitor',
              'Legal Research', 'Ad Analyst', 'Account Manager', 'Deployment Monitor', 'Custom',
            ].map((a) => (
              <span
                key={a}
                className="border border-border-default px-2 py-1 text-xs text-text-secondary"
              >
                {a}
              </span>
            ))}
          </div>

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Capabilities
          </h3>
          <FeatureList
            items={[
              'Configure LLM model, temperature, max tokens, and budget per agent',
              'Assign any combination of 21+ tools per agent',
              'Persistent memory (key-value store with semantic search)',
              'Trigger modes: manual, scheduled (cron), event-driven, agent-chained, always-on',
              'Per-agent safety limits: max actions per session, token budgets, cost tracking',
              'Bilingual system prompts (English & Portuguese)',
              'Team assignment: development, research, marketing, sales, support, finance, operations',
            ]}
          />

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Agent Memory
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Each agent has persistent memory that survives across sessions. Memory is stored as key-value pairs
            with JSONB values, and supports semantic search via pgvector embeddings for recall.
          </p>

          <LimitationList
            items={[
              'No direct agent-to-agent messaging (async triggers only)',
              'Semantic memory search is basic (full vector similarity coming soon)',
              'No agent team hierarchy or permission scoping',
            ]}
          />
        </section>

        {/* Tools & Integrations */}
        <section className="mb-16">
          <SectionHeading id="tools" icon={Wrench} title="Tools & Integrations" status="partial" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Tools are the actions agents can perform. Each tool has defined inputs, outputs, and an optional
            approval requirement. Tools are registered in a central registry and can be assigned to any agent.
          </p>

          <div className="mb-6 space-y-4">
            {[
              {
                category: 'Core',
                tools: [
                  { name: 'get_current_time', desc: 'Returns ISO 8601 timestamp with timezone' },
                  { name: 'search_company_memory', desc: 'Semantic search over uploaded documents (RAG)' },
                  { name: 'log_message', desc: 'Structured logging (info, warning, error levels)' },
                  { name: 'search_web', desc: 'Web search for real-time information' },
                ],
              },
              {
                category: 'WhatsApp',
                tools: [
                  { name: 'send_whatsapp_message', desc: 'Send message to a contact (requires approval)' },
                  { name: 'read_whatsapp_messages', desc: 'Fetch conversation history with a contact' },
                ],
              },
              {
                category: 'Email',
                tools: [
                  { name: 'send_email', desc: 'Send email with HTML body and attachments (requires approval)' },
                  { name: 'read_email', desc: 'Read emails from inbox via IMAP' },
                ],
              },
              {
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
                category: 'Google Sheets',
                tools: [
                  { name: 'read_spreadsheet', desc: 'Fetch cell ranges from a spreadsheet' },
                  { name: 'write_spreadsheet', desc: 'Update specific cells' },
                  { name: 'append_to_spreadsheet', desc: 'Append new rows to a sheet' },
                ],
              },
              {
                category: 'Finance (Brazil)',
                tools: [
                  { name: 'monitor_pix_transactions', desc: 'Track PIX instant payments' },
                  { name: 'check_nfe_status', desc: 'Check NFe invoice status' },
                ],
              },
              {
                category: 'DevOps',
                tools: [
                  { name: 'create_deploy_request', desc: 'Request a deployment to an environment' },
                  { name: 'create_pr_review_request', desc: 'Request code review on a PR' },
                  { name: 'create_human_task', desc: 'Create a task for a human team member' },
                ],
              },
            ].map((group) => (
              <div key={group.category} className="border border-border-default bg-bg-base p-4">
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
              'Web search has limited implementation',
              'No native Slack, GitHub API, or database query tools yet',
              'Google Sheets and RD Station require OAuth2 credential setup',
            ]}
          />
        </section>

        {/* Workflows */}
        <section className="mb-16">
          <SectionHeading id="workflows" icon={Workflow} title="Workflows" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Workflows let you chain multiple agent tasks into automated pipelines using a visual graph editor
            (React Flow). Each node in the graph represents an agent executing a specific task.
          </p>

          <FeatureList
            items={[
              'Visual drag-and-drop workflow editor',
              'Each node assigns a task to a specific agent',
              'Execution tracking per node: input, output, status, duration',
              'Workflow-level status: running, completed, failed, cancelled',
              'Activate/deactivate workflows without deleting',
              'Resource limits enforced per plan (e.g. 5 workflows on Starter)',
            ]}
          />

          <LimitationList
            items={[
              'Sequential execution only — no parallel branches',
              'No conditional logic (if/else nodes)',
              'No scheduled triggers — manual execution only',
              'No loop/retry nodes',
            ]}
          />
        </section>

        {/* WhatsApp */}
        <section className="mb-16">
          <SectionHeading id="whatsapp" icon={MessageSquare} title="WhatsApp Integration" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Connect your WhatsApp Business number and let agents send/receive messages. Supports three providers
            with automatic webhook handling for incoming messages.
          </p>

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Supported Providers
          </h3>
          <div className="mb-6 flex gap-3">
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
              'Bi-directional messaging: send outbound + receive inbound via webhooks',
              'Message status tracking: pending, sent, delivered, read, failed',
              'Contact name and phone indexing',
              'Pre-approved message templates (Meta Cloud API compliance)',
              'Webhook signature verification (HMAC-SHA256/SHA1, Bearer token)',
              'Default handler agent per connection for auto-responses',
              'Media URL support for images and files',
            ]}
          />

          <LimitationList
            items={[
              'No WhatsApp group support',
              'Media via URL only — no direct file uploads',
              'No typing indicators or read receipts',
            ]}
          />
        </section>

        {/* Email */}
        <section className="mb-16">
          <SectionHeading id="email" icon={Mail} title="Email Integration" status="partial" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Send emails through your preferred provider. Supports rich HTML content, attachments, and templates.
          </p>

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Supported Providers
          </h3>
          <div className="mb-6 flex gap-3">
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
              'Reusable email templates (transactional & marketing types)',
              'To, CC, BCC recipient support',
              'Message status tracking: pending, sent, delivered, bounced, failed',
              'IMAP inbox reading (configurable host/port/credentials)',
            ]}
          />

          <LimitationList
            items={[
              'Inbound email reading is a stub (not fully implemented)',
              'No calendar or meeting scheduling integration',
            ]}
          />
        </section>

        {/* Documents & RAG */}
        <section className="mb-16">
          <SectionHeading id="documents" icon={FileText} title="Documents & RAG" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Upload documents to build a company knowledge base. Agents can search it using semantic similarity
            (RAG — Retrieval-Augmented Generation) to answer questions with real company data.
          </p>

          <FeatureList
            items={[
              'Document sources: upload, web, API, or agent-generated',
              'Automatic chunking and embedding with OpenAI text-embedding-3-small (1536 dimensions)',
              'Cosine similarity search via pgvector for fast retrieval',
              'Agents access knowledge via the search_company_memory tool',
              'Metadata and source URL tracking per document',
            ]}
          />

          <LimitationList
            items={[
              'Auto-ingestion pipeline not yet implemented (manual chunking only)',
              'No document versioning',
              'Large document corpuses may have slower query times',
            ]}
          />
        </section>

        {/* Wiki */}
        <section className="mb-16">
          <SectionHeading id="wiki" icon={BookOpen} title="Wiki & Knowledge Base" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Organize company knowledge into a structured wiki with hierarchical categories and articles.
            Teams can document processes, policies, and reference material.
          </p>

          <FeatureList
            items={[
              'Hierarchical categories (up to 3 levels deep)',
              'Articles with title, summary, content, and tags',
              'Attach existing documents to articles for RAG integration',
              'Custom icons and sort order per category',
            ]}
          />

          <LimitationList
            items={[
              'No article version history',
              'No draft/published workflow',
              'No comments or discussions on articles',
            ]}
          />
        </section>

        {/* Approval System */}
        <section className="mb-16">
          <SectionHeading id="approvals" icon={ShieldCheck} title="Approval System" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Stay in control of what your agents do. The approval system lets you define rules for which
            agent + tool combinations require human review before execution.
          </p>

          <FeatureList
            items={[
              'Per-agent, per-tool approval rules: always allow, always block, or require approval',
              'Risk level classification: low, medium, high, critical',
              'Approval requests pause agent execution until reviewed',
              'Review with optional comments (approve or reject)',
              'Full action context: tool name, input payload, agent identity',
            ]}
          />

          <LimitationList
            items={[
              'Binary approve/reject only — no escalation paths',
              'No time-based expiration on pending approvals',
              'No approval delegation or notification routing',
            ]}
          />
        </section>

        {/* Task Management */}
        <section className="mb-16">
          <SectionHeading id="tasks" icon={Clock} title="Task Management" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Agents can create tasks for human team members when work requires manual action. Tasks integrate
            with the DevOps request system for deployments and code reviews.
          </p>

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Human Tasks
          </h3>
          <FeatureList
            items={[
              'Priority levels: low, medium, high, urgent',
              'Status tracking: todo, in progress, done',
              'Agent context: why the task was created and what\'s needed',
              'Assignee management and due dates',
            ]}
          />

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            DevOps Requests
          </h3>
          <FeatureList
            items={[
              'Request types: deploy, PR review, rollback, infra change',
              'Metadata: branch, commit SHA, PR URL, environment, repo URL',
              'Review workflow: pending → in review → approved/rejected → deployed',
              'Priority levels: low, medium, high, critical',
            ]}
          />

          <LimitationList
            items={[
              'No task dependencies or subtasks',
              'No sprint or planning features',
            ]}
          />
        </section>

        {/* Strategies & KPIs */}
        <section className="mb-16">
          <SectionHeading id="strategies" icon={BarChart3} title="Strategies & KPIs" status="done" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Define business strategies and track progress with KPIs. Agents can generate insights
            and recommendations as they observe data and outcomes.
          </p>

          <FeatureList
            items={[
              'Strategy types: growth, retention, brand, product',
              'Status tracking: planned, active, at risk, completed',
              'AI-refined strategy text (user draft + AI improvement)',
              'KPI tracking with current value, target, unit, and direction',
              'Agent-generated learnings with confidence scores',
              'Apply/dismiss agent recommendations',
            ]}
          />

          <LimitationList
            items={[
              'Insights are manually triggered — no automatic generation yet',
              'No KPI trend charts or historical analysis',
              'No strategy comparison dashboard',
            ]}
          />
        </section>

        {/* Billing & Plans */}
        <section className="mb-16">
          <SectionHeading id="billing" icon={CreditCard} title="Billing & Plans" status="partial" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            AI Office Sim offers tiered plans with resource limits. Payment is handled via Stripe
            with Brazil-specific options.
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

          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            Payment Methods
          </h3>
          <FeatureList
            items={[
              'Credit card (global)',
              'PIX instant payment (Brazil)',
              'Boleto bancário — annual plans only (Brazil)',
              'Currencies: USD and BRL',
            ]}
          />

          <LimitationList
            items={[
              'Stripe integration is in stub mode for alpha',
              'No usage-based billing yet',
              'No free trial period management',
            ]}
          />
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <SectionHeading id="tech" icon={Layers} title="Tech Stack" />
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Built as a monorepo (Turborepo + pnpm) with clear separation between frontend, backend,
            AI engine, and infrastructure packages.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Frontend',
                items: ['Next.js 15', 'Tailwind CSS v4', 'Zustand', 'Framer Motion', 'next-intl (pt-BR / en-US)'],
              },
              {
                label: 'Backend',
                items: ['tRPC v11', 'Drizzle ORM', 'PostgreSQL + pgvector', 'BullMQ + Redis', 'Socket.IO'],
              },
              {
                label: 'AI',
                items: ['Claude (Anthropic)', 'OpenAI embeddings', 'Tool-use pattern', 'RAG pipeline'],
              },
              {
                label: 'Infrastructure',
                items: ['Clerk (auth)', 'Stripe (billing)', 'Vercel (hosting)', 'Turborepo + pnpm'],
              },
            ].map((group) => (
              <div key={group.label} className="border border-border-default bg-bg-base p-4">
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
        </section>

        {/* CTA */}
        <div className="border border-border-default bg-bg-base p-8 text-center">
          <p className="mb-4 text-lg font-bold text-text-primary">Ready to try it?</p>
          <p className="mb-6 text-sm text-text-secondary">
            Create your AI office in minutes. No credit card required for alpha.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 border border-accent-cyan bg-accent-cyan-dim px-8 py-3 font-mono text-sm font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan hover:text-bg-deepest"
          >
            Get Started
            <Zap className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-border-subtle px-6 py-8 text-center text-xs text-text-muted">
        AI Office Sim — alpha build
        <div className="mt-2 text-text-disabled">Powered by Axis Brasil</div>
      </div>
    </div>
  );
}
