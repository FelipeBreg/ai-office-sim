import {
  Bot,
  Workflow,
  MessageSquare,
  Mail,
  ShieldCheck,
  FileText,
  BarChart3,
  Wrench,
  Clock,
  AlertTriangle,
  BookOpen,
  CreditCard,
  Globe,
  Layers,
  Radio,
  Activity,
  Building2,
  Settings,
  HelpCircle,
  Compass,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

export function StatusBadge({
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

export function FeatureList({ items }: { items: string[] }) {
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

export function LimitationList({ items }: { items: string[] }) {
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
/*  TOC structure                                                      */
/* ------------------------------------------------------------------ */

export interface DocSubtopic {
  id: string;
  label: string;
}

export interface DocTopic {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtopics?: DocSubtopic[];
}

export const topics: DocTopic[] = [
  { slug: 'overview', label: 'Overview', icon: Globe },
  {
    slug: 'agents',
    label: 'AI Agents',
    icon: Bot,
    subtopics: [
      { id: 'archetypes', label: 'Archetypes' },
      { id: 'capabilities', label: 'Capabilities' },
      { id: 'agent-memory', label: 'Agent Memory' },
    ],
  },
  {
    slug: 'tools',
    label: 'Tools & Integrations',
    icon: Wrench,
    subtopics: [
      { id: 'core', label: 'Core' },
      { id: 'whatsapp-tools', label: 'WhatsApp' },
      { id: 'email-tools', label: 'Email' },
      { id: 'crm', label: 'CRM' },
      { id: 'google-sheets', label: 'Google Sheets' },
      { id: 'finance', label: 'Finance' },
      { id: 'devops', label: 'DevOps' },
    ],
  },
  { slug: 'workflows', label: 'Workflows', icon: Workflow },
  {
    slug: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageSquare,
    subtopics: [
      { id: 'providers', label: 'Providers' },
      { id: 'features', label: 'Features' },
    ],
  },
  {
    slug: 'email',
    label: 'Email',
    icon: Mail,
    subtopics: [
      { id: 'email-providers', label: 'Providers' },
      { id: 'email-features', label: 'Features' },
    ],
  },
  { slug: 'documents', label: 'Documents & RAG', icon: FileText },
  { slug: 'wiki', label: 'Wiki & Knowledge Base', icon: BookOpen },
  { slug: 'approvals', label: 'Approval System', icon: ShieldCheck },
  {
    slug: 'tasks',
    label: 'Task Management',
    icon: Clock,
    subtopics: [
      { id: 'human-tasks', label: 'Human Tasks' },
      { id: 'devops-requests', label: 'DevOps Requests' },
    ],
  },
  { slug: 'strategies', label: 'Strategies & KPIs', icon: BarChart3 },
  {
    slug: 'billing',
    label: 'Billing & Plans',
    icon: CreditCard,
    subtopics: [
      { id: 'plans', label: 'Plans' },
      { id: 'payment-methods', label: 'Payment Methods' },
    ],
  },
  {
    slug: 'atlas',
    label: 'ATLAS',
    icon: Radio,
    subtopics: [
      { id: 'atlas-orb', label: 'Orb Visualization' },
      { id: 'atlas-conversation', label: 'Conversation' },
      { id: 'atlas-states', label: 'States' },
    ],
  },
  {
    slug: 'activity',
    label: 'Activity Log',
    icon: Activity,
    subtopics: [
      { id: 'activity-list', label: 'Log List' },
      { id: 'activity-detail', label: 'Action Detail' },
      { id: 'activity-session', label: 'Session Timeline' },
    ],
  },
  {
    slug: 'office',
    label: 'Virtual Office',
    icon: Building2,
    subtopics: [
      { id: 'office-agents', label: 'Agent Avatars' },
      { id: 'office-rooms', label: 'Rooms & Departments' },
      { id: 'office-inspector', label: 'Agent Inspector' },
    ],
  },
  {
    slug: 'settings',
    label: 'Settings',
    icon: Settings,
    subtopics: [
      { id: 'settings-general', label: 'General' },
      { id: 'settings-members', label: 'Members' },
      { id: 'settings-billing', label: 'Billing' },
      { id: 'settings-notifications', label: 'Notifications' },
    ],
  },
  {
    slug: 'help',
    label: 'Help Center',
    icon: HelpCircle,
    subtopics: [
      { id: 'help-quickstart', label: 'Quick Start' },
      { id: 'help-playbook', label: 'Alpha Playbook' },
    ],
  },
  {
    slug: 'onboarding',
    label: 'Onboarding',
    icon: Compass,
    subtopics: [
      { id: 'onboarding-steps', label: 'Setup Steps' },
      { id: 'onboarding-templates', label: 'Templates' },
    ],
  },
  {
    slug: 'tech',
    label: 'Tech Stack',
    icon: Layers,
    subtopics: [
      { id: 'frontend', label: 'Frontend' },
      { id: 'backend', label: 'Backend' },
      { id: 'ai-stack', label: 'AI' },
      { id: 'infrastructure', label: 'Infrastructure' },
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
  ),

  /* ---- AI Agents ------------------------------------------------- */
  agents: (
    <section>
      <SectionHeading id="agents" icon={Bot} title="AI Agents" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Agents are the core of AI Office Sim. Each agent has a role, a set of tools, memory, and configurable
        behavior. They can be triggered manually, on a schedule, by events, or by other agents.
      </p>

      <h3 id="archetypes" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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

      <h3 id="capabilities" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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

      <h3 id="agent-memory" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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
  ),

  /* ---- Tools & Integrations -------------------------------------- */
  tools: (
    <section>
      <SectionHeading id="tools" icon={Wrench} title="Tools & Integrations" status="partial" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Tools are the actions agents can perform. Each tool has defined inputs, outputs, and an optional
        approval requirement. Tools are registered in a central registry and can be assigned to any agent.
      </p>

      <div className="mb-6 space-y-4">
        {[
          {
            id: 'core',
            category: 'Core',
            tools: [
              { name: 'get_current_time', desc: 'Returns ISO 8601 timestamp with timezone' },
              { name: 'search_company_memory', desc: 'Semantic search over uploaded documents (RAG)' },
              { name: 'log_message', desc: 'Structured logging (info, warning, error levels)' },
              { name: 'search_web', desc: 'Web search for real-time information' },
            ],
          },
          {
            id: 'whatsapp-tools',
            category: 'WhatsApp',
            tools: [
              { name: 'send_whatsapp_message', desc: 'Send message to a contact (requires approval)' },
              { name: 'read_whatsapp_messages', desc: 'Fetch conversation history with a contact' },
            ],
          },
          {
            id: 'email-tools',
            category: 'Email',
            tools: [
              { name: 'send_email', desc: 'Send email with HTML body and attachments (requires approval)' },
              { name: 'read_email', desc: 'Read emails from inbox via IMAP' },
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
            id: 'google-sheets',
            category: 'Google Sheets',
            tools: [
              { name: 'read_spreadsheet', desc: 'Fetch cell ranges from a spreadsheet' },
              { name: 'write_spreadsheet', desc: 'Update specific cells' },
              { name: 'append_to_spreadsheet', desc: 'Append new rows to a sheet' },
            ],
          },
          {
            id: 'finance',
            category: 'Finance (Brazil)',
            tools: [
              { name: 'monitor_pix_transactions', desc: 'Track PIX instant payments' },
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
          'Web search has limited implementation',
          'No native Slack, GitHub API, or database query tools yet',
          'Google Sheets and RD Station require OAuth2 credential setup',
        ]}
      />
    </section>
  ),

  /* ---- Workflows ------------------------------------------------- */
  workflows: (
    <section>
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
  ),

  /* ---- WhatsApp -------------------------------------------------- */
  whatsapp: (
    <section>
      <SectionHeading id="whatsapp" icon={MessageSquare} title="WhatsApp Integration" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Connect your WhatsApp Business number and let agents send/receive messages. Supports three providers
        with automatic webhook handling for incoming messages.
      </p>

      <h3 id="providers" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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

      <h3 id="features" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Features
      </h3>
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
  ),

  /* ---- Email ----------------------------------------------------- */
  email: (
    <section>
      <SectionHeading id="email" icon={Mail} title="Email Integration" status="partial" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Send emails through your preferred provider. Supports rich HTML content, attachments, and templates.
      </p>

      <h3 id="email-providers" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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

      <h3 id="email-features" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Features
      </h3>
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
  ),

  /* ---- Documents & RAG ------------------------------------------- */
  documents: (
    <section>
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
  ),

  /* ---- Wiki ------------------------------------------------------ */
  wiki: (
    <section>
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
  ),

  /* ---- Approval System ------------------------------------------- */
  approvals: (
    <section>
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
  ),

  /* ---- Task Management ------------------------------------------- */
  tasks: (
    <section>
      <SectionHeading id="tasks" icon={Clock} title="Task Management" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Agents can create tasks for human team members when work requires manual action. Tasks integrate
        with the DevOps request system for deployments and code reviews.
      </p>

      <h3 id="human-tasks" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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

      <h3 id="devops-requests" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
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
  ),

  /* ---- Strategies & KPIs ----------------------------------------- */
  strategies: (
    <section>
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
  ),

  /* ---- Billing & Plans ------------------------------------------- */
  billing: (
    <section>
      <SectionHeading id="billing" icon={CreditCard} title="Billing & Plans" status="partial" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        AI Office Sim offers tiered plans with resource limits. Payment is handled via Stripe
        with Brazil-specific options.
      </p>

      <div id="plans" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
  ),

  /* ---- ATLAS ----------------------------------------------------- */
  atlas: (
    <section>
      <SectionHeading id="atlas" icon={Radio} title="ATLAS — Agent Tracking & Live Advisory System" status="partial" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        ATLAS is an interactive AI advisory interface that lets you query your project using voice or text.
        It provides business intelligence insights through a conversational orb-based UI powered by Claude.
      </p>

      <h3 id="atlas-orb" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Orb Visualization
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        A canvas-based animated orb that visually represents ATLAS&apos;s current state with dynamic effects:
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

      <h3 id="atlas-conversation" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Conversation
      </h3>
      <FeatureList
        items={[
          'Dual input: microphone button for voice or text field for typing',
          'Transcript panel with auto-scrolling message history and timestamps',
          'Starter suggestions: MRR status, risk assessment, weekly priorities',
          'User and ATLAS messages visually distinct (right-aligned vs cyan-bordered)',
          'Mute toggle, reset button, and volume controls',
        ]}
      />

      <h3 id="atlas-states" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        State Machine
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        ATLAS cycles through four states with full UI feedback:
      </p>
      <FeatureList
        items={[
          'idle → listening (mic click or text input)',
          'listening → thinking (processing query, ~1.5s)',
          'thinking → speaking (delivering response, 2–4s)',
          'speaking → idle (ready for next query)',
        ]}
      />

      <LimitationList
        items={[
          'Voice recognition is UI-only — no actual speech-to-text yet',
          'Responses are mock data with keyword matching (not live AI)',
          'No real-time project data analysis — hardcoded demo insights',
          'No audio playback during speaking state',
        ]}
      />
    </section>
  ),

  /* ---- Activity Log ----------------------------------------------- */
  activity: (
    <section>
      <SectionHeading id="activity" icon={Activity} title="Activity Log" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        A real-time monitoring dashboard that tracks all agent actions, API calls, LLM responses,
        and approval requests within your project. All data is live from the database — no mocks.
      </p>

      <h3 id="activity-list" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Log List
      </h3>
      <FeatureList
        items={[
          'Paginated table (50 items per page, max 100) with relative timestamps',
          'Filter by agent or by status (pending, completed, failed, cancelled)',
          'Three action types tracked: Tool Call, LLM Response, Approval Request',
          'Per-action metrics: tokens used, duration (ms), cost (USD), status',
          'Click any row to open the detail drawer',
        ]}
      />

      <h3 id="activity-detail" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Action Detail
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        A slide-in side panel (400px) showing full context for any action:
      </p>
      <FeatureList
        items={[
          'Agent name, session ID, action type, tool name, and status',
          'Token count, duration, and cost breakdown',
          'Full input and output payloads as formatted JSON',
          'Error messages highlighted in red when present',
          '"View Session" link to jump to the session timeline',
        ]}
      />

      <h3 id="activity-session" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Session Timeline
      </h3>
      <FeatureList
        items={[
          'Vertical timeline showing all actions within a single agent session',
          'Color-coded nodes: green (completed), red (failed), cyan (pending)',
          'Collapsible payloads for LLM responses and tool call I/O',
          'Back button to return to the main log list',
        ]}
      />

      <LimitationList
        items={[
          'No real-time streaming — requires manual refresh for new logs',
          'No aggregate analytics (success rate, avg tokens, total cost)',
          'No CSV/JSON export',
          'No date range picker in the UI (available via query params only)',
        ]}
      />
    </section>
  ),

  /* ---- Virtual Office ---------------------------------------------- */
  office: (
    <section>
      <SectionHeading id="office" icon={Building2} title="Virtual Office" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        A 3D isometric virtual office built with React Three Fiber where your AI agents are
        visualized working in real time. Orthographic camera with pan, zoom, and rotate controls.
      </p>

      <h3 id="office-agents" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Agent Avatars
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Agents are rendered as capsule-shaped avatars with status-driven colors and animations:
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { status: 'Idle', color: '#00FF88', desc: 'Subtle breathing bob' },
          { status: 'Working', color: '#00C8FF', desc: 'Pulsing cyan glow' },
          { status: 'Error', color: '#FF4444', desc: 'Fast red pulse' },
          { status: 'Awaiting Approval', color: '#FFD700', desc: 'Steady gold glow' },
          { status: 'Offline', color: '#666666', desc: 'Dim appearance' },
        ].map((s) => (
          <div key={s.status} className="flex items-center gap-3 border border-border-default bg-bg-base p-3">
            <span
              className="inline-block h-3 w-3 shrink-0"
              style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }}
            />
            <div>
              <p className="text-xs font-bold text-text-primary">{s.status}</p>
              <p className="text-[10px] text-text-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <FeatureList
        items={[
          'Floating name labels above each agent',
          'Hover and click interactions (scale boost + glow)',
          'Data flow particles: cyan streams from agents to server room when working',
          'Agents assigned to desk slots by team affiliation',
        ]}
      />

      <h3 id="office-rooms" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Rooms & Departments
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        A unified single-floor layout with 9 functional rooms:
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          'Open Workspace (6 desks)',
          'Meeting Pod',
          'Breakroom',
          'Server Rack',
          'Analysis Room (2 desks)',
          'Data Lab (2 desks)',
          'Marketing (3 desks)',
          'Sales (3 desks)',
          'Datacenter',
        ].map((r) => (
          <span key={r} className="border border-border-default px-2 py-1 text-xs text-text-secondary">
            {r}
          </span>
        ))}
      </div>
      <FeatureList
        items={[
          'Team-to-room mapping: support/ops/finance → Open Workspace, dev → Data Lab, research → Analysis Room',
          'Semi-transparent walls with cyan edge highlights and floating room labels',
          'Point lights at room centers for ambient illumination',
          'Furniture with LOD (Level of Detail) for rendering performance',
        ]}
      />

      <h3 id="office-inspector" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Agent Inspector
      </h3>
      <FeatureList
        items={[
          'Click any agent to open a side panel (360px) with full details',
          'Shows agent name, archetype, status, and current action',
          'Live actions feed with tool name, input preview, and status icons',
          'Recent activity history with success/failure indicators',
          'Quick action buttons: Trigger, Pause, View Config',
          'Team roster panel (280px) with status-sorted agent list and collapsed dot view',
        ]}
      />

      <LimitationList
        items={[
          'Single floor only — multi-floor support deferred',
          'Agent actions in inspector are mock data',
          'No drag-and-drop agent repositioning',
          'No touch-friendly controls for mobile',
          'Desk slot wrapping: agents beyond capacity may visually overlap',
        ]}
      />
    </section>
  ),

  /* ---- Settings ---------------------------------------------------- */
  settings: (
    <section>
      <SectionHeading id="settings" icon={Settings} title="Settings" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Project and workspace settings dashboard with five configuration tabs for admins.
      </p>

      <h3 id="settings-general" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        General
      </h3>
      <FeatureList
        items={[
          'Project name, sector selection (10 industry options), accent color picker',
          'Language toggle (en-US / pt-BR) and timezone configuration',
          'Danger zone: project deletion with typed confirmation',
        ]}
      />

      <h3 id="settings-members" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Members
      </h3>
      <FeatureList
        items={[
          'Team member roster with role display (owner, admin, viewer)',
          'Invite new members by email with role assignment',
        ]}
      />

      <h3 id="settings-billing" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Billing
      </h3>
      <FeatureList
        items={[
          'Current plan badge with subscription status',
          'Resource usage meters: projects, agents, and workflows vs plan limits',
          'Plan comparison grid with monthly/annual toggle',
          'Locale-aware pricing (USD and BRL)',
          'Invoice history table with PDF download',
        ]}
      />

      <h3 id="settings-notifications" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Notifications
      </h3>
      <FeatureList
        items={[
          'Toggle-based controls for 6 event types',
          'Agent complete, agent error, approval request, workflow, team member, weekly report',
        ]}
      />

      <LimitationList
        items={[
          'Stripe checkout is stubbed for alpha (requires STRIPE_SECRET_KEY)',
          'Language switching is display-only — full locale switch not wired',
          'Member invitation backend may be incomplete',
        ]}
      />
    </section>
  ),

  /* ---- Help Center ------------------------------------------------- */
  help: (
    <section>
      <SectionHeading id="help" icon={HelpCircle} title="Help Center — Alpha Playbook" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        A comprehensive accordion-based guide for alpha testers. Eight collapsible sections
        with step-by-step instructions, tips, and known limitations.
      </p>

      <h3 id="help-quickstart" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Quick Start
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Five-step guide to get running:
      </p>
      <FeatureList
        items={[
          '1. Create your account and organization',
          '2. Set up your first project',
          '3. Connect WhatsApp (Z-API recommended)',
          '4. Create and configure your first agent',
          '5. Test with a real conversation',
        ]}
      />

      <h3 id="help-playbook" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Alpha Playbook Sections
      </h3>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          'Quick Start (5 steps)',
          'WhatsApp Integration (6 steps)',
          'Creating Agents (4 subsections)',
          'Approval System (3 subsections)',
          'Monitoring (3 subsections)',
          'Memory & Wiki (3 subsections)',
          'Known Limitations (8 items)',
          'Report Bugs (3 subsections)',
        ].map((s) => (
          <span key={s} className="border border-border-default px-2 py-1 text-xs text-text-secondary">
            {s}
          </span>
        ))}
      </div>
      <FeatureList
        items={[
          'Sidebar navigation with 8 icon-labeled sections',
          'Expand/collapse all toggle for quick browsing',
          'Smooth scroll-to-section on nav click',
          'Step blocks, bullet lists, and info boxes with cyan accents',
        ]}
      />

      <LimitationList
        items={[
          'Content is static — not fetched from an API',
          'No search functionality within help articles',
          'WhatsApp screenshot placeholders not yet filled',
        ]}
      />
    </section>
  ),

  /* ---- Onboarding -------------------------------------------------- */
  onboarding: (
    <section>
      <SectionHeading id="onboarding" icon={Compass} title="Onboarding" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        A 6-step animated setup wizard for first-time users. Guides you from account creation
        to a fully configured project with agents ready to work.
      </p>

      <h3 id="onboarding-steps" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Setup Steps
      </h3>
      <div className="mb-6 space-y-2">
        {[
          { step: '0', title: 'Welcome', desc: 'Animated typewriter intro with skip option' },
          { step: '1', title: 'Create Company & Project', desc: 'Company name and project name inputs' },
          { step: '2', title: 'Choose Template', desc: 'Industry template grid with agent count display' },
          { step: '3', title: 'Set Up Integration', desc: 'WhatsApp (recommended), Email, or skip' },
          { step: '4', title: 'Create First Agent', desc: 'Name + archetype selector (Support, Sales, Content Writer, Finance, Data Analyst)' },
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

      <h3 id="onboarding-templates" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Templates
      </h3>
      <FeatureList
        items={[
          'Industry-specific templates with pre-configured agent sets',
          'Locale-aware template names (en-US / pt-BR)',
          'Template cards show agent count and description',
          'Templates loaded from shared package (@ai-office/shared)',
        ]}
      />

      <FeatureList
        items={[
          'Framer Motion slide transitions between steps',
          'Visual progress indicator with 6 dots',
          'Skip buttons on every step (no forced choices)',
          'Back navigation on steps 1–5',
          'Keyboard-friendly: Enter to submit, Shift+Enter for multiline',
        ]}
      />

      <LimitationList
        items={[
          'Project/agent creation happens on navigation to /office, not during wizard steps',
          'Templates are hardcoded — not editable by users',
          'Email integration step has no further config UI',
        ]}
      />
    </section>
  ),

  /* ---- Tech Stack ------------------------------------------------ */
  tech: (
    <section>
      <SectionHeading id="tech" icon={Layers} title="Tech Stack" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        Built as a monorepo (Turborepo + pnpm) with clear separation between frontend, backend,
        AI engine, and infrastructure packages.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            id: 'frontend',
            label: 'Frontend',
            items: ['Next.js 15', 'Tailwind CSS v4', 'Zustand', 'Framer Motion', 'next-intl (pt-BR / en-US)'],
          },
          {
            id: 'backend',
            label: 'Backend',
            items: ['tRPC v11', 'Drizzle ORM', 'PostgreSQL + pgvector', 'BullMQ + Redis', 'Socket.IO'],
          },
          {
            id: 'ai-stack',
            label: 'AI',
            items: ['Claude (Anthropic)', 'OpenAI embeddings', 'Tool-use pattern', 'RAG pipeline'],
          },
          {
            id: 'infrastructure',
            label: 'Infrastructure',
            items: ['Clerk (auth)', 'Stripe (billing)', 'Vercel (hosting)', 'Turborepo + pnpm'],
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
    </section>
  ),
};
