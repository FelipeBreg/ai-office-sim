'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Headset,
  TrendingUp,
  Megaphone,
  BarChart3,
  PenTool,
  Code2,
  ClipboardList,
  Users,
  Wallet,
  Wrench,
  ChevronDown,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Mail,
  Search,
  UserCheck,
  Share2,
  ShoppingCart,
  Package,
  Scale,
  BarChart4,
  Handshake,
  Rocket,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from '@/i18n/navigation';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Archetype =
  | 'support'
  | 'sales'
  | 'marketing'
  | 'data_analyst'
  | 'content_writer'
  | 'developer'
  | 'project_manager'
  | 'hr'
  | 'finance'
  | 'email_campaign_manager'
  | 'research'
  | 'recruiter'
  | 'social_media'
  | 'mercado_livre'
  | 'inventory_monitor'
  | 'legal_research'
  | 'ad_analyst'
  | 'account_manager'
  | 'deployment_monitor'
  | 'custom';

type TriggerType = 'always_on' | 'scheduled' | 'event' | 'manual' | 'agent';

type MemoryScope = 'read_only' | 'read_write';

type Team =
  | 'development'
  | 'research'
  | 'marketing'
  | 'sales'
  | 'support'
  | 'finance'
  | 'operations'
  | 'none';

type PromptTab = 'en' | 'ptBr';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STEPS = [
  'stepName',
  'stepPrompt',
  'stepTools',
  'stepMemory',
  'stepTrigger',
  'stepTeam',
  'stepReview',
] as const;

const ARCHETYPES: {
  id: Archetype;
  icon: typeof Headset;
  nameKey: string;
  descKey: string;
}[] = [
  { id: 'support', icon: Headset, nameKey: 'archetypeSupport', descKey: 'archetypeSupportDesc' },
  { id: 'sales', icon: TrendingUp, nameKey: 'archetypeSales', descKey: 'archetypeSalesDesc' },
  { id: 'marketing', icon: Megaphone, nameKey: 'archetypeMarketing', descKey: 'archetypeMarketingDesc' },
  { id: 'data_analyst', icon: BarChart3, nameKey: 'archetypeDataAnalyst', descKey: 'archetypeDataAnalystDesc' },
  { id: 'content_writer', icon: PenTool, nameKey: 'archetypeContentWriter', descKey: 'archetypeContentWriterDesc' },
  { id: 'developer', icon: Code2, nameKey: 'archetypeDeveloper', descKey: 'archetypeDeveloperDesc' },
  { id: 'project_manager', icon: ClipboardList, nameKey: 'archetypeProjectManager', descKey: 'archetypeProjectManagerDesc' },
  { id: 'hr', icon: Users, nameKey: 'archetypeHr', descKey: 'archetypeHrDesc' },
  { id: 'finance', icon: Wallet, nameKey: 'archetypeFinance', descKey: 'archetypeFinanceDesc' },
  { id: 'email_campaign_manager', icon: Mail, nameKey: 'archetypeEmailCampaign', descKey: 'archetypeEmailCampaignDesc' },
  { id: 'research', icon: Search, nameKey: 'archetypeResearch', descKey: 'archetypeResearchDesc' },
  { id: 'recruiter', icon: UserCheck, nameKey: 'archetypeRecruiter', descKey: 'archetypeRecruiterDesc' },
  { id: 'social_media', icon: Share2, nameKey: 'archetypeSocialMedia', descKey: 'archetypeSocialMediaDesc' },
  { id: 'mercado_livre', icon: ShoppingCart, nameKey: 'archetypeMercadoLivre', descKey: 'archetypeMercadoLivreDesc' },
  { id: 'inventory_monitor', icon: Package, nameKey: 'archetypeInventory', descKey: 'archetypeInventoryDesc' },
  { id: 'legal_research', icon: Scale, nameKey: 'archetypeLegalResearch', descKey: 'archetypeLegalResearchDesc' },
  { id: 'ad_analyst', icon: BarChart4, nameKey: 'archetypeAdAnalyst', descKey: 'archetypeAdAnalystDesc' },
  { id: 'account_manager', icon: Handshake, nameKey: 'archetypeAccountManager', descKey: 'archetypeAccountManagerDesc' },
  { id: 'deployment_monitor', icon: Rocket, nameKey: 'archetypeDeploymentMonitor', descKey: 'archetypeDeploymentMonitorDesc' },
  { id: 'custom', icon: Sparkles, nameKey: 'archetypeCustom', descKey: 'archetypeCustomDesc' },
];

const TOOLS: { id: string; nameKey: string; descKey: string }[] = [
  { id: 'send_whatsapp_message', nameKey: 'toolSendWhatsapp', descKey: 'toolSendWhatsappDesc' },
  { id: 'read_whatsapp_messages', nameKey: 'toolReadWhatsapp', descKey: 'toolReadWhatsappDesc' },
  { id: 'send_email', nameKey: 'toolSendEmail', descKey: 'toolSendEmailDesc' },
  { id: 'read_email', nameKey: 'toolReadEmail', descKey: 'toolReadEmailDesc' },
  { id: 'search_web', nameKey: 'toolSearchWeb', descKey: 'toolSearchWebDesc' },
  { id: 'search_company_memory', nameKey: 'toolSearchMemory', descKey: 'toolSearchMemoryDesc' },
  { id: 'search_contacts', nameKey: 'toolSearchContacts', descKey: 'toolSearchContactsDesc' },
  { id: 'create_contact', nameKey: 'toolCreateContact', descKey: 'toolCreateContactDesc' },
  { id: 'update_contact', nameKey: 'toolUpdateContact', descKey: 'toolUpdateContactDesc' },
  { id: 'list_deals', nameKey: 'toolListDeals', descKey: 'toolListDealsDesc' },
  { id: 'create_deal', nameKey: 'toolCreateDeal', descKey: 'toolCreateDealDesc' },
  { id: 'read_spreadsheet', nameKey: 'toolReadSpreadsheet', descKey: 'toolReadSpreadsheetDesc' },
  { id: 'write_spreadsheet', nameKey: 'toolWriteSpreadsheet', descKey: 'toolWriteSpreadsheetDesc' },
  { id: 'append_to_spreadsheet', nameKey: 'toolAppendSpreadsheet', descKey: 'toolAppendSpreadsheetDesc' },
  { id: 'monitor_pix_transactions', nameKey: 'toolMonitorPix', descKey: 'toolMonitorPixDesc' },
  { id: 'check_nfe_status', nameKey: 'toolCheckNfe', descKey: 'toolCheckNfeDesc' },
];

const TRIGGER_OPTIONS: {
  id: TriggerType;
  nameKey: string;
  descKey: string;
}[] = [
  { id: 'always_on', nameKey: 'triggerAlwaysOn', descKey: 'triggerAlwaysOnDesc' },
  { id: 'scheduled', nameKey: 'triggerScheduled', descKey: 'triggerScheduledDesc' },
  { id: 'event', nameKey: 'triggerEvent', descKey: 'triggerEventDesc' },
  { id: 'manual', nameKey: 'triggerManual', descKey: 'triggerManualDesc' },
  { id: 'agent', nameKey: 'triggerAgent', descKey: 'triggerAgentDesc' },
];

const TEAMS: { id: Team; nameKey: string; descKey: string }[] = [
  { id: 'none', nameKey: 'teamNone', descKey: 'teamNoneDesc' },
  { id: 'development', nameKey: 'teamDevelopment', descKey: 'teamDevelopmentDesc' },
  { id: 'research', nameKey: 'teamResearch', descKey: 'teamResearchDesc' },
  { id: 'marketing', nameKey: 'teamMarketing', descKey: 'teamMarketingDesc' },
  { id: 'sales', nameKey: 'teamSales', descKey: 'teamSalesDesc' },
  { id: 'support', nameKey: 'teamSupport', descKey: 'teamSupportDesc' },
  { id: 'finance', nameKey: 'teamFinance', descKey: 'teamFinanceDesc' },
  { id: 'operations', nameKey: 'teamOperations', descKey: 'teamOperationsDesc' },
];

/* -------------------------------------------------------------------------- */
/*  Archetype defaults                                                        */
/* -------------------------------------------------------------------------- */

const ARCHETYPE_DEFAULT_TOOLS: Record<Archetype, string[]> = {
  support: ['send_whatsapp_message', 'read_whatsapp_messages', 'send_email', 'read_email', 'search_company_memory', 'search_contacts'],
  sales: ['send_whatsapp_message', 'read_whatsapp_messages', 'send_email', 'search_contacts', 'create_contact', 'list_deals', 'create_deal'],
  marketing: ['send_email', 'search_web', 'search_company_memory', 'read_spreadsheet', 'write_spreadsheet'],
  data_analyst: ['search_web', 'search_company_memory', 'read_spreadsheet', 'write_spreadsheet', 'append_to_spreadsheet'],
  content_writer: ['search_web', 'search_company_memory', 'read_spreadsheet'],
  developer: ['search_web', 'search_company_memory', 'read_spreadsheet', 'write_spreadsheet'],
  project_manager: ['send_email', 'search_contacts', 'list_deals', 'read_spreadsheet', 'search_company_memory'],
  hr: ['send_email', 'search_contacts', 'create_contact', 'update_contact', 'search_company_memory'],
  finance: ['read_spreadsheet', 'write_spreadsheet', 'append_to_spreadsheet', 'monitor_pix_transactions', 'check_nfe_status'],
  email_campaign_manager: ['send_email', 'read_email', 'read_spreadsheet', 'search_company_memory', 'search_contacts'],
  research: ['search_web', 'search_company_memory', 'write_spreadsheet', 'read_spreadsheet'],
  recruiter: ['send_email', 'read_email', 'search_web', 'search_contacts', 'create_contact'],
  social_media: ['search_web', 'write_spreadsheet', 'search_company_memory', 'read_spreadsheet'],
  mercado_livre: ['search_company_memory', 'send_whatsapp_message', 'read_spreadsheet'],
  inventory_monitor: ['read_spreadsheet', 'search_company_memory', 'send_email', 'append_to_spreadsheet'],
  legal_research: ['search_web', 'search_company_memory', 'write_spreadsheet'],
  ad_analyst: ['read_spreadsheet', 'search_web', 'search_company_memory', 'write_spreadsheet'],
  account_manager: ['search_contacts', 'update_contact', 'send_email', 'send_whatsapp_message', 'search_company_memory'],
  deployment_monitor: ['search_web', 'send_email', 'search_company_memory', 'read_spreadsheet'],
  custom: [],
};

const ARCHETYPE_DEFAULT_PROMPTS_EN: Record<Archetype, string> = {
  support: 'You are a customer support agent. Respond helpfully and empathetically to customer inquiries. Escalate complex issues when needed.',
  sales: 'You are a sales agent. Qualify leads, manage deals, and follow up with prospects. Focus on building relationships and closing deals.',
  marketing: 'You are a marketing agent. Create compelling campaigns, analyze audience data, and optimize marketing strategies.',
  data_analyst: 'You are a data analyst agent. Process data, generate reports, and provide actionable insights from business data.',
  content_writer: 'You are a content writer agent. Create engaging blog posts, marketing copy, and other written content.',
  developer: 'You are a developer agent. Help with code generation, technical documentation, and software development tasks.',
  project_manager: 'You are a project manager agent. Track tasks, coordinate team activities, and ensure projects stay on schedule.',
  hr: 'You are an HR agent. Assist with hiring, onboarding, and employee support processes.',
  finance: 'You are a finance agent. Handle invoicing, payment tracking, and financial reporting tasks.',
  email_campaign_manager: 'You are an email campaign manager agent. Draft email campaigns, schedule sends, monitor open/click rates, and generate performance reports.',
  research: 'You are a research agent. Gather intelligence on companies, markets, and competitors. Summarize findings into structured reports with actionable insights.',
  recruiter: 'You are an HR recruiter agent. Screen resumes, draft interview scheduling emails, and generate candidate comparison reports.',
  social_media: 'You are a social media agent. Draft social media posts, suggest posting schedules, monitor brand mentions, and generate weekly social performance summaries.',
  mercado_livre: 'You are a Mercado Livre agent. Monitor product listings, respond to buyer questions, track order status, and flag inventory low stock alerts.',
  inventory_monitor: 'You are an inventory monitor agent. Monitor inventory levels from spreadsheets and ERP data, flag items below reorder threshold, generate weekly stock reports, and send critical alerts.',
  legal_research: 'You are a legal research agent specializing in Brazilian law. Research legal topics, summarize legislation including LGPD, and draft legal document outlines.',
  ad_analyst: 'You are an ad campaign analyst agent. Analyze ad campaign data from Google Ads and Meta Ads exports, identify top and bottom performers, recommend budget reallocation, and generate weekly reports.',
  account_manager: 'You are an account manager agent. Manage existing client relationships, send periodic check-in messages, flag churn-risk clients, and schedule review meetings.',
  deployment_monitor: 'You are a deployment monitor agent. Monitor GitHub for PRs and deployments, summarize changes, flag potential issues, and generate weekly deployment reports.',
  custom: '',
};

const ARCHETYPE_DEFAULT_PROMPTS_PTBR: Record<Archetype, string> = {
  support: 'Voce e um agente de suporte ao cliente. Responda de forma prestativa e empatica as consultas dos clientes. Escale problemas complexos quando necessario.',
  sales: 'Voce e um agente de vendas. Qualifique leads, gerencie negocios e faca follow-up com prospects. Foque em construir relacionamentos e fechar negocios.',
  marketing: 'Voce e um agente de marketing. Crie campanhas envolventes, analise dados de audiencia e otimize estrategias de marketing.',
  data_analyst: 'Voce e um agente analista de dados. Processe dados, gere relatorios e forneca insights acionaveis a partir dos dados do negocio.',
  content_writer: 'Voce e um agente redator. Crie blog posts envolventes, copy de marketing e outros conteudos escritos.',
  developer: 'Voce e um agente desenvolvedor. Ajude com geracao de codigo, documentacao tecnica e tarefas de desenvolvimento de software.',
  project_manager: 'Voce e um agente gerente de projetos. Acompanhe tarefas, coordene atividades da equipe e garanta que os projetos sigam o cronograma.',
  hr: 'Voce e um agente de RH. Auxilie com processos de contratacao, onboarding e suporte a funcionarios.',
  finance: 'Voce e um agente financeiro. Cuide de faturamento, rastreamento de pagamentos e tarefas de relatorios financeiros.',
  email_campaign_manager: 'Voce e um agente gestor de campanhas de email. Crie campanhas de email, agende envios, monitore taxas de abertura/clique e gere relatorios de desempenho.',
  research: 'Voce e um agente de pesquisa. Colete inteligencia sobre empresas, mercados e concorrentes. Resuma descobertas em relatorios estruturados com insights acionaveis.',
  recruiter: 'Voce e um agente recrutador de RH. Analise curriculos, redija emails de agendamento de entrevistas e gere relatorios comparativos de candidatos.',
  social_media: 'Voce e um agente de redes sociais. Crie posts para midias sociais, sugira cronogramas de publicacao, monitore mencoes da marca e gere resumos semanais de desempenho social.',
  mercado_livre: 'Voce e um agente do Mercado Livre. Monitore anuncios de produtos, responda perguntas de compradores, acompanhe status de pedidos e alerte sobre estoque baixo.',
  inventory_monitor: 'Voce e um agente monitor de estoque. Monitore niveis de inventario de planilhas e dados de ERP, sinalize itens abaixo do limite de reposicao, gere relatorios semanais de estoque e envie alertas criticos.',
  legal_research: 'Voce e um agente de pesquisa juridica especializado em direito brasileiro. Pesquise topicos legais, resuma legislacao incluindo LGPD e redija esbocos de documentos juridicos.',
  ad_analyst: 'Voce e um agente analista de campanhas publicitarias. Analise dados de campanhas do Google Ads e Meta Ads, identifique melhores e piores desempenhos, recomende realocacao de orcamento e gere relatorios semanais.',
  account_manager: 'Voce e um agente gestor de contas. Gerencie relacionamentos com clientes existentes, envie mensagens periodicas de acompanhamento, sinalize clientes com risco de churn e agende reunioes de revisao.',
  deployment_monitor: 'Voce e um agente monitor de deploys. Monitore o GitHub para PRs e deployments, resuma mudancas, sinalize problemas potenciais e gere relatorios semanais de deployment.',
  custom: '',
};

/* -------------------------------------------------------------------------- */
/*  Slug helper                                                               */
/* -------------------------------------------------------------------------- */

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({
  steps,
  current,
  t,
}: {
  steps: readonly string[];
  current: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((stepKey, idx) => {
        const isCompleted = idx < current;
        const isCurrent = idx === current;
        const isLast = idx === steps.length - 1;

        return (
          <div key={stepKey} className="flex items-center">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center border text-[9px] font-bold transition-colors ${
                  isCurrent
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : isCompleted
                      ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
                      : 'border-border-default bg-bg-base text-text-muted'
                }`}
              >
                {isCompleted ? <Check size={10} strokeWidth={2.5} /> : idx + 1}
              </div>
              <span
                className={`mt-1 hidden text-[8px] uppercase tracking-[0.1em] sm:block ${
                  isCurrent ? 'text-accent-cyan' : isCompleted ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {t(stepKey)}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={`mx-1 h-px w-4 sm:w-8 ${
                  isCompleted ? 'bg-accent-cyan' : 'bg-border-default'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 0: Name + Archetype                                                  */
/* -------------------------------------------------------------------------- */

function StepNameArchetype({
  name,
  setName,
  slug,
  archetype,
  setArchetype,
  t,
}: {
  name: string;
  setName: (v: string) => void;
  slug: string;
  archetype: Archetype | null;
  setArchetype: (v: Archetype) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Name input */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('nameLabel')}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          autoFocus
        />
        {name && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('slugLabel')}:
            </span>
            <span className="text-[10px] font-medium text-accent-cyan">{slug}</span>
          </div>
        )}
      </div>

      {/* Archetype grid */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('archetypeLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('archetypeHint')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {ARCHETYPES.map((a) => {
            const Icon = a.icon;
            const isSelected = archetype === a.id;

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setArchetype(a.id)}
                className={`flex flex-col items-center gap-2 border p-3 text-center transition-colors ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                    : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover hover:text-text-primary'
                }`}
              >
                <Icon size={18} strokeWidth={1.2} />
                <span className="text-[10px] font-medium">{t(a.nameKey)}</span>
                <span className="text-[8px] leading-tight text-text-muted">
                  {t(a.descKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1: System Prompt                                                     */
/* -------------------------------------------------------------------------- */

function StepSystemPrompt({
  promptEn,
  setPromptEn,
  promptPtBr,
  setPromptPtBr,
  t,
}: {
  promptEn: string;
  setPromptEn: (v: string) => void;
  promptPtBr: string;
  setPromptPtBr: (v: string) => void;
  t: (key: string) => string;
}) {
  const [tab, setTab] = useState<PromptTab>('en');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('promptLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('promptHint')}</p>
      </div>

      {/* Language tabs */}
      <div className="flex gap-1">
        {(['en', 'ptBr'] as const).map((tabId) => {
          const isActive = tab === tabId;
          const labelKey = tabId === 'en' ? 'promptTabEn' : 'promptTabPtBr';
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={`border px-3 py-1.5 text-[10px] transition-colors ${
                isActive
                  ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                  : 'border-border-default text-text-muted hover:border-border-hover hover:text-text-secondary'
              }`}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      {tab === 'en' && (
        <textarea
          value={promptEn}
          onChange={(e) => setPromptEn(e.target.value)}
          placeholder={t('promptPlaceholder')}
          rows={12}
          className="w-full border border-border-default bg-bg-base px-3 py-2 font-mono text-[11px] leading-relaxed text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
        />
      )}
      {tab === 'ptBr' && (
        <textarea
          value={promptPtBr}
          onChange={(e) => setPromptPtBr(e.target.value)}
          placeholder={t('promptPlaceholder')}
          rows={12}
          className="w-full border border-border-default bg-bg-base px-3 py-2 font-mono text-[11px] leading-relaxed text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Tool Selection                                                    */
/* -------------------------------------------------------------------------- */

function StepToolSelection({
  selectedTools,
  toggleTool,
  t,
}: {
  selectedTools: Set<string>;
  toggleTool: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('toolsLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">
          {t('toolsHint')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const isChecked = selectedTools.has(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => toggleTool(tool.id)}
              className={`flex items-start gap-3 border p-3 text-left transition-colors ${
                isChecked
                  ? 'border-accent-cyan bg-accent-cyan/5'
                  : 'border-border-default bg-bg-base hover:border-border-hover'
              }`}
            >
              {/* Checkbox indicator */}
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
                  isChecked
                    ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
                    : 'border-border-default bg-bg-deepest'
                }`}
              >
                {isChecked && <Check size={10} strokeWidth={2.5} />}
              </div>
              <div className="min-w-0">
                <span className={`block text-[10px] font-medium ${isChecked ? 'text-accent-cyan' : 'text-text-primary'}`}>
                  {t(tool.nameKey)}
                </span>
                <span className="block text-[8px] text-text-muted">{t(tool.descKey)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3: Memory Configuration                                              */
/* -------------------------------------------------------------------------- */

function StepMemoryConfig({
  memoryScope,
  setMemoryScope,
  maxActions,
  setMaxActions,
  t,
}: {
  memoryScope: MemoryScope;
  setMemoryScope: (v: MemoryScope) => void;
  maxActions: number;
  setMaxActions: (v: number) => void;
  t: (key: string) => string;
}) {
  const options: { id: MemoryScope; nameKey: string; descKey: string }[] = [
    { id: 'read_only', nameKey: 'memoryReadOnly', descKey: 'memoryReadOnlyDesc' },
    { id: 'read_write', nameKey: 'memoryReadWrite', descKey: 'memoryReadWriteDesc' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('memoryLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('memoryHint')}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          {options.map((opt) => {
            const isSelected = memoryScope === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMemoryScope(opt.id)}
                className={`flex flex-1 items-center gap-3 border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/5'
                    : 'border-border-default bg-bg-base hover:border-border-hover'
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-none border transition-colors ${
                    isSelected
                      ? 'border-accent-cyan'
                      : 'border-border-default'
                  }`}
                >
                  {isSelected && <div className="h-2 w-2 rounded-none bg-accent-cyan" />}
                </div>
                <div>
                  <span className={`block text-[10px] font-medium ${isSelected ? 'text-accent-cyan' : 'text-text-primary'}`}>
                    {t(opt.nameKey)}
                  </span>
                  <span className="block text-[8px] text-text-muted">{t(opt.descKey)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Max actions */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('maxActionsLabel')}
        </label>
        <p className="mb-2 text-[9px] text-text-muted">{t('maxActionsHint')}</p>
        <Input
          type="number"
          min={1}
          max={1000}
          value={maxActions}
          onChange={(e) => setMaxActions(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-32"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4: Trigger Configuration                                             */
/* -------------------------------------------------------------------------- */

function StepTriggerConfig({
  triggerType,
  setTriggerType,
  cronExpr,
  setCronExpr,
  eventName,
  setEventName,
  sourceAgentId,
  setSourceAgentId,
  t,
}: {
  triggerType: TriggerType;
  setTriggerType: (v: TriggerType) => void;
  cronExpr: string;
  setCronExpr: (v: string) => void;
  eventName: string;
  setEventName: (v: string) => void;
  sourceAgentId: string;
  setSourceAgentId: (v: string) => void;
  t: (key: string) => string;
}) {
  const agentsQuery = trpc.agents.list.useQuery(undefined, { retry: false });
  const agents = agentsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('triggerLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('triggerHint')}</p>

        <div className="flex flex-col gap-2">
          {TRIGGER_OPTIONS.map((opt) => {
            const isSelected = triggerType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTriggerType(opt.id)}
                className={`flex items-center gap-3 border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/5'
                    : 'border-border-default bg-bg-base hover:border-border-hover'
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-none border transition-colors ${
                    isSelected ? 'border-accent-cyan' : 'border-border-default'
                  }`}
                >
                  {isSelected && <div className="h-2 w-2 rounded-none bg-accent-cyan" />}
                </div>
                <div>
                  <span className={`block text-[10px] font-medium ${isSelected ? 'text-accent-cyan' : 'text-text-primary'}`}>
                    {t(opt.nameKey)}
                  </span>
                  <span className="block text-[8px] text-text-muted">{t(opt.descKey)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional fields */}
      {triggerType === 'scheduled' && (
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('cronLabel')}
          </label>
          <Input
            value={cronExpr}
            onChange={(e) => setCronExpr(e.target.value)}
            placeholder={t('cronPlaceholder')}
            className="w-64 font-mono"
          />
        </div>
      )}

      {triggerType === 'event' && (
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('eventNameLabel')}
          </label>
          <Input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder={t('eventNamePlaceholder')}
            className="w-64"
          />
        </div>
      )}

      {triggerType === 'agent' && (
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('sourceAgentLabel')}
          </label>
          <div className="relative w-64">
            <select
              value={sourceAgentId}
              onChange={(e) => setSourceAgentId(e.target.value)}
              className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
            >
              <option value="">{t('sourceAgentPlaceholder')}</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              strokeWidth={1.5}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 5: Team Assignment                                                   */
/* -------------------------------------------------------------------------- */

function StepTeamAssignment({
  team,
  setTeam,
  t,
}: {
  team: Team;
  setTeam: (v: Team) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('teamLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('teamHint')}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TEAMS.map((opt) => {
          const isSelected = team === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTeam(opt.id)}
              className={`flex flex-col items-center gap-2 border p-4 text-center transition-colors ${
                isSelected
                  ? 'border-accent-cyan bg-accent-cyan/5'
                  : 'border-border-default bg-bg-base hover:border-border-hover'
              }`}
            >
              <span className={`text-[10px] font-medium ${isSelected ? 'text-accent-cyan' : 'text-text-primary'}`}>
                {t(opt.nameKey)}
              </span>
              <span className="text-[8px] text-text-muted">{t(opt.descKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 6: Review                                                            */
/* -------------------------------------------------------------------------- */

function StepReview({
  name,
  slug,
  archetype,
  promptEn,
  promptPtBr,
  selectedTools,
  memoryScope,
  maxActions,
  triggerType,
  team,
  t,
}: {
  name: string;
  slug: string;
  archetype: Archetype | null;
  promptEn: string;
  promptPtBr: string;
  selectedTools: Set<string>;
  memoryScope: MemoryScope;
  maxActions: number;
  triggerType: TriggerType;
  team: Team;
  t: (key: string) => string;
}) {
  const reviewRows: { labelKey: string; value: string }[] = [
    { labelKey: 'reviewName', value: name || t('reviewNotSet') },
    { labelKey: 'reviewSlug', value: slug || t('reviewNotSet') },
    {
      labelKey: 'reviewArchetype',
      value: archetype
        ? t(ARCHETYPES.find((a) => a.id === archetype)?.nameKey ?? 'archetypeCustom')
        : t('reviewNotSet'),
    },
    {
      labelKey: 'reviewPromptEn',
      value: promptEn ? `${promptEn.slice(0, 80)}${promptEn.length > 80 ? '...' : ''}` : t('reviewNotSet'),
    },
    {
      labelKey: 'reviewPromptPtBr',
      value: promptPtBr ? `${promptPtBr.slice(0, 80)}${promptPtBr.length > 80 ? '...' : ''}` : t('reviewNotSet'),
    },
    {
      labelKey: 'reviewMemory',
      value: memoryScope === 'read_write' ? t('memoryReadWrite') : t('memoryReadOnly'),
    },
    { labelKey: 'reviewMaxActions', value: String(maxActions) },
    {
      labelKey: 'reviewTrigger',
      value: t(TRIGGER_OPTIONS.find((o) => o.id === triggerType)?.nameKey ?? 'triggerManual'),
    },
    {
      labelKey: 'reviewTeam',
      value: team === 'none'
        ? t('teamNone')
        : t(TEAMS.find((o) => o.id === team)?.nameKey ?? 'teamNone'),
    },
  ];

  const toolNames = TOOLS.filter((t) => selectedTools.has(t.id));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('reviewLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('reviewHint')}</p>
      </div>

      <div className="flex flex-col gap-0">
        {reviewRows.map((row) => (
          <div
            key={row.labelKey}
            className="flex items-start justify-between border border-border-default bg-bg-base px-3 py-2 -mt-px first:mt-0"
          >
            <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-text-muted">
              {t(row.labelKey)}
            </span>
            <span className="max-w-[60%] text-right text-[10px] text-text-primary">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Tools section */}
      <div className="border border-border-default bg-bg-base px-3 py-2">
        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-text-muted">
          {t('reviewTools')}
        </span>
        {toolNames.length === 0 ? (
          <p className="mt-1 text-[10px] text-text-muted">{t('reviewNoneSelected')}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            {toolNames.map((tool) => (
              <Badge key={tool.id} variant="cyan">
                <Wrench size={8} strokeWidth={1.5} className="mr-0.5" />
                {t(tool.nameKey)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Wizard Page                                                          */
/* -------------------------------------------------------------------------- */

export default function AgentWizardPage() {
  const t = useTranslations('agentWizard');
  const router = useRouter();

  /* ---- Wizard step ---- */
  const [step, setStep] = useState<number>(0);

  /* ---- Step 0 state ---- */
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState<Archetype | null>(null);

  /* ---- Step 1 state ---- */
  const [promptEn, setPromptEn] = useState('');
  const [promptPtBr, setPromptPtBr] = useState('');

  /* ---- Step 2 state ---- */
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  /* ---- Step 3 state ---- */
  const [memoryScope, setMemoryScope] = useState<MemoryScope>('read_only');
  const [maxActions, setMaxActions] = useState(20);

  /* ---- Step 4 state ---- */
  const [triggerType, setTriggerType] = useState<TriggerType>('manual');
  const [cronExpr, setCronExpr] = useState('');
  const [eventName, setEventName] = useState('');
  const [sourceAgentId, setSourceAgentId] = useState('');

  /* ---- Step 5 state ---- */
  const [team, setTeam] = useState<Team>('none');

  /* ---- Derived ---- */
  const slug = useMemo(() => toSlug(name), [name]);

  /* ---- Archetype selection handler with prefill ---- */
  const handleArchetypeSelect = useCallback(
    (id: Archetype) => {
      setArchetype(id);

      // Pre-fill prompts
      setPromptEn(ARCHETYPE_DEFAULT_PROMPTS_EN[id]);
      setPromptPtBr(ARCHETYPE_DEFAULT_PROMPTS_PTBR[id]);

      // Pre-fill tools
      setSelectedTools(new Set(ARCHETYPE_DEFAULT_TOOLS[id]));
    },
    [],
  );

  /* ---- Tool toggle ---- */
  const toggleTool = useCallback((id: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /* ---- Step validation ---- */
  const isStepValid = useMemo(() => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return true; // Prompts are optional
      case 2:
        return true; // Tools are optional
      case 3:
        return true; // Memory config always has defaults
      case 4: {
        if (triggerType === 'scheduled' && !cronExpr.trim()) return false;
        if (triggerType === 'event' && !eventName.trim()) return false;
        if (triggerType === 'agent' && !sourceAgentId) return false;
        return true;
      }
      case 5:
        return true; // Team is optional
      case 6:
        return name.trim().length > 0;
      default:
        return false;
    }
  }, [step, name, triggerType, cronExpr, eventName, sourceAgentId]);

  /* ---- Create mutation ---- */
  const createMutation = trpc.agents.create.useMutation({
    onSuccess: () => {
      router.push('/agents');
    },
  });

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      name: name.trim(),
      slug,
      archetype: archetype ?? 'custom',
      systemPromptEn: promptEn || undefined,
      systemPromptPtBr: promptPtBr || undefined,
      triggerType: triggerType,
      tools: Array.from(selectedTools),
      team: team === 'none' ? undefined : team,
      config: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4096,
        budget: 10,
      },
    });
  }, [name, slug, archetype, promptEn, promptPtBr, triggerType, selectedTools, team, createMutation]);

  /* ---- Navigation ---- */
  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border-default px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
              {t('title')}
            </h1>
            <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
          </div>
          <span className="text-[9px] text-text-muted">
            {t('step', { current: String(step + 1), total: String(STEPS.length) })}
          </span>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex justify-center">
          <StepIndicator steps={STEPS} current={step} t={t} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl">
          {step === 0 && (
            <StepNameArchetype
              name={name}
              setName={setName}
              slug={slug}
              archetype={archetype}
              setArchetype={handleArchetypeSelect}
              t={t}
            />
          )}
          {step === 1 && (
            <StepSystemPrompt
              promptEn={promptEn}
              setPromptEn={setPromptEn}
              promptPtBr={promptPtBr}
              setPromptPtBr={setPromptPtBr}
              t={t}
            />
          )}
          {step === 2 && (
            <StepToolSelection
              selectedTools={selectedTools}
              toggleTool={toggleTool}
              t={t}
            />
          )}
          {step === 3 && (
            <StepMemoryConfig
              memoryScope={memoryScope}
              setMemoryScope={setMemoryScope}
              maxActions={maxActions}
              setMaxActions={setMaxActions}
              t={t}
            />
          )}
          {step === 4 && (
            <StepTriggerConfig
              triggerType={triggerType}
              setTriggerType={setTriggerType}
              cronExpr={cronExpr}
              setCronExpr={setCronExpr}
              eventName={eventName}
              setEventName={setEventName}
              sourceAgentId={sourceAgentId}
              setSourceAgentId={setSourceAgentId}
              t={t}
            />
          )}
          {step === 5 && (
            <StepTeamAssignment
              team={team}
              setTeam={setTeam}
              t={t}
            />
          )}
          {step === 6 && (
            <StepReview
              name={name}
              slug={slug}
              archetype={archetype}
              promptEn={promptEn}
              promptPtBr={promptPtBr}
              selectedTools={selectedTools}
              memoryScope={memoryScope}
              maxActions={maxActions}
              triggerType={triggerType}
              team={team}
              t={t}
            />
          )}

          {/* Mutation feedback */}
          {createMutation.isError && (
            <p className="mt-3 text-[10px] text-status-error">
              {t('createError')}: {createMutation.error.message}
            </p>
          )}
          {createMutation.isSuccess && (
            <p className="mt-3 text-[10px] text-status-success">{t('createSuccess')}</p>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <Button
          variant="secondary"
          size="md"
          onClick={goBack}
          disabled={step === 0}
        >
          <ArrowLeft size={12} strokeWidth={1.5} className="mr-1" />
          {t('back')}
        </Button>

        {isLastStep ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            disabled={!isStepValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={12} strokeWidth={1.5} className="mr-1 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('createAgent')
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!isStepValid}
          >
            {t('next')}
            <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
