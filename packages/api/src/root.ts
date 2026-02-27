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
import { toolCredentialsRouter } from './routers/tool-credentials.js';
import { documentsRouter } from './routers/documents.js';
import { agentMemoryRouter } from './routers/agent-memory.js';
import { wikiRouter } from './routers/wiki.js';
import { feedbackRouter } from './routers/feedback.js';
import { companyTemplatesRouter } from './routers/company-templates.js';
import { billingRouter } from './routers/billing.js';
import { devopsRouter } from './routers/devops.js';
import { workflowTemplatesRouter } from './routers/workflow-templates.js';
import { atlasRouter } from './routers/atlas.js';

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
  toolCredentials: toolCredentialsRouter,
  documents: documentsRouter,
  agentMemory: agentMemoryRouter,
  wiki: wikiRouter,
  feedback: feedbackRouter,
  companyTemplates: companyTemplatesRouter,
  billing: billingRouter,
  devops: devopsRouter,
  workflowTemplates: workflowTemplatesRouter,
  atlas: atlasRouter,
});

export type AppRouter = typeof appRouter;
