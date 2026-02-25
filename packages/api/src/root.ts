import { createTRPCRouter } from './trpc.js';
import { agentsRouter } from './routers/agents.js';
import { projectsRouter } from './routers/projects.js';
import { actionLogsRouter } from './routers/action-logs.js';
import { approvalsRouter } from './routers/approvals.js';
import { workflowsRouter } from './routers/workflows.js';
import { strategiesRouter } from './routers/strategies.js';
import { usersRouter } from './routers/users.js';
import { whatsappRouter } from './routers/whatsapp.js';
import { emailRouter } from './routers/email.js';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  projects: projectsRouter,
  actionLogs: actionLogsRouter,
  approvals: approvalsRouter,
  workflows: workflowsRouter,
  strategies: strategiesRouter,
  users: usersRouter,
  whatsapp: whatsappRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;
