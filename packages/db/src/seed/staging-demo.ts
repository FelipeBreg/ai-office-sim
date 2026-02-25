/**
 * Staging demo seed — creates a realistic test organization with agents,
 * WhatsApp templates, and wiki content for the staging environment.
 *
 * Usage:
 *   DATABASE_URL=<staging-url> pnpm tsx packages/db/src/seed/staging-demo.ts
 */
import { db } from '../client.js';
import {
  organizations,
  users,
  projects,
  agents,
  whatsappTemplates,
  wikiCategories,
  wikiArticles,
} from '../schema/index.js';

// ---------------------------------------------------------------------------
// 1. Organization
// ---------------------------------------------------------------------------

async function seedOrganization() {
  const [org] = await db
    .insert(organizations)
    .values({
      name: 'Acme Demo Ltda',
      slug: 'acme-demo-ltda',
      clerkOrgId: 'org_staging_demo',
      plan: 'growth',
    })
    .onConflictDoUpdate({
      target: organizations.slug,
      set: { name: 'Acme Demo Ltda', plan: 'growth' },
    })
    .returning();

  console.log(`  Organization: ${org.name} (${org.id})`);
  return org;
}

// ---------------------------------------------------------------------------
// 2. Demo user
// ---------------------------------------------------------------------------

async function seedUser(orgId: string) {
  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: 'user_staging_demo',
      email: 'demo@acmedemo.com.br',
      name: 'Demo Admin',
      orgId,
      role: 'owner',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { name: 'Demo Admin', role: 'owner' },
    })
    .returning();

  console.log(`  User: ${user.name} (${user.id})`);
  return user;
}

// ---------------------------------------------------------------------------
// 3. Project
// ---------------------------------------------------------------------------

async function seedProject(orgId: string) {
  const [project] = await db
    .insert(projects)
    .values({
      orgId,
      name: 'Suporte & Vendas',
      slug: 'suporte-vendas',
      color: '#00C8E0',
      sector: 'Atendimento',
      primaryGoal: 'Automatizar atendimento ao cliente e prospecção de vendas via WhatsApp',
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [projects.orgId, projects.slug],
      set: { name: 'Suporte & Vendas', color: '#00C8E0' },
    })
    .returning();

  console.log(`  Project: ${project.name} (${project.id})`);
  return project;
}

// ---------------------------------------------------------------------------
// 4. Agents — Ana (support), Carlos (sales), Julia (content_writer)
// ---------------------------------------------------------------------------

const AGENT_DEFS = [
  {
    name: 'Ana',
    namePtBr: 'Ana',
    slug: 'ana-support',
    archetype: 'support' as const,
    team: 'support' as const,
    systemPromptPtBr:
      'Você é a Ana, agente de suporte ao cliente da Acme Demo Ltda. ' +
      'Responda dúvidas com empatia, consulte a base de conhecimento antes de responder, ' +
      'e escale para um humano quando necessário.',
    systemPromptEn:
      'You are Ana, customer support agent for Acme Demo Ltda. ' +
      'Answer questions empathetically, consult the knowledge base first, ' +
      'and escalate to a human when needed.',
    config: { model: 'claude-sonnet-4-6', temperature: 0.3, maxTokens: 4096, budget: 10 },
    tools: ['send_whatsapp_message', 'read_whatsapp_messages', 'search_company_memory'],
    triggerType: 'always_on' as const,
    maxActionsPerSession: 20,
  },
  {
    name: 'Carlos',
    namePtBr: 'Carlos',
    slug: 'carlos-sales',
    archetype: 'sales' as const,
    team: 'sales' as const,
    systemPromptPtBr:
      'Você é o Carlos, representante de vendas da Acme Demo Ltda. ' +
      'Qualifique leads, envie propostas e atualize o pipeline de vendas.',
    systemPromptEn:
      'You are Carlos, sales rep for Acme Demo Ltda. ' +
      'Qualify leads, send proposals, and update the sales pipeline.',
    config: { model: 'claude-sonnet-4-6', temperature: 0.5, maxTokens: 4096, budget: 15 },
    tools: ['send_whatsapp_message', 'read_whatsapp_messages', 'search_company_memory', 'send_email'],
    triggerType: 'scheduled' as const,
    triggerConfig: { cron: '0 9 * * 1-5' },
    maxActionsPerSession: 25,
  },
  {
    name: 'Julia',
    namePtBr: 'Julia',
    slug: 'julia-content',
    archetype: 'content_writer' as const,
    team: 'marketing' as const,
    systemPromptPtBr:
      'Você é a Julia, redatora de conteúdo da Acme Demo Ltda. ' +
      'Crie posts de blog, textos para redes sociais e campanhas de email em português brasileiro.',
    systemPromptEn:
      'You are Julia, content writer for Acme Demo Ltda. ' +
      'Create blog posts, social media copy, and email campaigns in Brazilian Portuguese.',
    config: { model: 'claude-sonnet-4-6', temperature: 0.7, maxTokens: 8192, budget: 20 },
    tools: ['search_web', 'search_company_memory', 'write_spreadsheet'],
    triggerType: 'manual' as const,
    maxActionsPerSession: 15,
  },
];

async function seedAgents(projectId: string) {
  const inserted = [];
  for (const def of AGENT_DEFS) {
    const [agent] = await db
      .insert(agents)
      .values({
        projectId,
        ...def,
        status: 'idle',
      })
      .onConflictDoUpdate({
        target: [agents.projectId, agents.slug],
        set: { name: def.name, config: def.config, tools: def.tools },
      })
      .returning();

    inserted.push(agent);
    console.log(`  Agent: ${agent.name} [${def.archetype}] (${agent.id})`);
  }
  return inserted;
}

// ---------------------------------------------------------------------------
// 5. WhatsApp templates
// ---------------------------------------------------------------------------

const TEMPLATE_DEFS = [
  {
    templateName: 'welcome',
    language: 'pt-BR',
    content:
      'Olá {{nome}}! Bem-vindo(a) à Acme Demo. Sou a Ana, sua assistente virtual. Como posso ajudá-lo(a) hoje?',
  },
  {
    templateName: 'follow_up',
    language: 'pt-BR',
    content:
      'Oi {{nome}}, tudo bem? Estou retomando nosso último assunto. Posso ajudar com mais alguma coisa?',
  },
  {
    templateName: 'sales_outreach',
    language: 'pt-BR',
    content:
      'Olá {{nome}}! Aqui é o Carlos da Acme Demo. Vi que você demonstrou interesse em {{produto}}. Posso apresentar nossas soluções?',
  },
  {
    templateName: 'appointment_reminder',
    language: 'pt-BR',
    content:
      'Olá {{nome}}! Lembrando do seu compromisso agendado para {{data}} às {{horário}}. Confirma presença? Responda SIM ou NÃO.',
  },
  {
    templateName: 'support_ticket',
    language: 'pt-BR',
    content:
      'Olá {{nome}}, obrigado por entrar em contato. Seu chamado #{{protocolo}} foi registrado. Retornaremos em breve.',
  },
];

async function seedWhatsAppTemplates(projectId: string) {
  for (const tpl of TEMPLATE_DEFS) {
    await db
      .insert(whatsappTemplates)
      .values({ projectId, ...tpl })
      .onConflictDoNothing();
  }
  console.log(`  WhatsApp templates: ${TEMPLATE_DEFS.length} seeded`);
}

// ---------------------------------------------------------------------------
// 6. Wiki category + article
// ---------------------------------------------------------------------------

async function seedWiki(projectId: string) {
  const [category] = await db
    .insert(wikiCategories)
    .values({
      projectId,
      name: 'Políticas da Empresa',
      slug: 'politicas-empresa',
      description: 'Documentos internos com políticas, processos e diretrizes da Acme Demo Ltda.',
      icon: 'book',
      sortOrder: 0,
    })
    .onConflictDoUpdate({
      target: [wikiCategories.projectId, wikiCategories.slug],
      set: { name: 'Políticas da Empresa' },
    })
    .returning();

  console.log(`  Wiki category: ${category.name} (${category.id})`);

  const [article] = await db
    .insert(wikiArticles)
    .values({
      projectId,
      categoryId: category.id,
      title: 'Política de Atendimento ao Cliente',
      slug: 'politica-atendimento-cliente',
      summary: 'Diretrizes para atendimento ao cliente via WhatsApp e email.',
      content: `# Política de Atendimento ao Cliente

## Horário de Atendimento
- Segunda a sexta: 08:00 - 18:00 (horário de Brasília)
- Sábados: 09:00 - 13:00
- Domingos e feriados: sem atendimento humano (bot ativo 24h)

## Tempo de Resposta
- Primeiro contato: até 5 minutos (bot automático)
- Resolução simples: até 30 minutos
- Casos complexos: até 4 horas úteis
- Escalonamento: notificar gerente em até 1 hora

## Tom de Comunicação
- Profissional e amigável
- Usar o nome do cliente
- Evitar jargões técnicos
- Ser claro e objetivo

## Escalonamento
1. Nível 1 — Bot (Ana): dúvidas frequentes, status de pedido
2. Nível 2 — Humano: reclamações, trocas, reembolsos
3. Nível 3 — Gerência: casos jurídicos, valores acima de R$ 5.000

## Canais
- WhatsApp: canal principal
- Email: suporte@acmedemo.com.br
- Telefone: apenas para casos críticos`,
      tags: ['atendimento', 'política', 'whatsapp', 'suporte'],
    })
    .onConflictDoUpdate({
      target: [wikiArticles.projectId, wikiArticles.slug],
      set: { title: 'Política de Atendimento ao Cliente' },
    })
    .returning();

  console.log(`  Wiki article: ${article.title} (${article.id})`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedStagingDemo() {
  console.log('=== Seeding staging demo data ===\n');

  const org = await seedOrganization();
  await seedUser(org.id);
  const project = await seedProject(org.id);
  await seedAgents(project.id);
  await seedWhatsAppTemplates(project.id);
  await seedWiki(project.id);

  console.log('\n=== Staging demo seed complete! ===');
}

seedStagingDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Staging seed failed:', err);
    process.exit(1);
  });
