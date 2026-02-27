import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import { seedWorkflowTemplates } from './seed/workflow-templates.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  // 1. Upsert test organization
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: 'Acme Corp',
      slug: 'acme-corp',
      clerkOrgId: 'org_test_seed',
      plan: 'growth',
    })
    .onConflictDoUpdate({
      target: schema.organizations.slug,
      set: { name: 'Acme Corp', plan: 'growth' },
    })
    .returning();

  console.log(`  Organization: ${org.name} (${org.id})`);

  // 2. Upsert test user
  const [user] = await db
    .insert(schema.users)
    .values({
      clerkUserId: 'user_test_seed',
      email: 'admin@acme.dev',
      name: 'Admin User',
      orgId: org.id,
      role: 'owner',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    })
    .onConflictDoUpdate({
      target: schema.users.clerkUserId,
      set: { name: 'Admin User', role: 'owner' },
    })
    .returning();

  console.log(`  User: ${user.name} (${user.id})`);

  // 3. Upsert test project
  const [project] = await db
    .insert(schema.projects)
    .values({
      orgId: org.id,
      name: 'AI Office Demo',
      slug: 'ai-office-demo',
      color: '#00C8E0',
      sector: 'Technology',
      primaryGoal: 'Demonstrate AI office simulation capabilities',
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [schema.projects.orgId, schema.projects.slug],
      set: { name: 'AI Office Demo', color: '#00C8E0' },
    })
    .returning();

  console.log(`  Project: ${project.name} (${project.id})`);

  // 4. Upsert 3 sample agents
  const agentDefs = [
    {
      name: 'Support Agent',
      namePtBr: 'Agente de Suporte',
      slug: 'support-agent',
      archetype: 'support' as const,
      systemPromptPtBr:
        'Voce e um agente de suporte ao cliente. Responda duvidas com empatia e precisao.',
      systemPromptEn:
        'You are a customer support agent. Answer questions with empathy and accuracy.',
      config: { model: 'claude-sonnet-4-6', temperature: 0.3, maxTokens: 4096, budget: 10 },
      tools: ['search_company_memory', 'log_message'],
      triggerType: 'manual' as const,
      maxActionsPerSession: 15,
    },
    {
      name: 'Sales Rep',
      namePtBr: 'Representante de Vendas',
      slug: 'sales-rep',
      archetype: 'sales' as const,
      systemPromptPtBr:
        'Voce e um representante de vendas. Identifique oportunidades e qualifique leads.',
      systemPromptEn:
        'You are a sales representative. Identify opportunities and qualify leads.',
      config: { model: 'claude-sonnet-4-6', temperature: 0.5, maxTokens: 4096, budget: 15 },
      tools: ['search_company_memory', 'log_message'],
      triggerType: 'manual' as const,
      maxActionsPerSession: 20,
    },
    {
      name: 'Data Analyst',
      namePtBr: 'Analista de Dados',
      slug: 'data-analyst',
      archetype: 'data_analyst' as const,
      systemPromptPtBr:
        'Voce e um analista de dados. Analise metricas e forneca insights acionaveis.',
      systemPromptEn:
        'You are a data analyst. Analyze metrics and provide actionable insights.',
      config: { model: 'claude-sonnet-4-6', temperature: 0.2, maxTokens: 8192, budget: 20 },
      tools: ['search_company_memory', 'log_message', 'get_current_time'],
      triggerType: 'scheduled' as const,
      triggerConfig: { cron: '0 9 * * 1-5' },
      maxActionsPerSession: 25,
    },
  ];

  const insertedAgents = [];
  for (const def of agentDefs) {
    const [agent] = await db
      .insert(schema.agents)
      .values({
        projectId: project.id,
        ...def,
        status: 'idle',
      })
      .onConflictDoUpdate({
        target: [schema.agents.projectId, schema.agents.slug],
        set: { name: def.name, config: def.config },
      })
      .returning();
    insertedAgents.push(agent);
    console.log(`  Agent: ${agent.name} (${agent.id})`);
  }

  // 5. Create 5 sample action log entries (only if none exist for this project)
  const existingLogs = await db
    .select({ id: schema.actionLogs.id })
    .from(schema.actionLogs)
    .where(eq(schema.actionLogs.projectId, project.id))
    .limit(1);

  if (existingLogs.length === 0) {
    const sessionId = crypto.randomUUID();
    await db.insert(schema.actionLogs).values([
      {
        projectId: project.id,
        agentId: insertedAgents[0].id,
        sessionId,
        actionType: 'llm_response',
        status: 'completed',
        tokensUsed: 1250,
        costUsd: '0.003750',
        durationMs: 2100,
      },
      {
        projectId: project.id,
        agentId: insertedAgents[0].id,
        sessionId,
        actionType: 'tool_call',
        toolName: 'search_company_memory',
        input: { query: 'politica de reembolso' },
        output: { results: [{ title: 'Politica de Reembolso', score: 0.92 }] },
        status: 'completed',
        tokensUsed: 0,
        costUsd: '0.000000',
        durationMs: 340,
      },
      {
        projectId: project.id,
        agentId: insertedAgents[0].id,
        sessionId,
        actionType: 'llm_response',
        status: 'completed',
        tokensUsed: 890,
        costUsd: '0.002670',
        durationMs: 1800,
      },
      {
        projectId: project.id,
        agentId: insertedAgents[1].id,
        sessionId: crypto.randomUUID(),
        actionType: 'llm_response',
        status: 'completed',
        tokensUsed: 2100,
        costUsd: '0.006300',
        durationMs: 3200,
      },
      {
        projectId: project.id,
        agentId: insertedAgents[2].id,
        sessionId: crypto.randomUUID(),
        actionType: 'approval_request',
        toolName: 'send_report',
        input: { reportType: 'weekly_analytics' },
        status: 'pending',
        tokensUsed: 0,
        costUsd: '0.000000',
        durationMs: 50,
      },
    ]);
    console.log(`  Action logs: 5 entries created`);
  } else {
    console.log(`  Action logs: already seeded, skipping`);
  }

  // 6. Seed global workflow templates
  await seedWorkflowTemplates();

  console.log('\nSeed complete!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
