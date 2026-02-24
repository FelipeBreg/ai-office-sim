import { createTRPCRouter } from './trpc.js';
import { agentsRouter } from './routers/agents.js';
import { projectsRouter } from './routers/projects.js';
import { actionLogsRouter } from './routers/action-logs.js';
import { approvalsRouter } from './routers/approvals.js';
import { workflowsRouter } from './routers/workflows.js';
import { strategiesRouter } from './routers/strategies.js';
import { usersRouter } from './routers/users.js';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  projects: projectsRouter,
  actionLogs: actionLogsRouter,
  approvals: approvalsRouter,
  workflows: workflowsRouter,
  strategies: strategiesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
