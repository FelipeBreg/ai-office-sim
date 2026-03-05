import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import {
  db,
  agents,
  teams,
  agentTeamMemberships,
  orchestratorConfig,
  eq,
  and,
} from '@ai-office/db';
import { TRPCError } from '@trpc/server';
import { recommendFleet } from '@ai-office/shared';
import type { FleetRecommendation } from '@ai-office/shared';

export const onboardingRouter = createTRPCRouter({
  /** Step 2: Scrape company URLs and build profile (stub — returns mock for now) */
  scrapeCompany: projectProcedure
    .input(
      z.object({
        websiteUrl: z.string().url().optional(),
        linkedinUrl: z.string().url().optional(),
        instagramUrl: z.string().url().optional(),
        facebookUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO: Implement actual web scraping via BullMQ worker
      // For now, return a stub profile so the wizard flow works end-to-end
      const urls = [input.websiteUrl, input.linkedinUrl, input.instagramUrl, input.facebookUrl].filter(Boolean);

      return {
        profile: {
          description: '',
          products: [],
          targetAudience: '',
          brandVoice: 'professional',
          channels: urls.length > 0 ? ['website'] : [],
          teamSize: '',
          techStack: [],
          competitors: [],
          contentThemes: [],
        },
        scrapeResults: urls.map((url) => ({
          url: url!,
          success: false,
          error: 'Scraping not yet implemented. Profile will use manual input.',
        })),
      };
    }),

  /** Step 4: Get fleet recommendation based on sector */
  getFleetRecommendation: projectProcedure
    .input(
      z.object({
        sector: z.string().min(1),
        companySize: z.enum(['1-10', '11-50', '51-200', '200+']),
      }),
    )
    .query(({ input }) => {
      return recommendFleet(input.sector);
    }),

  /** Step 5: Deploy the recommended fleet */
  deployFleet: projectProcedure
    .input(
      z.object({
        teams: z.array(
          z.object({
            name: z.string(),
            slug: z.string(),
            description: z.string(),
          }),
        ),
        agents: z.array(
          z.object({
            name: z.string(),
            namePtBr: z.string(),
            slug: z.string(),
            archetype: z.string(),
            team: z.string(),
            tools: z.array(z.string()),
            triggerType: z.enum(['always_on', 'scheduled', 'event', 'manual', 'agent']),
            heartbeatIntervalMin: z.number().int().min(5).max(1440).optional(),
            systemPromptEn: z.string().optional(),
            systemPromptPtBr: z.string().optional(),
          }),
        ),
        approvalMode: z.enum(['manual', 'supervised', 'autonomous']),
        companyName: z.string().min(1),
        sector: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      // 1. Create teams
      const teamMap = new Map<string, string>(); // slug -> id
      for (const teamInput of input.teams) {
        const [created] = await db
          .insert(teams)
          .values({
            projectId,
            name: teamInput.name,
            slug: teamInput.slug,
            description: teamInput.description,
          })
          .onConflictDoNothing()
          .returning();

        if (created) {
          teamMap.set(teamInput.slug, created.id);
        } else {
          // Team already exists, fetch its id
          const [existing] = await db
            .select({ id: teams.id })
            .from(teams)
            .where(and(eq(teams.projectId, projectId), eq(teams.slug, teamInput.slug)))
            .limit(1);
          if (existing) teamMap.set(teamInput.slug, existing.id);
        }
      }

      // 2. Create agents and assign to teams
      const createdAgents: Array<{ id: string; name: string; team: string }> = [];

      for (const agentInput of input.agents) {
        const [created] = await db
          .insert(agents)
          .values({
            projectId,
            name: agentInput.name,
            namePtBr: agentInput.namePtBr,
            slug: agentInput.slug,
            archetype: agentInput.archetype as any,
            tools: agentInput.tools,
            triggerType: agentInput.triggerType,
            heartbeatIntervalMin: agentInput.heartbeatIntervalMin ?? null,
            systemPromptEn: agentInput.systemPromptEn ?? null,
            systemPromptPtBr: agentInput.systemPromptPtBr ?? null,
            status: 'idle',
            isActive: true,
            hierarchyLevel: 2,
            config: {
              model: 'claude-sonnet-4-6',
              temperature: 0.4,
              maxTokens: 4096,
              budget: 1.0,
            },
          })
          .onConflictDoNothing()
          .returning();

        if (created) {
          createdAgents.push({ id: created.id, name: created.name, team: agentInput.team });

          // Assign to team
          const teamId = teamMap.get(agentInput.team);
          if (teamId) {
            await db
              .insert(agentTeamMemberships)
              .values({
                agentId: created.id,
                teamId,
                role: 'member',
              })
              .onConflictDoNothing();
          }
        }
      }

      // 3. Set approval mode on orchestrator config
      const [existingConfig] = await db
        .select({ id: orchestratorConfig.id })
        .from(orchestratorConfig)
        .where(eq(orchestratorConfig.projectId, projectId))
        .limit(1);

      if (existingConfig) {
        await db
          .update(orchestratorConfig)
          .set({ approvalMode: input.approvalMode })
          .where(eq(orchestratorConfig.id, existingConfig.id));
      }

      return {
        teamsCreated: teamMap.size,
        agentsCreated: createdAgents.length,
        approvalMode: input.approvalMode,
        agents: createdAgents,
      };
    }),
});
