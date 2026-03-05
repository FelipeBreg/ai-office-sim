/**
 * Fleet recommendation engine — pure function, no DB or LLM calls.
 * Given a company profile and sector, recommends teams + agents.
 */

import type { CompanyProfile, FleetRecommendation } from '../types/onboarding.js';

interface SectorConfig {
  teams: Array<{ name: string; slug: string; description: string }>;
  agents: Array<{
    name: string;
    namePtBr: string;
    slug: string;
    archetype: string;
    team: string;
    tools: string[];
    triggerType: string;
    heartbeatIntervalMin?: number;
  }>;
}

const BASE_TEAMS = [
  { name: 'Sales', slug: 'sales', description: 'Revenue generation and deal management' },
  { name: 'Marketing', slug: 'marketing', description: 'Brand awareness and lead generation' },
  { name: 'Support', slug: 'support', description: 'Customer support and satisfaction' },
];

const SECTOR_CONFIGS: Record<string, Partial<SectorConfig>> = {
  'saas': {
    teams: [
      ...BASE_TEAMS,
      { name: 'Development', slug: 'development', description: 'Product development and DevOps' },
    ],
    agents: [
      { name: 'Sales Rep', namePtBr: 'Vendedor', slug: 'sales-rep', archetype: 'sales', team: 'sales', tools: ['send_email', 'send_whatsapp_message', 'search_contacts', 'create_deal', 'list_deals'], triggerType: 'event' },
      { name: 'Lead Qualifier', namePtBr: 'Qualificador de Leads', slug: 'lead-qualifier', archetype: 'sales', team: 'sales', tools: ['search_contacts', 'create_contact', 'send_email', 'search_company_memory'], triggerType: 'event' },
      { name: 'Content Writer', namePtBr: 'Redator', slug: 'content-writer', archetype: 'content_writer', team: 'marketing', tools: ['create_document', 'search_company_memory', 'search_web'], triggerType: 'scheduled', heartbeatIntervalMin: 480 },
      { name: 'Social Media Manager', namePtBr: 'Gestor de Redes Sociais', slug: 'social-media', archetype: 'social_media', team: 'marketing', tools: ['create_document', 'search_web', 'search_company_memory'], triggerType: 'scheduled', heartbeatIntervalMin: 360 },
      { name: 'Support Agent', namePtBr: 'Agente de Suporte', slug: 'support-agent', archetype: 'support', team: 'support', tools: ['send_whatsapp_message', 'read_whatsapp_messages', 'send_email', 'read_email', 'search_company_memory'], triggerType: 'event' },
      { name: 'DevOps Monitor', namePtBr: 'Monitor DevOps', slug: 'devops-monitor', archetype: 'deployment_monitor', team: 'development', tools: ['search_web', 'create_document', 'log_message'], triggerType: 'always_on', heartbeatIntervalMin: 30 },
    ],
  },
  'ecommerce': {
    teams: [
      ...BASE_TEAMS,
      { name: 'Operations', slug: 'operations', description: 'Inventory and logistics management' },
    ],
    agents: [
      { name: 'Sales Rep', namePtBr: 'Vendedor', slug: 'sales-rep', archetype: 'sales', team: 'sales', tools: ['send_email', 'send_whatsapp_message', 'search_contacts', 'create_deal', 'list_deals'], triggerType: 'event' },
      { name: 'Ad Analyst', namePtBr: 'Analista de Ads', slug: 'ad-analyst', archetype: 'ad_analyst', team: 'marketing', tools: ['search_web', 'create_document', 'search_company_memory'], triggerType: 'scheduled', heartbeatIntervalMin: 360 },
      { name: 'Support Agent', namePtBr: 'Agente de Suporte', slug: 'support-agent', archetype: 'support', team: 'support', tools: ['send_whatsapp_message', 'read_whatsapp_messages', 'send_email', 'read_email', 'search_company_memory'], triggerType: 'event' },
      { name: 'Inventory Monitor', namePtBr: 'Monitor de Estoque', slug: 'inventory-monitor', archetype: 'inventory_monitor', team: 'operations', tools: ['search_company_memory', 'create_document', 'log_message'], triggerType: 'always_on', heartbeatIntervalMin: 60 },
      { name: 'Content Writer', namePtBr: 'Redator', slug: 'content-writer', archetype: 'content_writer', team: 'marketing', tools: ['create_document', 'search_company_memory', 'search_web'], triggerType: 'scheduled', heartbeatIntervalMin: 480 },
    ],
  },
  'agency': {
    teams: BASE_TEAMS,
    agents: [
      { name: 'Account Manager', namePtBr: 'Gerente de Contas', slug: 'account-manager', archetype: 'account_manager', team: 'sales', tools: ['send_email', 'send_whatsapp_message', 'search_contacts', 'list_deals', 'search_company_memory'], triggerType: 'event' },
      { name: 'Content Writer', namePtBr: 'Redator', slug: 'content-writer', archetype: 'content_writer', team: 'marketing', tools: ['create_document', 'search_company_memory', 'search_web'], triggerType: 'scheduled', heartbeatIntervalMin: 480 },
      { name: 'Social Media Manager', namePtBr: 'Gestor de Redes Sociais', slug: 'social-media', archetype: 'social_media', team: 'marketing', tools: ['create_document', 'search_web', 'search_company_memory'], triggerType: 'scheduled', heartbeatIntervalMin: 360 },
      { name: 'Ad Analyst', namePtBr: 'Analista de Ads', slug: 'ad-analyst', archetype: 'ad_analyst', team: 'marketing', tools: ['search_web', 'create_document', 'search_company_memory'], triggerType: 'scheduled', heartbeatIntervalMin: 360 },
      { name: 'Support Agent', namePtBr: 'Agente de Suporte', slug: 'support-agent', archetype: 'support', team: 'support', tools: ['send_email', 'read_email', 'search_company_memory'], triggerType: 'event' },
    ],
  },
};

const DEFAULT_CONFIG: SectorConfig = {
  teams: BASE_TEAMS,
  agents: [
    { name: 'Sales Rep', namePtBr: 'Vendedor', slug: 'sales-rep', archetype: 'sales', team: 'sales', tools: ['send_email', 'send_whatsapp_message', 'search_contacts', 'create_deal'], triggerType: 'event' },
    { name: 'Content Writer', namePtBr: 'Redator', slug: 'content-writer', archetype: 'content_writer', team: 'marketing', tools: ['create_document', 'search_company_memory', 'search_web'], triggerType: 'scheduled', heartbeatIntervalMin: 480 },
    { name: 'Support Agent', namePtBr: 'Agente de Suporte', slug: 'support-agent', archetype: 'support', team: 'support', tools: ['send_whatsapp_message', 'read_whatsapp_messages', 'send_email', 'search_company_memory'], triggerType: 'event' },
  ],
};

function matchSector(sector: string): string {
  const s = sector.toLowerCase();
  if (s.includes('saas') || s.includes('software') || s.includes('tech')) return 'saas';
  if (s.includes('ecommerce') || s.includes('e-commerce') || s.includes('loja') || s.includes('varejo') || s.includes('retail')) return 'ecommerce';
  if (s.includes('agenc') || s.includes('agênc') || s.includes('marketing') || s.includes('consulting')) return 'agency';
  return 'default';
}

export function recommendFleet(
  sector: string,
  _profile?: CompanyProfile | null,
): FleetRecommendation {
  const key = matchSector(sector);
  const config = SECTOR_CONFIGS[key] ?? DEFAULT_CONFIG;

  const teams = config.teams ?? DEFAULT_CONFIG.teams;
  const agents = (config.agents ?? DEFAULT_CONFIG.agents).map((a) => ({
    ...a,
    enabled: true,
  }));

  // Rough cost estimate (using Sonnet 4.6 defaults)
  let totalDaily = 0;
  for (const agent of agents) {
    const inputTokens = 2000 + agent.tools.length * 80 + 500;
    const outputTokens = Math.round(inputTokens * 0.6);
    let sessionsPerDay = 2;
    if (agent.triggerType === 'always_on' && agent.heartbeatIntervalMin) {
      sessionsPerDay = 1440 / agent.heartbeatIntervalMin;
    } else if (agent.triggerType === 'scheduled') {
      sessionsPerDay = 4;
    } else if (agent.triggerType === 'event') {
      sessionsPerDay = 5;
    }
    totalDaily += (inputTokens * sessionsPerDay / 1_000_000) * 3.0
      + (outputTokens * sessionsPerDay / 1_000_000) * 15.0;
  }

  return {
    teams,
    agents,
    approvalMode: 'supervised',
    estimatedMonthlyCostUsd: Math.round(totalDaily * 30 * 100) / 100,
  };
}
