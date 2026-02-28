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

function QuickStart({ steps }: { steps: string[] }) {
  return (
    <div id="quickstart" className="mb-6 border border-border-default bg-bg-base p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent-cyan">
        Quickstart
      </p>
      <ol className="space-y-2 text-sm text-text-secondary">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 font-bold text-accent-cyan">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
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
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'archetypes', label: 'Archetypes' },
      { id: 'llm-config', label: 'LLM Config' },
      { id: 'tool-assignment', label: 'Tool Assignment' },
      { id: 'agent-memory', label: 'Memory' },
      { id: 'triggers', label: 'Triggers' },
      { id: 'teams', label: 'Teams' },
    ],
  },
  {
    slug: 'tools',
    label: 'Tools & Integrations',
    icon: Wrench,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'core', label: 'Core' },
      { id: 'whatsapp-tools', label: 'WhatsApp' },
      { id: 'email-tools', label: 'Email' },
      { id: 'crm', label: 'CRM' },
      { id: 'google-sheets', label: 'Google Sheets' },
      { id: 'finance', label: 'Finance' },
      { id: 'devops', label: 'DevOps' },
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
      { id: 'execution', label: 'Execution' },
    ],
  },
  {
    slug: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageSquare,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'providers', label: 'Providers' },
      { id: 'messaging', label: 'Messaging' },
      { id: 'webhooks', label: 'Webhooks' },
      { id: 'templates', label: 'Templates' },
    ],
  },
  {
    slug: 'email',
    label: 'Email',
    icon: Mail,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'email-providers', label: 'Providers' },
      { id: 'sending', label: 'Sending' },
      { id: 'email-templates', label: 'Templates' },
      { id: 'inbox-reading', label: 'Inbox Reading' },
    ],
  },
  {
    slug: 'documents',
    label: 'Documents & RAG',
    icon: FileText,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'sources', label: 'Sources' },
      { id: 'chunking', label: 'Chunking' },
      { id: 'search', label: 'Search' },
      { id: 'agent-access', label: 'Agent Access' },
    ],
  },
  {
    slug: 'wiki',
    label: 'Wiki & Knowledge Base',
    icon: BookOpen,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'categories', label: 'Categories' },
      { id: 'articles', label: 'Articles' },
      { id: 'wiki-documents', label: 'Documents' },
    ],
  },
  {
    slug: 'approvals',
    label: 'Approval System',
    icon: ShieldCheck,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'rules', label: 'Rules' },
      { id: 'risk-levels', label: 'Risk Levels' },
      { id: 'review-flow', label: 'Review Flow' },
    ],
  },
  {
    slug: 'tasks',
    label: 'Task Management',
    icon: Clock,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'human-tasks', label: 'Human Tasks' },
      { id: 'devops-requests', label: 'DevOps Requests' },
    ],
  },
  {
    slug: 'strategies',
    label: 'Strategies & KPIs',
    icon: BarChart3,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'strategy-types', label: 'Types' },
      { id: 'kpis', label: 'KPIs' },
      { id: 'learnings', label: 'Learnings' },
      { id: 'recommendations', label: 'Recommendations' },
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
    ],
  },
  {
    slug: 'atlas',
    label: 'ATLAS',
    icon: Radio,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'atlas-orb', label: 'Orb Visualization' },
      { id: 'atlas-agentic-loop', label: 'Agentic Loop' },
      { id: 'atlas-tools', label: 'Tool Categories' },
      { id: 'atlas-approval', label: 'Approval Popup' },
      { id: 'atlas-conversation', label: 'Conversation' },
    ],
  },
  {
    slug: 'activity',
    label: 'Activity Log',
    icon: Activity,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
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
      { id: 'quickstart', label: 'Quickstart' },
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
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'settings-general', label: 'General' },
      { id: 'settings-members', label: 'Members' },
      { id: 'settings-models', label: 'Models' },
      { id: 'settings-api-keys', label: 'API Keys' },
      { id: 'settings-tools-credentials', label: 'Tool Credentials' },
      { id: 'settings-billing', label: 'Billing' },
      { id: 'settings-notifications', label: 'Notifications' },
    ],
  },
  {
    slug: 'help',
    label: 'Help Center',
    icon: HelpCircle,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'help-guide', label: 'Getting Started' },
      { id: 'help-playbook', label: 'Alpha Playbook' },
    ],
  },
  {
    slug: 'onboarding',
    label: 'Onboarding',
    icon: Compass,
    subtopics: [
      { id: 'quickstart', label: 'Quickstart' },
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

      <QuickStart
        steps={[
          'Navigate to the Agents page from the sidebar',
          'Click "Create Agent" and choose an archetype (e.g. Support, Sales)',
          'Configure the agent\'s LLM model, temperature, and token budget',
          'Assign tools the agent is allowed to use (WhatsApp, Email, CRM, etc.)',
          'Set a trigger mode (manual for testing) and click Save',
        ]}
      />

      <h3 id="archetypes" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Archetypes
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Pre-configured agent templates for common business roles.
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
        ]}
      />

      <h3 id="tool-assignment" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Tool Assignment
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Control which tools each agent can access.
      </p>
      <FeatureList
        items={[
          'Assign any combination of 21+ tools per agent',
          'Per-tool approval rules (always allow, require approval, always block)',
          'Bilingual system prompts (English & Portuguese)',
          'Tool usage tracked in activity log with full I/O payloads',
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

      <h3 id="triggers" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Triggers
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Define how and when agents start working.
      </p>
      <FeatureList
        items={[
          'Manual — trigger from the UI with a click',
          'Scheduled — cron-based recurring execution',
          'Event-driven — react to incoming messages or system events',
          'Agent-chained — triggered by another agent completing a task',
          'Always-on — continuously listening and responding',
        ]}
      />

      <h3 id="teams" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Teams
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Group agents by department for organization and desk assignment.
      </p>
      <FeatureList
        items={[
          'Teams: development, research, marketing, sales, support, finance, operations',
          'Team assignment controls desk placement in the Virtual Office',
          'Per-agent safety limits: max actions per session, token budgets, cost tracking',
        ]}
      />

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

      <QuickStart
        steps={[
          'Navigate to Workflows from the sidebar',
          'Click "Create Workflow" and give it a name',
          'Drag agent nodes onto the canvas and connect them in sequence',
          'Configure each node with a task prompt and target agent',
          'Click "Run" to execute the workflow end-to-end',
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
          'Drag agent nodes from a palette onto the canvas',
          'Connect nodes with edges to define execution order',
          'Activate/deactivate workflows without deleting them',
        ]}
      />

      <h3 id="nodes" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Node Types
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Each node assigns a task to a specific agent with configurable inputs.
      </p>
      <FeatureList
        items={[
          'Agent node: assign a task prompt to a specific agent',
          'Each node receives the output of its predecessor as context',
          'Node-level status indicators: pending, running, completed, failed',
        ]}
      />

      <h3 id="execution" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Execution
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Run workflows and track progress in real time.
      </p>
      <FeatureList
        items={[
          'Per-node execution tracking: input, output, status, duration',
          'Workflow-level status: running, completed, failed, cancelled',
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

      <QuickStart
        steps={[
          'Go to Settings → Tool Credentials and add your WhatsApp provider credentials',
          'Create a WhatsApp connection with your business phone number',
          'Assign the send_whatsapp_message and read_whatsapp_messages tools to an agent',
          'Set a default handler agent for automatic responses to incoming messages',
          'Send a test message to verify the integration',
        ]}
      />

      <h3 id="providers" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Supported Providers
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Choose the WhatsApp API provider that fits your setup.
      </p>
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

      <h3 id="messaging" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Messaging
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Bi-directional messaging with full status tracking.
      </p>
      <FeatureList
        items={[
          'Send outbound messages + receive inbound via webhooks',
          'Message status tracking: pending, sent, delivered, read, failed',
          'Contact name and phone indexing',
          'Media URL support for images and files',
        ]}
      />

      <h3 id="webhooks" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Webhooks
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Automatic webhook handling for incoming messages and status updates.
      </p>
      <FeatureList
        items={[
          'Webhook signature verification (HMAC-SHA256/SHA1, Bearer token)',
          'Default handler agent per connection for auto-responses',
          'Automatic message routing to the correct project and agent',
        ]}
      />

      <h3 id="templates" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Templates
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Pre-approved message templates for Meta Cloud API compliance.
      </p>
      <FeatureList
        items={[
          'Pre-approved message templates for business-initiated conversations',
          'Template variable substitution for personalization',
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

      <QuickStart
        steps={[
          'Go to Settings → Tool Credentials and configure your email provider (SMTP, SendGrid, or AWS SES)',
          'Assign the send_email and read_email tools to an agent',
          'Optionally create reusable email templates for common messages',
          'Test by triggering the agent with an email task',
        ]}
      />

      <h3 id="email-providers" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Supported Providers
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Choose from three email delivery providers.
      </p>
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

      <h3 id="sending" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Sending
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Rich email sending with HTML, attachments, and recipient management.
      </p>
      <FeatureList
        items={[
          'Send emails with HTML body, plain text fallback, and attachments',
          'To, CC, BCC recipient support',
          'Message status tracking: pending, sent, delivered, bounced, failed',
        ]}
      />

      <h3 id="email-templates" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Templates
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Reusable email templates for transactional and marketing use cases.
      </p>
      <FeatureList
        items={[
          'Template types: transactional and marketing',
          'Variable substitution for personalization',
          'HTML body with plain text fallback',
        ]}
      />

      <h3 id="inbox-reading" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Inbox Reading
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Read incoming emails via IMAP for agent processing.
      </p>
      <FeatureList
        items={[
          'IMAP inbox reading with configurable host/port/credentials',
          'Agents can process incoming emails and take action',
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

      <QuickStart
        steps={[
          'Navigate to Documents from the sidebar',
          'Upload a document (PDF, TXT, or paste text content)',
          'The system automatically chunks and embeds the content',
          'Assign the search_company_memory tool to any agent that needs knowledge base access',
          'Test by asking an agent a question that requires document knowledge',
        ]}
      />

      <h3 id="sources" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Sources
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Multiple ways to ingest content into the knowledge base.
      </p>
      <FeatureList
        items={[
          'File upload: PDF, TXT, and text content',
          'Web sources: paste a URL for content extraction',
          'API sources: ingest from external APIs',
          'Agent-generated: agents can create documents from their outputs',
          'Metadata and source URL tracking per document',
        ]}
      />

      <h3 id="chunking" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Chunking
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Automatic text splitting and embedding for semantic search.
      </p>
      <FeatureList
        items={[
          'Automatic chunking into searchable segments',
          'Embedding with OpenAI text-embedding-3-small (1536 dimensions)',
          'Chunks stored alongside metadata for traceability',
        ]}
      />

      <h3 id="search" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Search
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Cosine similarity search for fast, relevant retrieval.
      </p>
      <FeatureList
        items={[
          'Cosine similarity search via pgvector',
          'Returns top-K most relevant chunks with scores',
          'Filters by project scope — agents only see their project\'s documents',
        ]}
      />

      <h3 id="agent-access" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Agent Access
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        How agents use the knowledge base during execution.
      </p>
      <FeatureList
        items={[
          'Agents access knowledge via the search_company_memory tool',
          'Search results injected into the agent\'s context window as reference material',
          'Agents cite source documents in their responses',
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

      <QuickStart
        steps={[
          'Navigate to Wiki from the sidebar',
          'Create a category (e.g. "Engineering", "Sales Playbooks")',
          'Add articles within the category with title, summary, and content',
          'Optionally attach existing documents for RAG integration',
        ]}
      />

      <h3 id="categories" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Categories
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Hierarchical organization for your knowledge base.
      </p>
      <FeatureList
        items={[
          'Hierarchical categories up to 3 levels deep',
          'Custom icons and sort order per category',
          'Nested subcategories for fine-grained organization',
        ]}
      />

      <h3 id="articles" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Articles
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Rich content articles with metadata and tagging.
      </p>
      <FeatureList
        items={[
          'Articles with title, summary, content body, and tags',
          'Assign articles to categories for discoverability',
          'Full-text content editing',
        ]}
      />

      <h3 id="wiki-documents" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Documents
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Link uploaded documents to wiki articles for RAG-powered agent access.
      </p>
      <FeatureList
        items={[
          'Attach existing documents to articles',
          'Documents linked to articles are searchable via the RAG pipeline',
          'Agents can reference wiki-linked documents during execution',
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

      <QuickStart
        steps={[
          'Open an agent\'s configuration page',
          'In the tool list, set approval mode per tool (always allow, require approval, or block)',
          'When an agent triggers a tool that requires approval, execution pauses',
          'Review the pending approval in the Approvals dashboard — approve or reject with a comment',
        ]}
      />

      <h3 id="rules" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Rules
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Per-agent, per-tool approval rules that control execution flow.
      </p>
      <FeatureList
        items={[
          'Three modes: always allow, require approval, always block',
          'Rules are set per agent + tool combination',
          'Default mode is configurable per tool category',
        ]}
      />

      <h3 id="risk-levels" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Risk Levels
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Classify tools by risk to prioritize review attention.
      </p>
      <FeatureList
        items={[
          'Four levels: low, medium, high, critical',
          'Risk level displayed in approval requests for quick triage',
          'Higher-risk actions highlighted with stronger visual indicators',
        ]}
      />

      <h3 id="review-flow" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Review Flow
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        How approval requests are reviewed and resolved.
      </p>
      <FeatureList
        items={[
          'Approval requests pause agent execution until reviewed',
          'Full action context: tool name, input payload, agent identity',
          'Review with optional comments (approve or reject)',
          'Approved actions resume agent execution automatically',
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

      <QuickStart
        steps={[
          'Assign the create_human_task tool to an agent',
          'The agent creates tasks when it encounters work requiring human action',
          'View and manage tasks in the Tasks dashboard',
          'Update task status as you complete them (todo → in progress → done)',
        ]}
      />

      <h3 id="human-tasks" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Human Tasks
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Tasks created by agents for human team members to complete.
      </p>
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
      <p className="mb-3 text-sm text-text-secondary">
        Specialized task type for deployment, code review, and infrastructure changes.
      </p>
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

      <QuickStart
        steps={[
          'Navigate to Strategies from the sidebar',
          'Create a strategy (e.g. "Q1 Growth") and choose a type (growth, retention, brand, product)',
          'Add KPIs with target values, units, and direction (increase/decrease)',
          'Agents with analytics tools will generate learnings and recommendations over time',
          'Review and apply or dismiss agent recommendations',
        ]}
      />

      <h3 id="strategy-types" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Types
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Categorize strategies by business objective.
      </p>
      <FeatureList
        items={[
          'Four strategy types: growth, retention, brand, product',
          'Status tracking: planned, active, at risk, completed',
          'AI-refined strategy text (user draft + AI improvement)',
        ]}
      />

      <h3 id="kpis" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        KPIs
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Track measurable outcomes tied to each strategy.
      </p>
      <FeatureList
        items={[
          'Current value, target value, unit, and direction per KPI',
          'KPIs linked to their parent strategy',
          'Visual progress indicators for at-a-glance status',
        ]}
      />

      <h3 id="learnings" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Learnings
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Agent-generated insights based on observed data and outcomes.
      </p>
      <FeatureList
        items={[
          'Agents generate learnings with confidence scores',
          'Learnings tied to specific strategies for context',
          'Historical record of all agent-generated insights',
        ]}
      />

      <h3 id="recommendations" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Recommendations
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Actionable suggestions from agents that you can apply or dismiss.
      </p>
      <FeatureList
        items={[
          'Agent-generated actionable recommendations',
          'Apply or dismiss each recommendation individually',
          'Applied recommendations update the parent strategy',
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
      <SectionHeading id="atlas" icon={Radio} title="ATLAS — Agent Tracking & Live Advisory System" status="done" />
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        ATLAS is an interactive AI advisory interface that lets you query your project using voice or text.
        Powered by a real Claude Sonnet agentic loop with 22 tools, ATLAS can read your project data,
        analyze agent performance, and answer business intelligence questions with live data.
      </p>

      <QuickStart
        steps={[
          'Navigate to ATLAS from the sidebar',
          'Type a question in the text field or click the microphone to use voice input',
          'ATLAS runs a Claude agentic loop — read-only tools execute automatically, mutations require approval',
          'Review the response in the transcript panel with full tool-use transparency',
          'Use starter suggestions (MRR status, risk assessment, weekly priorities) for quick insights',
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

      <h3 id="atlas-agentic-loop" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Agentic Loop
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        ATLAS runs a real Claude Sonnet agentic loop — not mock data.
      </p>
      <FeatureList
        items={[
          'Powered by Claude Sonnet 4.6 with tool-use capabilities',
          'Up to 8 iterations per query for multi-step reasoning',
          '22 tools available for reading project data, agents, activity, and more',
          'Read-only tools auto-execute — no approval needed for data queries',
          'Mutation tools (create, update, delete) trigger an approval popup before execution',
          'Full tool-call transparency: every tool invocation is visible in the response',
          'Streaming responses with real-time status updates in the orb',
        ]}
      />

      <h3 id="atlas-tools" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Tool Categories
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        22 tools organized by domain, giving ATLAS full read access to your project.
      </p>
      <div className="mb-6 space-y-4">
        {[
          {
            category: 'Agents',
            tools: ['list_agents', 'get_agent_details', 'get_agent_memory', 'get_agent_sessions'],
          },
          {
            category: 'Activity & Analytics',
            tools: ['list_activity_logs', 'get_session_timeline', 'get_project_analytics', 'get_agent_analytics'],
          },
          {
            category: 'Tasks & Approvals',
            tools: ['list_tasks', 'list_approvals', 'list_devops_requests'],
          },
          {
            category: 'Knowledge',
            tools: ['search_documents', 'list_wiki_articles', 'list_wiki_categories'],
          },
          {
            category: 'Communication',
            tools: ['list_whatsapp_messages', 'list_email_messages', 'list_whatsapp_contacts'],
          },
          {
            category: 'Strategy',
            tools: ['list_strategies', 'get_strategy_kpis', 'list_workflows'],
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

      <h3 id="atlas-approval" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Approval Popup
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Mutation actions require explicit user approval before ATLAS executes them.
      </p>
      <FeatureList
        items={[
          'Popup appears when ATLAS wants to create, update, or delete data',
          'Shows the tool name, full input payload, and risk level',
          'Approve or reject with optional comment',
          'Rejected actions are reported back to ATLAS for alternative approaches',
        ]}
      />

      <h3 id="atlas-conversation" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Conversation
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Text-based conversational interface with voice input support.
      </p>
      <FeatureList
        items={[
          'Text input field for typing queries directly',
          'Microphone button for voice input (speech-to-text)',
          'Transcript panel with auto-scrolling message history and timestamps',
          'Starter suggestions: MRR status, risk assessment, weekly priorities',
          'User and ATLAS messages visually distinct (right-aligned vs cyan-bordered)',
          'Mute toggle, reset button, and volume controls',
        ]}
      />

      <LimitationList
        items={[
          'Voice input is UI-only — speech-to-text integration not yet wired',
          'No proactive notifications — ATLAS only responds when queried',
          'No persistent conversation memory across sessions',
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

      <QuickStart
        steps={[
          'Navigate to Activity from the sidebar',
          'Browse the paginated log table — most recent actions appear first',
          'Use filters to narrow by agent or status (pending, completed, failed)',
          'Click any row to open the detail drawer with full I/O payloads',
          'Click "View Session" to see the full timeline of an agent\'s execution session',
        ]}
      />

      <h3 id="activity-list" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Log List
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Paginated table of all agent actions with filtering and sorting.
      </p>
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
        A slide-in side panel showing full context for any action.
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
      <p className="mb-3 text-sm text-text-secondary">
        Vertical timeline showing all actions within a single agent execution session.
      </p>
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

      <QuickStart
        steps={[
          'Navigate to Office from the sidebar — the 3D scene loads automatically',
          'Pan, zoom, and rotate the camera to explore the office layout',
          'Click any agent avatar to open the Agent Inspector side panel',
          'Watch data flow particles stream from agents to the server room when they\'re working',
          'Use the Team Roster panel to see all agents grouped by status',
        ]}
      />

      <h3 id="office-agents" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Agent Avatars
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Agents rendered as capsule-shaped avatars with status-driven colors and animations.
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
        A unified single-floor layout with 9 functional rooms.
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
      <p className="mb-3 text-sm text-text-secondary">
        Click any agent to open a detailed side panel with live status and controls.
      </p>
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
        Project and workspace settings dashboard with configuration tabs for admins.
        Manage general settings, team members, AI models, API keys, tool credentials, billing, and notifications.
      </p>

      <QuickStart
        steps={[
          'Navigate to Settings from the sidebar',
          'Configure your project name, sector, and language in the General tab',
          'Set up AI model preferences in the Models tab',
          'Add your API keys (Anthropic, OpenAI) in the API Keys tab',
          'Connect external services (WhatsApp, CRM, Google Sheets) in Tool Credentials',
        ]}
      />

      <h3 id="settings-general" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        General
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Core project configuration and preferences.
      </p>
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
      <p className="mb-3 text-sm text-text-secondary">
        Manage team access and roles.
      </p>
      <FeatureList
        items={[
          'Team member roster with role display (owner, admin, viewer)',
          'Invite new members by email with role assignment',
        ]}
      />

      <h3 id="settings-models" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Models
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Configure which AI models are used for different tasks across the platform.
      </p>
      <FeatureList
        items={[
          'Three-column layout: use case, current model, and change selector',
          'Model selection per use case: agent execution, ATLAS queries, embeddings',
          'Supported models: Claude Sonnet, Claude Haiku, Claude Opus',
          'Model changes apply to new executions — in-flight sessions unaffected',
        ]}
      />

      <h3 id="settings-api-keys" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        API Keys
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Manage API keys for AI providers and external services.
      </p>
      <FeatureList
        items={[
          'Add and manage Anthropic API key for Claude access',
          'Add and manage OpenAI API key for embeddings',
          'Keys are encrypted at rest and never displayed in full after saving',
          'Key validation on save — invalid keys are rejected with clear error messages',
        ]}
      />

      <h3 id="settings-tools-credentials" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Tool Credentials
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Connect external services via OAuth2 or API key credentials.
      </p>
      <FeatureList
        items={[
          'OAuth2 connection modal for Google Sheets and RD Station CRM',
          'API key input for WhatsApp providers (Z-API, Twilio, Meta)',
          'SMTP / SendGrid / AWS SES credentials for email',
          'Connection status indicators (connected, expired, error)',
          'Re-authorize flow for expired OAuth2 tokens',
        ]}
      />

      <h3 id="settings-billing" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Billing
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Subscription management, plan comparison, and invoices.
      </p>
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
      <p className="mb-3 text-sm text-text-secondary">
        Control which events trigger notifications.
      </p>
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

      <QuickStart
        steps={[
          'Navigate to Help from the sidebar',
          'Browse the 8 accordion sections or use the sidebar navigation to jump to a topic',
          'Follow the Quick Start guide to set up your first project and agent',
          'Refer to the Alpha Playbook for detailed integration guides and troubleshooting',
        ]}
      />

      <h3 id="help-guide" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Getting Started
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Five-step guide to get running with your first project and agent.
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
        Alpha Playbook
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Detailed guides organized into 8 sections covering every feature.
      </p>
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

      <QuickStart
        steps={[
          'Sign up for an account — the onboarding wizard starts automatically',
          'Enter your company and project name',
          'Choose an industry template to pre-configure agents',
          'Optionally connect WhatsApp or Email',
          'Create your first agent and click "Go to Office" to start',
        ]}
      />

      <h3 id="onboarding-steps" className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
        Setup Steps
      </h3>
      <p className="mb-3 text-sm text-text-secondary">
        Six animated steps that guide first-time users through initial setup.
      </p>
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
      <p className="mb-3 text-sm text-text-secondary">
        Industry-specific templates with pre-configured agent sets.
      </p>
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
