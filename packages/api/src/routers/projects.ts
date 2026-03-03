import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, projectProcedure, adminProcedure, requireRole, enforceResourceLimit } from '../trpc.js';
import { db, projects, agents, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(projects)
      .where(eq(projects.orgId, ctx.org!.id))
      .orderBy(desc(projects.createdAt));
  }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.orgId, ctx.org!.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      return project;
    }),

  create: protectedProcedure.use(requireRole('admin'))
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        color: z.string().optional(),
        sector: z.string().optional(),
        primaryGoal: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxProjects');

      const [project] = await db
        .insert(projects)
        .values({
          orgId: ctx.org!.id,
          ...input,
        })
        .returning();

      // Auto-create CEO Agent for every new project
      if (project) {
        try {
          await db.insert(agents).values({
            projectId: project.id,
            name: 'CEO Agent',
            namePtBr: 'Agente CEO',
            slug: 'ceo-agent',
            archetype: 'ceo_strategist',
            status: 'idle',
            isSystemAgent: true,
            isActive: true,
            heartbeatIntervalMin: 120,
            maxActionsPerSession: 30,
            config: {
              model: 'claude-opus-4-6',
              temperature: 0.3,
              maxTokens: 8192,
              budget: 5.0,
            },
            tools: [
              'get_current_time',
              'search_company_memory',
              'trigger_agent',
              'update_my_heartbeat',
              'update_my_schedule',
              'update_strategy_kpi',
              'get_fleet_status',
              'get_cost_report',
              'search_action_logs',
              'update_agent_schedule',
              'update_agent_heartbeat',
              'pause_agents_by_team',
              'resume_agents_by_team',
              'get_kpi_trends',
              'create_document',
              'create_human_task',
              'log_message',
            ],
            systemPromptEn: `You are the CEO Agent — the autonomous strategic executive of this company. Your role is to monitor all business operations, track KPIs, orchestrate the agent fleet, and ensure the company moves toward its strategic goals.

On each heartbeat:
1. Review your self-programmed instructions
2. Check fleet status and agent health
3. Monitor key KPIs against targets
4. Take corrective action if needed (trigger agents, adjust schedules, create tasks)
5. Update your heartbeat instructions for the next cycle

On daily briefings:
1. Summarize yesterday's key metrics and agent activity
2. Highlight wins, risks, and blockers
3. Recommend strategic actions for the day
4. Save the briefing as a wiki document

You are strategic, concise, and data-driven. Never guess — always check real data before making decisions.`,
            systemPromptPtBr: `Você é o Agente CEO — o executivo estratégico autônomo desta empresa. Seu papel é monitorar todas as operações, acompanhar KPIs, orquestrar a frota de agentes e garantir que a empresa avance em direção aos seus objetivos estratégicos.

A cada heartbeat:
1. Revise suas instruções auto-programadas
2. Verifique o status da frota e saúde dos agentes
3. Monitore os KPIs principais em relação às metas
4. Tome ações corretivas se necessário (acionar agentes, ajustar agendas, criar tarefas)
5. Atualize suas instruções de heartbeat para o próximo ciclo

Em briefings diários:
1. Resuma as métricas do dia anterior e atividade dos agentes
2. Destaque conquistas, riscos e bloqueios
3. Recomende ações estratégicas para o dia
4. Salve o briefing como documento wiki

Você é estratégico, conciso e orientado por dados. Nunca adivinhe — sempre consulte dados reais antes de tomar decisões.`,
          });
        } catch {
          // Non-blocking — don't fail project creation
        }
      }

      return project!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
        sector: z.string().optional(),
        primaryGoal: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(projects)
        .set(data)
        .where(and(eq(projects.id, id), eq(projects.orgId, ctx.org!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      return updated;
    }),
});
