import type { MarketFocus } from '../types/index.js';

/** Agent spec for template provisioning */
export interface CompanyTemplateAgent {
  archetype: string;
  nameEn: string;
  namePtBr: string;
  tools: string[];
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
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

export const COMPANY_TEMPLATES: CompanyTemplateDefinition[] = [
  // BR
  AGENCIA_MARKETING_BR,
  ECOMMERCE_BR,
  ESCRITORIO_ADVOCACIA,
  // Global
  MARKETING_AGENCY_GLOBAL,
  SOFTWARE_STARTUP,
  ECOMMERCE_GLOBAL,
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
