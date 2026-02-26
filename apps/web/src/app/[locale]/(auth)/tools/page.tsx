'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Mail,
  Search,
  Users,
  FileSpreadsheet,
  DollarSign,
  GitMerge,
  Clock,
  Brain,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Badge } from '@/components/ui/badge';

// ── Tool catalog ─────────────────────────────────────────────────────
interface ToolDef {
  name: string;
  description: string;
  requiresApproval: boolean;
  credentialType?: string; // if set, needs OAuth2 connection
}

interface ToolCategory {
  key: string;
  icon: LucideIcon;
  tools: ToolDef[];
}

const TOOL_CATALOG: ToolCategory[] = [
  {
    key: 'builtin',
    icon: Brain,
    tools: [
      { name: 'get_current_time', description: 'Returns current date/time in ISO 8601', requiresApproval: false },
      { name: 'search_company_memory', description: 'Semantic search of company knowledge base (RAG)', requiresApproval: false },
      { name: 'log_message', description: 'Structured logging for agent debugging', requiresApproval: false },
    ],
  },
  {
    key: 'whatsapp',
    icon: MessageSquare,
    tools: [
      { name: 'send_whatsapp_message', description: 'Send WhatsApp messages and media', requiresApproval: true },
      { name: 'read_whatsapp_messages', description: 'Read incoming/outgoing WhatsApp messages', requiresApproval: false },
    ],
  },
  {
    key: 'email',
    icon: Mail,
    tools: [
      { name: 'send_email', description: 'Send emails via SMTP', requiresApproval: true, credentialType: 'google_gmail' },
      { name: 'read_email', description: 'Read inbox and sent messages via IMAP', requiresApproval: false, credentialType: 'google_gmail' },
    ],
  },
  {
    key: 'webSearch',
    icon: Search,
    tools: [
      { name: 'search_web', description: 'Google search via Serper API (cached 1h)', requiresApproval: false },
    ],
  },
  {
    key: 'crm',
    icon: Users,
    tools: [
      { name: 'search_contacts', description: 'Search contacts by name, email, or phone', requiresApproval: false, credentialType: 'rdstation_crm' },
      { name: 'create_contact', description: 'Create a new lead/contact', requiresApproval: false, credentialType: 'rdstation_crm' },
      { name: 'update_contact', description: 'Update existing contact fields', requiresApproval: false, credentialType: 'rdstation_crm' },
      { name: 'list_deals', description: 'List all sales deals', requiresApproval: false, credentialType: 'rdstation_crm' },
      { name: 'create_deal', description: 'Create a new sales deal', requiresApproval: false, credentialType: 'rdstation_crm' },
    ],
  },
  {
    key: 'sheets',
    icon: FileSpreadsheet,
    tools: [
      { name: 'read_spreadsheet', description: 'Read cell range using A1 notation', requiresApproval: false, credentialType: 'google_sheets' },
      { name: 'write_spreadsheet', description: 'Write data to cell range', requiresApproval: false, credentialType: 'google_sheets' },
      { name: 'append_spreadsheet', description: 'Append rows to a sheet', requiresApproval: false, credentialType: 'google_sheets' },
    ],
  },
  {
    key: 'finance',
    icon: DollarSign,
    tools: [
      { name: 'monitor_pix_transactions', description: 'Monitor Pix payments (EFI Bank)', requiresApproval: false },
      { name: 'check_nfe_status', description: 'Check NFe invoice status', requiresApproval: false },
    ],
  },
  {
    key: 'devops',
    icon: GitMerge,
    tools: [
      { name: 'create_deploy_request', description: 'Request a deployment or rollback', requiresApproval: true },
      { name: 'create_pr_review_request', description: 'Request a PR code review', requiresApproval: false },
      { name: 'create_human_task', description: 'Create a task for human team members', requiresApproval: false },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────
export default function ToolsPage() {
  const t = useTranslations('toolsPage');

  // Fetch OAuth2 credentials to show connection status
  const { data: credentials } = trpc.toolCredentials.list.useQuery();

  const connectedTypes = useMemo(() => {
    const set = new Set<string>();
    if (credentials) {
      for (const cred of credentials) {
        set.add(cred.toolType);
      }
    }
    return set;
  }, [credentials]);

  const totalTools = TOOL_CATALOG.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-[10px] text-text-muted">
            {t('subtitle', { count: totalTools })}
          </p>
        </div>
      </div>

      {/* Tool categories */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-6">
          {TOOL_CATALOG.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.key}>
                {/* Category header */}
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={14} strokeWidth={1.5} className="text-accent-cyan" />
                  <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-primary">
                    {t(`categories.${category.key}`)}
                  </h2>
                  <span className="text-[9px] text-text-muted">
                    ({category.tools.length})
                  </span>
                </div>

                {/* Tool cards */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {category.tools.map((tool) => {
                    const isConnected = tool.credentialType
                      ? connectedTypes.has(tool.credentialType)
                      : null;

                    return (
                      <div
                        key={tool.name}
                        className="border border-border-default bg-bg-raised p-3 transition-colors hover:border-accent-cyan/30"
                      >
                        {/* Tool name */}
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <code className="text-[11px] font-medium text-text-primary">
                            {tool.name}
                          </code>
                          <div className="flex shrink-0 gap-1">
                            {tool.requiresApproval && (
                              <span title={t('requiresApproval')}>
                                <ShieldCheck size={12} strokeWidth={1.5} className="text-status-warning" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mb-2 text-[10px] leading-relaxed text-text-muted">
                          {tool.description}
                        </p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1">
                          {tool.requiresApproval && (
                            <Badge variant="warning">{t('approval')}</Badge>
                          )}
                          {isConnected === true && (
                            <Badge variant="success">{t('connected')}</Badge>
                          )}
                          {isConnected === false && (
                            <Badge variant="default">{t('notConnected')}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
