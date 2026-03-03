import type { MarketFocus } from '../types/index.js';
import {
  PROCESS_AGENT_TEMPLATES,
  getAgentTemplatesByDepartment,
  getAgentTemplateBySlug,
} from './process-agent-templates.js';
import type { ProcessAgentTemplate } from './process-agent-templates.js';

/** Agent spec for template provisioning */
export interface CompanyTemplateAgent {
  archetype: string;
  nameEn: string;
  namePtBr: string;
  tools: string[];
  systemPromptEn?: string;
  systemPromptPtBr?: string;
  ragDocuments?: string[];
}

/** Workflow spec for template provisioning */
export interface CompanyTemplateWorkflow {
  nameEn: string;
  namePtBr: string;
  triggerType: string;
  steps: string[];
}

export interface CompanyTemplateDefinition {
  slug: string;
  nameEn: string;
  namePtBr: string;
  descriptionEn: string;
  descriptionPtBr: string;
  sector: string;
  marketFocus: MarketFocus;
  icon: string;
  sortOrder: number;
  defaultAgents: CompanyTemplateAgent[];
  defaultWorkflows: CompanyTemplateWorkflow[];
}

/* -------------------------------------------------------------------------- */
/*  Helper: map process agent templates to company template agents             */
/* -------------------------------------------------------------------------- */

function toCompanyAgent(t: ProcessAgentTemplate): CompanyTemplateAgent {
  return {
    archetype: t.archetype,
    nameEn: t.nameEn,
    namePtBr: t.namePtBr,
    tools: t.tools,
    systemPromptEn: t.systemPromptEn,
    systemPromptPtBr: t.systemPromptPtBr,
    ragDocuments: t.ragDocuments,
  };
}

/* -------------------------------------------------------------------------- */
/*  Brazil-focused templates                                                  */
/* -------------------------------------------------------------------------- */

const AGENCIA_MARKETING_BR: CompanyTemplateDefinition = {
  slug: 'agencia-marketing-br',
  nameEn: 'Marketing Agency (BR)',
  namePtBr: 'Agência de Marketing',
  descriptionEn: 'Full-service Brazilian marketing agency with social media, content, ads, and CRM integration.',
  descriptionPtBr: 'Agência de marketing brasileira completa com redes sociais, conteúdo, anúncios e integração CRM.',
  sector: 'marketing',
  marketFocus: 'br',
  icon: 'megaphone',
  sortOrder: 1,
  defaultAgents: [
    { archetype: 'social_media', nameEn: 'Social Media Manager', namePtBr: 'Gestor de Redes Sociais', tools: ['schedule_post', 'analyze_engagement'] },
    { archetype: 'content_writer', nameEn: 'Content Writer', namePtBr: 'Redator de Conteúdo', tools: ['generate_text', 'seo_analysis'] },
    { archetype: 'ad_analyst', nameEn: 'Ads Analyst', namePtBr: 'Analista de Anúncios', tools: ['analyze_campaign', 'generate_report'] },
    { archetype: 'account_manager', nameEn: 'Account Manager', namePtBr: 'Gerente de Contas', tools: ['send_whatsapp_message', 'read_whatsapp_messages'] },
    { archetype: 'data_analyst', nameEn: 'Performance Analyst', namePtBr: 'Analista de Performance', tools: ['query_data', 'generate_report'] },
  ],
  defaultWorkflows: [
    { nameEn: 'Weekly Report', namePtBr: 'Relatório Semanal', triggerType: 'scheduled', steps: ['collect_metrics', 'generate_report', 'send_whatsapp_message'] },
    { nameEn: 'New Lead Follow-up', namePtBr: 'Follow-up de Novo Lead', triggerType: 'event', steps: ['enrich_lead', 'send_welcome', 'schedule_followup'] },
  ],
};

const ECOMMERCE_BR: CompanyTemplateDefinition = {
  slug: 'ecommerce-br',
  nameEn: 'E-Commerce (BR)',
  namePtBr: 'E-Commerce BR',
  descriptionEn: 'Brazilian e-commerce with Mercado Livre integration, inventory monitoring, and WhatsApp customer support.',
  descriptionPtBr: 'E-commerce brasileiro com integração Mercado Livre, monitoramento de estoque e suporte via WhatsApp.',
  sector: 'retail',
  marketFocus: 'br',
  icon: 'shopping-cart',
  sortOrder: 2,
  defaultAgents: [
    { archetype: 'mercado_livre', nameEn: 'Mercado Livre Manager', namePtBr: 'Gestor Mercado Livre', tools: ['list_product', 'update_price', 'check_orders'] },
    { archetype: 'inventory_monitor', nameEn: 'Inventory Monitor', namePtBr: 'Monitor de Estoque', tools: ['check_stock', 'generate_alert'] },
    { archetype: 'support', nameEn: 'Customer Support', namePtBr: 'Suporte ao Cliente', tools: ['send_whatsapp_message', 'read_whatsapp_messages', 'search_knowledge'] },
    { archetype: 'data_analyst', nameEn: 'Sales Analyst', namePtBr: 'Analista de Vendas', tools: ['query_data', 'generate_report'] },
  ],
  defaultWorkflows: [
    { nameEn: 'Low Stock Alert', namePtBr: 'Alerta de Estoque Baixo', triggerType: 'scheduled', steps: ['check_stock', 'generate_alert', 'notify_team'] },
    { nameEn: 'Order Follow-up', namePtBr: 'Follow-up de Pedido', triggerType: 'event', steps: ['check_delivery', 'send_whatsapp_message'] },
  ],
};

const ESCRITORIO_ADVOCACIA: CompanyTemplateDefinition = {
  slug: 'escritorio-advocacia',
  nameEn: 'Law Firm (BR)',
  namePtBr: 'Escritório de Advocacia',
  descriptionEn: 'Brazilian law firm with legal research, document analysis, and client communication via WhatsApp.',
  descriptionPtBr: 'Escritório de advocacia brasileiro com pesquisa jurídica, análise de documentos e comunicação via WhatsApp.',
  sector: 'legal',
  marketFocus: 'br',
  icon: 'scale',
  sortOrder: 3,
  defaultAgents: [
    { archetype: 'legal_research', nameEn: 'Legal Researcher', namePtBr: 'Pesquisador Jurídico', tools: ['search_knowledge', 'analyze_document'] },
    { archetype: 'content_writer', nameEn: 'Legal Writer', namePtBr: 'Redator Jurídico', tools: ['generate_text', 'analyze_document'] },
    { archetype: 'account_manager', nameEn: 'Client Manager', namePtBr: 'Gestor de Clientes', tools: ['send_whatsapp_message', 'read_whatsapp_messages'] },
    { archetype: 'data_analyst', nameEn: 'Case Analyst', namePtBr: 'Analista de Casos', tools: ['query_data', 'generate_report'] },
  ],
  defaultWorkflows: [
    { nameEn: 'Case Deadline Monitor', namePtBr: 'Monitor de Prazos', triggerType: 'scheduled', steps: ['check_deadlines', 'generate_alert', 'notify_team'] },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Global templates                                                          */
/* -------------------------------------------------------------------------- */

const MARKETING_AGENCY_GLOBAL: CompanyTemplateDefinition = {
  slug: 'marketing-agency',
  nameEn: 'Marketing Agency',
  namePtBr: 'Agência de Marketing (Global)',
  descriptionEn: 'Full-service marketing agency with content, social media, analytics, and email campaigns.',
  descriptionPtBr: 'Agência de marketing completa com conteúdo, redes sociais, analytics e campanhas de e-mail.',
  sector: 'marketing',
  marketFocus: 'global',
  icon: 'megaphone',
  sortOrder: 10,
  defaultAgents: [
    { archetype: 'social_media', nameEn: 'Social Media Manager', namePtBr: 'Gestor de Redes Sociais', tools: ['schedule_post', 'analyze_engagement'] },
    { archetype: 'content_writer', nameEn: 'Content Writer', namePtBr: 'Redator de Conteúdo', tools: ['generate_text', 'seo_analysis'] },
    { archetype: 'email_campaign_manager', nameEn: 'Email Campaign Manager', namePtBr: 'Gestor de E-mail Marketing', tools: ['send_email', 'analyze_campaign'] },
    { archetype: 'ad_analyst', nameEn: 'Ads Analyst', namePtBr: 'Analista de Anúncios', tools: ['analyze_campaign', 'generate_report'] },
    { archetype: 'data_analyst', nameEn: 'Performance Analyst', namePtBr: 'Analista de Performance', tools: ['query_data', 'generate_report'] },
  ],
  defaultWorkflows: [
    { nameEn: 'Weekly Performance Report', namePtBr: 'Relatório Semanal de Performance', triggerType: 'scheduled', steps: ['collect_metrics', 'generate_report', 'send_email'] },
    { nameEn: 'Content Calendar', namePtBr: 'Calendário de Conteúdo', triggerType: 'scheduled', steps: ['plan_content', 'schedule_post'] },
  ],
};

const SOFTWARE_STARTUP: CompanyTemplateDefinition = {
  slug: 'software-startup',
  nameEn: 'Software Startup',
  namePtBr: 'Startup de Software',
  descriptionEn: 'Tech startup with development monitoring, project management, research, and deployment automation.',
  descriptionPtBr: 'Startup de tecnologia com monitoramento de desenvolvimento, gestão de projetos, pesquisa e automação de deploy.',
  sector: 'technology',
  marketFocus: 'global',
  icon: 'code',
  sortOrder: 11,
  defaultAgents: [
    { archetype: 'developer', nameEn: 'Dev Assistant', namePtBr: 'Assistente de Dev', tools: ['search_knowledge', 'analyze_document'] },
    { archetype: 'deployment_monitor', nameEn: 'Deployment Monitor', namePtBr: 'Monitor de Deploy', tools: ['check_status', 'generate_alert'] },
    { archetype: 'project_manager', nameEn: 'Project Manager', namePtBr: 'Gerente de Projetos', tools: ['query_data', 'generate_report'] },
    { archetype: 'research', nameEn: 'Research Agent', namePtBr: 'Agente de Pesquisa', tools: ['web_search', 'search_knowledge'] },
  ],
  defaultWorkflows: [
    { nameEn: 'Deploy Health Check', namePtBr: 'Verificação de Saúde do Deploy', triggerType: 'scheduled', steps: ['check_status', 'generate_alert', 'notify_team'] },
    { nameEn: 'Sprint Summary', namePtBr: 'Resumo da Sprint', triggerType: 'scheduled', steps: ['collect_metrics', 'generate_report'] },
  ],
};

const ECOMMERCE_GLOBAL: CompanyTemplateDefinition = {
  slug: 'ecommerce-global',
  nameEn: 'E-Commerce',
  namePtBr: 'E-Commerce (Global)',
  descriptionEn: 'Online store with customer support, inventory management, sales analytics, and email marketing.',
  descriptionPtBr: 'Loja online com suporte ao cliente, gestão de estoque, analytics de vendas e e-mail marketing.',
  sector: 'retail',
  marketFocus: 'global',
  icon: 'shopping-cart',
  sortOrder: 12,
  defaultAgents: [
    { archetype: 'support', nameEn: 'Customer Support', namePtBr: 'Suporte ao Cliente', tools: ['search_knowledge', 'send_email'] },
    { archetype: 'inventory_monitor', nameEn: 'Inventory Monitor', namePtBr: 'Monitor de Estoque', tools: ['check_stock', 'generate_alert'] },
    { archetype: 'data_analyst', nameEn: 'Sales Analyst', namePtBr: 'Analista de Vendas', tools: ['query_data', 'generate_report'] },
    { archetype: 'email_campaign_manager', nameEn: 'Email Campaign Manager', namePtBr: 'Gestor de E-mail Marketing', tools: ['send_email', 'analyze_campaign'] },
  ],
  defaultWorkflows: [
    { nameEn: 'Low Stock Alert', namePtBr: 'Alerta de Estoque Baixo', triggerType: 'scheduled', steps: ['check_stock', 'generate_alert', 'notify_team'] },
    { nameEn: 'Abandoned Cart Recovery', namePtBr: 'Recuperação de Carrinho Abandonado', triggerType: 'event', steps: ['detect_abandonment', 'send_email'] },
  ],
};

const BLANK_CANVAS: CompanyTemplateDefinition = {
  slug: 'blank-canvas',
  nameEn: 'Blank Canvas',
  namePtBr: 'Projeto em Branco',
  descriptionEn: 'Start from scratch — configure your own agents, workflows, and integrations.',
  descriptionPtBr: 'Comece do zero — configure seus próprios agentes, workflows e integrações.',
  sector: 'general',
  marketFocus: 'both',
  icon: 'layout',
  sortOrder: 99,
  defaultAgents: [],
  defaultWorkflows: [],
};

/* -------------------------------------------------------------------------- */
/*  Department templates (BR) — agents from PROCESS_AGENT_TEMPLATES           */
/* -------------------------------------------------------------------------- */

interface DeptConfig {
  slug: string;
  nameEn: string;
  namePtBr: string;
  descriptionEn: string;
  descriptionPtBr: string;
  agentSlugs: string[];
  sector: string;
  icon: string;
  sortOrder: number;
}

function buildDeptTemplate(cfg: DeptConfig): CompanyTemplateDefinition {
  const agents = cfg.agentSlugs
    .map(s => getAgentTemplateBySlug(s))
    .filter((t): t is ProcessAgentTemplate => t !== undefined)
    .map(toCompanyAgent);
  return {
    slug: cfg.slug,
    nameEn: cfg.nameEn,
    namePtBr: cfg.namePtBr,
    descriptionEn: cfg.descriptionEn,
    descriptionPtBr: cfg.descriptionPtBr,
    sector: cfg.sector,
    marketFocus: 'br',
    icon: cfg.icon,
    sortOrder: cfg.sortOrder,
    defaultAgents: agents,
    defaultWorkflows: [],
  };
}

const EMPRESA_COMPLETA_BR: CompanyTemplateDefinition = {
  slug: 'empresa-completa-br',
  nameEn: 'Complete Company (BR)',
  namePtBr: 'Empresa Completa',
  descriptionEn: 'Full Brazilian company with all 55 agents across 12 departments — legal, tax, accounting, HR, sales, marketing, operations, support, IT, compliance, treasury, and planning.',
  descriptionPtBr: 'Empresa brasileira completa com todos os 55 agentes em 12 departamentos — jurídico, tributário, contabilidade, RH, vendas, marketing, operações, atendimento, TI, compliance, tesouraria e planejamento.',
  sector: 'general',
  marketFocus: 'br',
  icon: 'building',
  sortOrder: 20,
  defaultAgents: PROCESS_AGENT_TEMPLATES.map(toCompanyAgent),
  defaultWorkflows: [],
};

const DEPT_JURIDICO = buildDeptTemplate({
  slug: 'dept-juridico',
  nameEn: 'Legal Department',
  namePtBr: 'Departamento Jurídico',
  descriptionEn: 'Legal department with contract drafting, trademark monitoring, compliance, and corporate formation agents.',
  descriptionPtBr: 'Departamento jurídico com agentes de contratos, marcas, compliance e constituição empresarial.',
  agentSlugs: ['agente-juridico', 'agente-compliance', 'agente-financeiro', 'workflow-orchestrator', 'dashboard-reporter'],
  sector: 'legal',
  icon: 'scale',
  sortOrder: 21,
});

const DEPT_TRIBUTARIO = buildDeptTemplate({
  slug: 'dept-tributario',
  nameEn: 'Tax Department',
  namePtBr: 'Departamento Tributário',
  descriptionEn: 'Tax department with Simples Nacional, Lucro Presumido/Real computation, NF-e issuance, and SPED filing agents.',
  descriptionPtBr: 'Departamento tributário com agentes de apuração Simples/Presumido/Real, emissão de NF-e e SPED.',
  agentSlugs: ['agente-contador', 'agente-fiscal', 'agente-faturamento', 'calendario-fiscal', 'agente-contabil'],
  sector: 'finance',
  icon: 'receipt',
  sortOrder: 22,
});

const DEPT_CONTABILIDADE = buildDeptTemplate({
  slug: 'dept-contabilidade',
  nameEn: 'Accounting Department',
  namePtBr: 'Departamento de Contabilidade',
  descriptionEn: 'Accounting department with DRE, balance sheet, cash flow, accounts receivable/payable, and budget management agents.',
  descriptionPtBr: 'Departamento contábil com agentes de DRE, balanço, fluxo de caixa, contas a receber/pagar e orçamento.',
  agentSlugs: ['agente-financeiro', 'agente-tesoureiro', 'agente-cobranca', 'agente-verificador', 'agente-controller', 'agente-contador', 'agente-faturamento'],
  sector: 'finance',
  icon: 'calculator',
  sortOrder: 23,
});

const DEPT_RH = buildDeptTemplate({
  slug: 'dept-rh',
  nameEn: 'HR Department',
  namePtBr: 'Departamento de RH',
  descriptionEn: 'HR department with CLT hiring, onboarding, payroll, benefits, eSocial, and workplace safety agents.',
  descriptionPtBr: 'Departamento de RH com agentes de admissão CLT, onboarding, folha, benefícios, eSocial e segurança do trabalho.',
  agentSlugs: ['agente-rh', 'agente-financeiro', 'agente-contabil', 'workflow-orchestrator'],
  sector: 'hr',
  icon: 'users',
  sortOrder: 24,
});

const DEPT_VENDAS = buildDeptTemplate({
  slug: 'dept-vendas',
  nameEn: 'Sales Department',
  namePtBr: 'Departamento de Vendas',
  descriptionEn: 'Sales department with CRM pipeline, lead prospecting, proposal generation, contract management, and post-sales agents.',
  descriptionPtBr: 'Departamento de vendas com agentes de CRM, prospecção, propostas, contratos e pós-venda.',
  agentSlugs: ['agente-crm', 'agente-enriquecimento', 'agente-qualificacao', 'agente-propostas', 'agente-contratos', 'agente-cadencia', 'agente-copywriter', 'agente-health-score', 'agente-cs'],
  sector: 'sales',
  icon: 'trending-up',
  sortOrder: 25,
});

const DEPT_MARKETING = buildDeptTemplate({
  slug: 'dept-marketing',
  nameEn: 'Marketing Department',
  namePtBr: 'Departamento de Marketing',
  descriptionEn: 'Marketing department with branding, social media, content, SEO, paid ads, email marketing, and conversion agents.',
  descriptionPtBr: 'Departamento de marketing com agentes de branding, redes sociais, conteúdo, SEO, ads, email marketing e conversão.',
  agentSlugs: ['agente-branding', 'agente-analytics', 'agente-criador-social', 'agente-monitor-social', 'agente-redator', 'agente-distribuidor', 'agente-ads', 'agente-seo', 'agente-copywriter-email', 'agente-automacao-email', 'agente-cro'],
  sector: 'marketing',
  icon: 'megaphone',
  sortOrder: 26,
});

const DEPT_OPERACOES = buildDeptTemplate({
  slug: 'dept-operacoes',
  nameEn: 'Operations Department',
  namePtBr: 'Departamento de Operações',
  descriptionEn: 'Operations department with procurement, inventory, logistics, quality management, SOPs, and KPI agents.',
  descriptionPtBr: 'Departamento de operações com agentes de compras, estoque, logística, qualidade, SOPs e KPIs.',
  agentSlugs: ['agente-compras', 'agente-estoque', 'agente-logistica', 'agente-qualidade', 'agente-processos', 'agente-bi'],
  sector: 'operations',
  icon: 'cog',
  sortOrder: 27,
});

const DEPT_ATENDIMENTO = buildDeptTemplate({
  slug: 'dept-atendimento',
  nameEn: 'Customer Service Department',
  namePtBr: 'Departamento de Atendimento',
  descriptionEn: 'Customer service department with triage, resolution, SLA monitoring, ticket management, and NPS/CSAT agents.',
  descriptionPtBr: 'Departamento de atendimento com agentes de triagem, resolução, SLA, tickets e NPS/CSAT.',
  agentSlugs: ['agente-classificador', 'agente-resolvedor', 'motor-de-sla', 'agente-suporte', 'agente-cx'],
  sector: 'support',
  icon: 'headphones',
  sortOrder: 28,
});

const DEPT_TI = buildDeptTemplate({
  slug: 'dept-ti',
  nameEn: 'IT Department',
  namePtBr: 'Departamento de TI',
  descriptionEn: 'IT department with infrastructure monitoring, security, LGPD compliance, dev lifecycle, and DevOps agents.',
  descriptionPtBr: 'Departamento de TI com agentes de infraestrutura, segurança, LGPD, dev lifecycle e DevOps.',
  agentSlugs: ['agente-infraestrutura', 'agente-seguranca', 'agente-compliance-lgpd', 'agente-dev', 'agente-devops'],
  sector: 'technology',
  icon: 'monitor',
  sortOrder: 29,
});

const DEPT_COMPLIANCE = buildDeptTemplate({
  slug: 'dept-compliance',
  nameEn: 'Compliance Department',
  namePtBr: 'Departamento de Compliance',
  descriptionEn: 'Compliance department with regulatory monitoring, internal audit, risk management, internal controls, and anti-corruption agents.',
  descriptionPtBr: 'Departamento de compliance com agentes de regulatório, auditoria, riscos, controles internos e anticorrupção.',
  agentSlugs: ['agente-compliance', 'agente-auditoria', 'agente-riscos', 'agente-controles', 'dashboard-reporter', 'workflow-orchestrator'],
  sector: 'compliance',
  icon: 'shield-check',
  sortOrder: 30,
});

const DEPT_TESOURARIA = buildDeptTemplate({
  slug: 'dept-tesouraria',
  nameEn: 'Treasury Department',
  namePtBr: 'Departamento de Tesouraria',
  descriptionEn: 'Treasury department with cash management, PIX/boleto collections, credit analysis, investments, and dunning agents.',
  descriptionPtBr: 'Departamento de tesouraria com agentes de gestão de caixa, cobrança PIX/boleto, crédito, investimentos e cobrança.',
  agentSlugs: ['agente-tesoureiro', 'agente-cobranca', 'agente-financeiro', 'agente-verificador', 'workflow-orchestrator'],
  sector: 'finance',
  icon: 'landmark',
  sortOrder: 31,
});

const DEPT_PLANEJAMENTO = buildDeptTemplate({
  slug: 'dept-planejamento',
  nameEn: 'Planning Department',
  namePtBr: 'Departamento de Planejamento',
  descriptionEn: 'Strategic planning department with OKR management, Balanced Scorecard, SWOT analysis, annual planning, and board meeting prep agents.',
  descriptionPtBr: 'Departamento de planejamento com agentes de OKR, BSC, SWOT, planejamento anual e reuniões de diretoria.',
  agentSlugs: ['agente-planejamento', 'agente-controller', 'dashboard-reporter', 'workflow-orchestrator'],
  sector: 'strategy',
  icon: 'target',
  sortOrder: 32,
});

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Data Sync Templates (Phase 9.4)                                           */
/* -------------------------------------------------------------------------- */

const DATA_SYNC_RDSTATION: CompanyTemplateDefinition = {
  slug: 'data-sync-rdstation',
  nameEn: 'RD Station Sync',
  namePtBr: 'Sync RD Station',
  descriptionEn: 'Automated data sync from RD Station CRM into your deals table. Hourly polling for new leads, deals, and contact updates.',
  descriptionPtBr: 'Sincronização automática do RD Station CRM para sua tabela de deals. Consulta horária de novos leads, deals e atualizações de contatos.',
  sector: 'sales',
  marketFocus: 'br',
  icon: 'layout',
  sortOrder: 50,
  defaultAgents: [
    {
      archetype: 'data_analyst',
      nameEn: 'RD Station Sync Agent',
      namePtBr: 'Agente Sync RD Station',
      tools: ['rdstation_list_deals', 'rdstation_list_contacts', 'upsert_deal', 'search_company_memory'],
      systemPromptEn: 'You are a data synchronization agent. Every hour, pull new/updated deals and contacts from RD Station CRM and upsert them into the local deals table. Report any sync errors.',
      systemPromptPtBr: 'Você é um agente de sincronização de dados. A cada hora, busque deals e contatos novos/atualizados do RD Station CRM e insira-os na tabela local de deals. Reporte quaisquer erros de sincronização.',
    },
  ],
  defaultWorkflows: [
    { nameEn: 'Hourly RD Station Sync', namePtBr: 'Sync Horária RD Station', triggerType: 'scheduled', steps: ['fetch_rdstation_data', 'upsert_deals', 'log_results'] },
  ],
};

const DATA_SYNC_META_ADS: CompanyTemplateDefinition = {
  slug: 'data-sync-meta-ads',
  nameEn: 'Meta Ads Sync',
  namePtBr: 'Sync Meta Ads',
  descriptionEn: 'Daily sync of Meta (Facebook/Instagram) Ads campaign performance into your marketing campaigns table.',
  descriptionPtBr: 'Sincronização diária do desempenho de campanhas Meta (Facebook/Instagram) Ads para sua tabela de campanhas de marketing.',
  sector: 'marketing',
  marketFocus: 'both',
  icon: 'megaphone',
  sortOrder: 51,
  defaultAgents: [
    {
      archetype: 'ad_analyst',
      nameEn: 'Meta Ads Sync Agent',
      namePtBr: 'Agente Sync Meta Ads',
      tools: ['meta_ads_list_campaigns', 'meta_ads_get_insights', 'upsert_marketing_campaign', 'generate_report'],
      systemPromptEn: 'You are a Meta Ads data sync agent. Daily, pull campaign performance data (spend, impressions, clicks, conversions) from Meta Marketing API and update the local marketing_campaigns table. Flag any campaigns with anomalous performance.',
      systemPromptPtBr: 'Você é um agente de sincronização de dados Meta Ads. Diariamente, busque dados de desempenho de campanhas (gasto, impressões, cliques, conversões) da API Meta Marketing e atualize a tabela local de marketing_campaigns. Sinalize campanhas com desempenho anômalo.',
    },
  ],
  defaultWorkflows: [
    { nameEn: 'Daily Meta Ads Sync', namePtBr: 'Sync Diária Meta Ads', triggerType: 'scheduled', steps: ['fetch_meta_campaigns', 'update_campaigns', 'generate_performance_report'] },
  ],
};

const DATA_SYNC_GOOGLE_ADS: CompanyTemplateDefinition = {
  slug: 'data-sync-google-ads',
  nameEn: 'Google Ads Sync',
  namePtBr: 'Sync Google Ads',
  descriptionEn: 'Daily sync of Google Ads campaign performance data. Track spend, conversions, CPC, and ROAS automatically.',
  descriptionPtBr: 'Sincronização diária do desempenho de campanhas Google Ads. Acompanhe gasto, conversões, CPC e ROAS automaticamente.',
  sector: 'marketing',
  marketFocus: 'both',
  icon: 'megaphone',
  sortOrder: 52,
  defaultAgents: [
    {
      archetype: 'ad_analyst',
      nameEn: 'Google Ads Sync Agent',
      namePtBr: 'Agente Sync Google Ads',
      tools: ['google_ads_list_campaigns', 'google_ads_get_performance', 'upsert_marketing_campaign', 'generate_report'],
      systemPromptEn: 'You are a Google Ads data sync agent. Daily, pull campaign performance data (cost, clicks, impressions, conversions, CPC, ROAS) from Google Ads API and update the local marketing_campaigns table. Generate alerts for budget overruns or performance drops.',
      systemPromptPtBr: 'Você é um agente de sincronização de dados Google Ads. Diariamente, busque dados de desempenho de campanhas (custo, cliques, impressões, conversões, CPC, ROAS) da API Google Ads e atualize a tabela local de marketing_campaigns. Gere alertas para estouros de orçamento ou quedas de desempenho.',
    },
  ],
  defaultWorkflows: [
    { nameEn: 'Daily Google Ads Sync', namePtBr: 'Sync Diária Google Ads', triggerType: 'scheduled', steps: ['fetch_google_campaigns', 'update_campaigns', 'check_budget_alerts'] },
  ],
};

export const COMPANY_TEMPLATES: CompanyTemplateDefinition[] = [
  // BR — industry
  AGENCIA_MARKETING_BR,
  ECOMMERCE_BR,
  ESCRITORIO_ADVOCACIA,
  // Global
  MARKETING_AGENCY_GLOBAL,
  SOFTWARE_STARTUP,
  ECOMMERCE_GLOBAL,
  // BR — departments
  EMPRESA_COMPLETA_BR,
  DEPT_JURIDICO,
  DEPT_TRIBUTARIO,
  DEPT_CONTABILIDADE,
  DEPT_RH,
  DEPT_VENDAS,
  DEPT_MARKETING,
  DEPT_OPERACOES,
  DEPT_ATENDIMENTO,
  DEPT_TI,
  DEPT_COMPLIANCE,
  DEPT_TESOURARIA,
  DEPT_PLANEJAMENTO,
  // Data Sync
  DATA_SYNC_RDSTATION,
  DATA_SYNC_META_ADS,
  DATA_SYNC_GOOGLE_ADS,
  // Universal
  BLANK_CANVAS,
];

/** Get templates filtered by market focus */
export function getTemplatesForLocale(locale: 'pt-BR' | 'en-US'): CompanyTemplateDefinition[] {
  return COMPANY_TEMPLATES.filter((t) => {
    if (t.marketFocus === 'both') return true;
    if (locale === 'pt-BR') return t.marketFocus === 'br';
    return t.marketFocus === 'global';
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get a template by slug */
export function getTemplateBySlug(slug: string): CompanyTemplateDefinition | undefined {
  return COMPANY_TEMPLATES.find((t) => t.slug === slug);
}
