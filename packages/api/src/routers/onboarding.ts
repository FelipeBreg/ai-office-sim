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
import { callLLM } from '@ai-office/ai';
import { randomUUID } from 'crypto';
import { TRPCError } from '@trpc/server';
import { recommendFleet } from '@ai-office/shared';
import type { FleetRecommendation } from '@ai-office/shared';

/** Fetch a URL and extract readable text (strips HTML tags) */
async function fetchPageText(url: string): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AI-Office-Bot/1.0 (company-onboarding)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return { text: '', success: false, error: `HTTP ${res.status}` };

    const html = await res.text();
    // Strip scripts, styles, then HTML tags; collapse whitespace
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12_000); // limit to ~12k chars for LLM context

    return { text: cleaned, success: true };
  } catch (err) {
    return { text: '', success: false, error: err instanceof Error ? err.message : 'fetch failed' };
  }
}

/** Parse JSON from Claude response, handling markdown fences */
function parseProfileJSON(text: string): Record<string, unknown> | null {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenceMatch ? fenceMatch[1]! : text;
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

export const onboardingRouter = createTRPCRouter({
  /** Step 2: Scrape company URLs and analyze with Claude to build a company profile */
  scrapeCompany: projectProcedure
    .input(
      z.object({
        companyName: z.string().min(1).optional(),
        websiteUrl: z.string().url().optional(),
        linkedinUrl: z.string().url().optional(),
        instagramUrl: z.string().url().optional(),
        facebookUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const urls = [
        input.websiteUrl && { label: 'Website', url: input.websiteUrl },
        input.linkedinUrl && { label: 'LinkedIn', url: input.linkedinUrl },
        input.instagramUrl && { label: 'Instagram', url: input.instagramUrl },
        input.facebookUrl && { label: 'Facebook', url: input.facebookUrl },
      ].filter(Boolean) as Array<{ label: string; url: string }>;

      // Fetch all URLs in parallel
      const scrapeResults = await Promise.all(
        urls.map(async ({ label, url }) => {
          const result = await fetchPageText(url);
          return { label, url, ...result };
        }),
      );

      const scrapedText = scrapeResults
        .filter((r) => r.success && r.text.length > 50)
        .map((r) => `=== ${r.label} (${r.url}) ===\n${r.text}`)
        .join('\n\n');

      // Default empty profile
      const emptyProfile = {
        description: '',
        products: [] as string[],
        targetAudience: '',
        brandVoice: 'professional',
        channels: [] as string[],
        teamSize: '',
        techStack: [] as string[],
        competitors: [] as string[],
        contentThemes: [] as string[],
      };

      // If we have scraped content, analyze with Claude
      if (scrapedText.length > 100) {
        try {
          const systemAgentId = '00000000-0000-0000-0000-000000000000';
          const { response } = await callLLM(
            {
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1500,
              messages: [
                {
                  role: 'user',
                  content: `Analyze the following website content for a company${input.companyName ? ` called "${input.companyName}"` : ''} and extract a structured profile. Return ONLY a JSON object with these fields:

{
  "description": "1-2 sentence company description",
  "products": ["product/service 1", "product/service 2"],
  "targetAudience": "who they serve",
  "brandVoice": "professional" | "casual" | "technical" | "creative",
  "channels": ["website", "linkedin", "instagram", "facebook", "email", "whatsapp"],
  "teamSize": "estimated team size range like 1-10, 11-50, etc. or empty string if unknown",
  "techStack": ["tech/tool mentions found"],
  "competitors": ["competitor names if mentioned"],
  "contentThemes": ["main content themes/topics"]
}

WEBSITE CONTENT:
${scrapedText}

Return ONLY valid JSON, no explanation.`,
                },
              ],
            },
            {
              projectId: ctx.project!.id,
              agentId: systemAgentId,
              sessionId: randomUUID(),
              agentName: 'onboarding-scraper',
            },
          );

          const text = response.content
            .filter((b) => b.type === 'text')
            .map((b) => ('text' in b ? b.text : ''))
            .join('');

          const parsed = parseProfileJSON(text);
          if (parsed) {
            return {
              profile: {
                description: String(parsed.description ?? ''),
                products: Array.isArray(parsed.products) ? parsed.products.map(String) : [],
                targetAudience: String(parsed.targetAudience ?? ''),
                brandVoice: String(parsed.brandVoice ?? 'professional'),
                channels: Array.isArray(parsed.channels) ? parsed.channels.map(String) : [],
                teamSize: String(parsed.teamSize ?? ''),
                techStack: Array.isArray(parsed.techStack) ? parsed.techStack.map(String) : [],
                competitors: Array.isArray(parsed.competitors) ? parsed.competitors.map(String) : [],
                contentThemes: Array.isArray(parsed.contentThemes) ? parsed.contentThemes.map(String) : [],
              },
              scrapeResults: scrapeResults.map((r) => ({
                url: r.url,
                success: r.success,
                error: r.error,
              })),
            };
          }
        } catch (err) {
          console.error('[onboarding] LLM analysis failed:', err);
          // Fall through to return empty profile with scrape results
        }
      }

      return {
        profile: emptyProfile,
        scrapeResults: scrapeResults.map((r) => ({
          url: r.url,
          success: r.success,
          error: r.error ?? (r.text.length < 50 ? 'Page had insufficient content' : undefined),
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
