'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Mail,
  Search,
  Users,
  FileSpreadsheet,
  DollarSign,
  GitMerge,
  Brain,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Link2,
  Unlink,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CredentialModal } from '@/components/tools/CredentialModal';

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
  credentialType?: string; // the OAuth2 credential for this app
  tutorialUrl?: string; // link to setup guide
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
    tutorialUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    tools: [
      { name: 'send_whatsapp_message', description: 'Send WhatsApp messages and media', requiresApproval: true },
      { name: 'read_whatsapp_messages', description: 'Read incoming/outgoing WhatsApp messages', requiresApproval: false },
    ],
  },
  {
    key: 'email',
    icon: Mail,
    credentialType: 'google_gmail',
    tutorialUrl: 'https://support.google.com/cloud/answer/6158849',
    tools: [
      { name: 'send_email', description: 'Send emails via SMTP', requiresApproval: true, credentialType: 'google_gmail' },
      { name: 'read_email', description: 'Read inbox and sent messages via IMAP', requiresApproval: false, credentialType: 'google_gmail' },
    ],
  },
  {
    key: 'webSearch',
    icon: Search,
    tutorialUrl: 'https://serper.dev/dashboard',
    tools: [
      { name: 'search_web', description: 'AI-powered web search with intelligent result extraction via Serper API (requires API key)', requiresApproval: false },
    ],
  },
  {
    key: 'crm',
    icon: Users,
    credentialType: 'rdstation_crm',
    tutorialUrl: 'https://developers.rdstation.com/reference/get-started',
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
    credentialType: 'google_sheets',
    tutorialUrl: 'https://support.google.com/cloud/answer/6158849',
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [configCategory, setConfigCategory] = useState<ToolCategory | null>(null);

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
  const selected = TOOL_CATALOG.find((c) => c.key === selectedKey) ?? null;

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

      {/* Main layout: app list + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: app list */}
        <div className="flex-1 overflow-auto border-r border-border-default p-4">
          <div className="flex flex-col gap-1.5">
            {TOOL_CATALOG.map((category) => {
              const Icon = category.icon;
              const isConnected = category.credentialType
                ? connectedTypes.has(category.credentialType)
                : null;
              const isActive = selectedKey === category.key;

              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSelectedKey(isActive ? null : category.key)}
                  className={`flex items-center gap-3 border px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'border-accent-cyan/40 bg-accent-cyan-dim'
                      : 'border-border-default bg-bg-raised hover:border-border-hover'
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
                    <Icon size={14} strokeWidth={1.5} className={isActive ? 'text-accent-cyan' : 'text-text-muted'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-primary">
                        {t(`categories.${category.key}`)}
                      </span>
                      <span className="text-[9px] text-text-muted">
                        {t('toolCount', { count: category.tools.length })}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {category.key === 'builtin' ? (
                        <Badge variant="default">{t('builtIn')}</Badge>
                      ) : (
                        <>
                          {isConnected === true && (
                            <Badge variant="success">{t('connected')}</Badge>
                          )}
                          {isConnected === false && (
                            <Badge variant="default">{t('notConnected')}</Badge>
                          )}
                        </>
                      )}
                      {category.tools.some((tool) => tool.requiresApproval) && (
                        <Badge variant="warning">{t('approval')}</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={12}
                    strokeWidth={1.5}
                    className={`shrink-0 text-text-muted transition-transform ${isActive ? 'rotate-90' : ''}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected ? (
          <DetailPanel
            category={selected}
            connectedTypes={connectedTypes}
            onClose={() => setSelectedKey(null)}
            onConfigure={setConfigCategory}
            t={t}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[10px] text-text-muted">{t('selectApp')}</p>
          </div>
        )}
      </div>

      {/* Credential configuration modal */}
      {configCategory && (
        <CredentialModal
          category={configCategory}
          onClose={() => setConfigCategory(null)}
        />
      )}
    </div>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────
function DetailPanel({
  category,
  connectedTypes,
  onClose,
  onConfigure,
  t,
}: {
  category: ToolCategory;
  connectedTypes: Set<string>;
  onClose: () => void;
  onConfigure: (cat: ToolCategory) => void;
  t: ReturnType<typeof useTranslations<'toolsPage'>>;
}) {
  const Icon = category.icon;
  const isConnected = category.credentialType
    ? connectedTypes.has(category.credentialType)
    : null;

  return (
    <div className="flex w-[420px] flex-col overflow-auto">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={14} strokeWidth={1.5} className="text-accent-cyan" />
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-primary">
            {t(`categories.${category.key}`)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {category.key !== 'builtin' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onConfigure(category)}
            >
              {t('configure')}
            </Button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
            aria-label={t('close' as any)}
          >
            <X size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Built-in badge or connection status + tutorial */}
      {category.key === 'builtin' ? (
        <div className="border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">{t('builtInDesc')}</span>
          </div>
        </div>
      ) : (category.credentialType || category.tutorialUrl) ? (
        <div className="border-b border-border-default px-4 py-3">
          {/* Connection badge */}
          {isConnected === true && (
            <div className="flex items-center gap-2">
              <Link2 size={12} strokeWidth={1.5} className="text-status-success" />
              <span className="text-[10px] text-status-success">{t('connected')}</span>
            </div>
          )}
          {isConnected === false && (
            <div className="flex items-center gap-2">
              <Unlink size={12} strokeWidth={1.5} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">{t('notConnected')}</span>
            </div>
          )}

          {/* Tutorial link */}
          {category.tutorialUrl && (
            <a
              href={category.tutorialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-[10px] text-accent-cyan transition-colors hover:underline"
            >
              <ExternalLink size={10} strokeWidth={1.5} />
              {t('setupGuide')}
            </a>
          )}
        </div>
      ) : null}

      {/* Tools list */}
      <div className="flex-1 px-4 py-3">
        <p className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('availableTools')}
        </p>
        <div className="flex flex-col gap-2">
          {category.tools.map((tool) => (
            <div
              key={tool.name}
              className="border border-border-default bg-bg-base p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <code className="text-[10px] font-medium text-text-primary">
                  {tool.name}
                </code>
                {tool.requiresApproval && (
                  <span title={t('requiresApproval')}>
                    <ShieldCheck size={11} strokeWidth={1.5} className="text-status-warning" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-text-muted">
                {tool.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {tool.requiresApproval && (
                  <Badge variant="warning">{t('approval')}</Badge>
                )}
                {tool.credentialType && connectedTypes.has(tool.credentialType) && (
                  <Badge variant="success">{t('connected')}</Badge>
                )}
                {tool.credentialType && !connectedTypes.has(tool.credentialType) && (
                  <Badge variant="default">{t('notConnected')}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
