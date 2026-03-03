import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  enforceResourceLimit,
} from '../trpc.js';
import { db, workflowTemplates, workflows, agents, agentArchetypes, eq, and, asc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    nodeType?: string;
    archetype?: string;
    agentId?: string;
    agentName?: string;
    [key: string]: unknown;
  };
}

interface TemplateDefinition {
  nodes: TemplateNode[];
  edges: unknown[];
  variables?: unknown[];
}

export const workflowTemplatesRouter = createTRPCRouter({
  /** List all workflow templates, optionally filtered by category */
  list: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(workflowTemplates)
        .orderBy(asc(workflowTemplates.sortOrder));

      if (input?.category) {
        return rows.filter((r) => r.category === input.category);
      }
      return rows;
    }),

  /** Get a single workflow template by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [template] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow template not found' });
      }
      return template;
    }),

  /** Preview what deploying a template would create */
  previewDeploy: protectedProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [template] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow template not found' });
      }

      const definition = template.definition as TemplateDefinition | null;
      if (!definition?.nodes) return { workflow: template, agents: [], existingAgents: [] };

      // Find all agent nodes with archetypes
      const agentNodes = definition.nodes.filter(
        (n) => n.data?.nodeType === 'agent' && n.data?.archetype,
      );

      // Get unique archetypes needed
      const archetypeNames = [...new Set(agentNodes.map((n) => n.data.archetype!))];

      // Check which archetypes already have agents in the project
      const existingAgentsList = await db
        .select({ id: agents.id, name: agents.name, archetype: agents.archetype })
        .from(agents)
        .where(eq(agents.projectId, ctx.project!.id));

      const existingArchetypes = new Set<string>(existingAgentsList.map((a) => a.archetype));

      // Look up archetype metadata for agents that need to be created
      const archetypeData = await db
        .select()
        .from(agentArchetypes);

      const agentsToCreate: Array<{
        archetype: string;
        name: string;
        tools: string[];
      }> = [];

      const existingAgents: Array<{
        archetype: string;
        agentId: string;
        agentName: string;
      }> = [];

      for (const archetype of archetypeNames) {
        if (existingArchetypes.has(archetype)) {
          const match = existingAgentsList.find((a) => a.archetype === archetype);
          if (match) {
            existingAgents.push({
              archetype,
              agentId: match.id,
              agentName: match.name,
            });
          }
        } else {
          const data = archetypeData.find((a) => a.archetype === archetype);
          agentsToCreate.push({
            archetype,
            name: data?.nameEn ?? archetype,
            tools: data?.defaultTools ?? [],
          });
        }
      }

      return {
        workflow: {
          name: template.nameEn,
          description: template.descriptionEn,
          nodeCount: template.nodeCount,
          category: template.category,
        },
        agentsToCreate,
        existingAgents,
      };
    }),

  /** Copy a template into the user's project as a new workflow (without auto-creating agents) */
  use: adminProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow template not found' });
      }

      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxWorkflows');

      const [workflow] = await db
        .insert(workflows)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          name: template.nameEn,
          description: template.descriptionEn,
          definition: template.definition,
        })
        .returning();

      return workflow!;
    }),

  /** One-click deploy: create workflow + auto-create missing agents from archetypes */
  deploy: adminProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow template not found' });
      }

      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxWorkflows');

      const definition = template.definition as TemplateDefinition | null;
      const updatedDefinition = definition ? { ...definition, nodes: [...definition.nodes] } : null;

      let agentsCreated = 0;

      if (updatedDefinition?.nodes) {
        // Get existing agents in project
        const existingAgentsList = await db
          .select({ id: agents.id, name: agents.name, archetype: agents.archetype })
          .from(agents)
          .where(eq(agents.projectId, ctx.project!.id));

        const existingByArchetype = new Map<string, { id: string; name: string; archetype: string }>(
          existingAgentsList.map((a) => [a.archetype, a]),
        );

        // Get all archetype data
        const archetypeData = await db.select().from(agentArchetypes);
        const archetypeMap = new Map<string, typeof archetypeData[number]>(
          archetypeData.map((a) => [a.archetype, a]),
        );

        // Process each agent node
        for (let i = 0; i < updatedDefinition.nodes.length; i++) {
          const node = updatedDefinition.nodes[i]!;
          if (node.data?.nodeType !== 'agent' || !node.data?.archetype) continue;

          const archetype = node.data.archetype;
          const existing = existingByArchetype.get(archetype);

          if (existing) {
            // Use existing agent
            updatedDefinition.nodes[i] = {
              ...node,
              data: { ...node.data, agentId: existing.id, agentName: existing.name },
            };
          } else {
            // Create new agent from archetype
            const arch = archetypeMap.get(archetype);
            const slug = `${archetype}-${Date.now()}`;
            const name = arch?.nameEn ?? archetype;

            const [newAgent] = await db
              .insert(agents)
              .values({
                projectId: ctx.project!.id,
                name,
                slug,
                archetype: archetype as any,
                systemPromptEn: arch?.defaultSystemPromptEn,
                systemPromptPtBr: arch?.defaultSystemPromptPtBr,
                tools: arch?.defaultTools ?? [],
                triggerType: arch?.defaultTriggerType ?? 'manual',
              })
              .returning();

            if (newAgent) {
              updatedDefinition.nodes[i] = {
                ...node,
                data: { ...node.data, agentId: newAgent.id, agentName: newAgent.name },
              };
              // Cache for subsequent nodes with same archetype
              existingByArchetype.set(archetype, { id: newAgent.id, name: newAgent.name, archetype });
              agentsCreated++;
            }
          }
        }
      }

      // Create workflow with updated definition (agent IDs populated)
      const [workflow] = await db
        .insert(workflows)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          name: template.nameEn,
          description: template.descriptionEn,
          definition: updatedDefinition ?? template.definition,
        })
        .returning();

      return { ...workflow!, agentsCreated };
    }),
});
