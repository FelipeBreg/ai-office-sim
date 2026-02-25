export const PLAN_LIMITS = {
  starter: { maxProjects: 1, maxAgents: 3, maxWorkflows: 5 },
  growth: { maxProjects: 5, maxAgents: 10, maxWorkflows: 25 },
  pro: { maxProjects: 20, maxAgents: 50, maxWorkflows: 100 },
  enterprise: { maxProjects: -1, maxAgents: -1, maxWorkflows: -1 },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
export type ResourceType = 'maxProjects' | 'maxAgents' | 'maxWorkflows';
