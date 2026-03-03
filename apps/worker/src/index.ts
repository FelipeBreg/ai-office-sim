import * as Sentry from '@sentry/node';
import express from 'express';

// Initialize Sentry (no-op if NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN is unset)
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
import { createSocketServer } from './socket/server.js';
import { registerAllScheduledAgents } from './scheduler/cron-scheduler.js';
import { registerAllScheduledWorkflows } from './scheduler/workflow-cron-scheduler.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getAllQueues } from '@ai-office/queue';
import {
  createAgentExecutionWorker,
  createAgentScheduledWorker,
  createToolExecutionWorker,
  createEmbeddingGenerationWorker,
  createNotificationWorker,
  createAnalyticsWorker,
  createCleanupWorker,
  createWorkflowExecutionWorker,
  createCalendarReminderWorker,
  createCalendarRecurrenceWorker,
  createEmailInboundWorker,
} from './workers/index.js';

const PORT = Number(process.env.PORT ?? 4000);
const isDev = process.env.NODE_ENV !== 'production';
const SHUTDOWN_TIMEOUT_MS = 30_000;

// ── Global error handlers ──
process.on('unhandledRejection', (reason) => {
  console.error('[worker] Unhandled rejection:', reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (err) => {
  console.error('[worker] Uncaught exception:', err);
  Sentry.captureException(err);
  shutdown();
});

// ── Start all workers ──
const workers = [
  createAgentExecutionWorker(),
  createAgentScheduledWorker(),
  createToolExecutionWorker(),
  createEmbeddingGenerationWorker(),
  createNotificationWorker(),
  createAnalyticsWorker(),
  createCleanupWorker(),
  createWorkflowExecutionWorker(),
  createCalendarReminderWorker(),
  createCalendarRecurrenceWorker(),
  createEmailInboundWorker(),
];

console.log(`[worker] Started ${workers.length} queue workers`);

// ── Express server for health + bull board ──
const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', workers: workers.length, timestamp: new Date().toISOString() });
});

// ── Webhook route for workflow triggers ──
app.post('/webhooks/workflow/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { db, workflows, workflowRuns, eq } = await import('@ai-office/db');
    const { getWorkflowExecutionQueue } = await import('@ai-office/queue');

    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.webhookToken, token))
      .limit(1);

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    if (!workflow.isActive) {
      res.status(400).json({ error: 'Workflow is inactive' });
      return;
    }

    // Build variables from request body + defaults
    const definition = workflow.definition as { variables?: { key: string; defaultValue?: string }[] } | null;
    const definedVars = definition?.variables ?? [];
    const bodyVars = (req.body as Record<string, unknown>) ?? {};

    const variables: Record<string, string> = {};
    for (const v of definedVars) {
      variables[v.key] = String(bodyVars[v.key] ?? v.defaultValue ?? '');
    }
    // Pass through extra body keys as variables
    for (const [k, v] of Object.entries(bodyVars)) {
      if (!(k in variables)) {
        variables[k] = String(v);
      }
    }

    const [run] = await db
      .insert(workflowRuns)
      .values({
        workflowId: workflow.id,
        projectId: workflow.projectId,
        variables,
      })
      .returning();

    if (!run) {
      res.status(500).json({ error: 'Failed to create workflow run' });
      return;
    }

    await getWorkflowExecutionQueue().add(
      `workflow-webhook-${workflow.id}-${run.id}`,
      {
        workflowId: workflow.id,
        workflowRunId: run.id,
        projectId: workflow.projectId,
        variables,
      },
    );

    res.status(200).json({
      triggered: true,
      workflowId: workflow.id,
      runId: run.id,
    });
  } catch (err) {
    console.error('[webhook] Error processing workflow webhook:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (isDev) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: getAllQueues().map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  console.log(`[worker] Bull Board available at http://localhost:${PORT}/admin/queues`);
}

const server = app.listen(PORT, () => {
  console.log(`[worker] HTTP server listening on port ${PORT}`);
  console.log(`[worker] Ready to process jobs`);
});

// ── Socket.IO ──
const io = createSocketServer(server);
console.log(`[worker] Socket.IO server attached`);

// ── Cron Scheduler: register repeatable jobs for scheduled agents ──
registerAllScheduledAgents().catch((err) => {
  console.error('[worker] Failed to register scheduled agents:', err);
});

// ── Cron Scheduler: register repeatable jobs for scheduled workflows ──
registerAllScheduledWorkflows().catch((err) => {
  console.error('[worker] Failed to register scheduled workflows:', err);
});

// ── Graceful shutdown with timeout ──
let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('[worker] Shutting down...');

  // Hard exit fallback if graceful shutdown takes too long
  const forceExit = setTimeout(() => {
    console.error(`[worker] Forced exit after ${SHUTDOWN_TIMEOUT_MS}ms timeout`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await Promise.all(workers.map((w) => w.close()));
    console.log('[worker] All workers closed');
  } catch (err) {
    console.error('[worker] Error closing workers:', err);
  }

  server.closeAllConnections();
  server.close(() => {
    console.log('[worker] HTTP server closed');
    clearTimeout(forceExit);
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
