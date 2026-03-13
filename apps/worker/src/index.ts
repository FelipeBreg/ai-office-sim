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
import {
  getAllQueues,
  getOrchestratorQueue,
  getCalendarReminderQueue,
  getCalendarRecurrenceQueue,
  getCleanupQueue,
  getRedisClient,
} from '@ai-office/queue';
import { hostname } from 'os';
import { createHmac, timingSafeEqual } from 'crypto';
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
  createOrchestratorWorker,
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
  createOrchestratorWorker(),
];

console.log(`[worker] Started ${workers.length} queue workers`);

// ── Express server for health + bull board ──
const app = express();

app.use(express.json({ limit: '1mb' }));

const startedAt = new Date();
const workerId = `worker:${hostname()}:${process.pid}`;

app.get('/health', async (_req, res) => {
  let isLeader = false;
  try {
    const redis = getRedisClient();
    const holder = await redis.get('orchestrator:leader');
    isLeader = holder === workerId;
  } catch {
    // Ignore redis errors in health check
  }

  res.json({
    status: 'ok',
    workerId,
    workers: workers.length,
    isLeader,
    uptime: Math.round((Date.now() - startedAt.getTime()) / 1000),
    timestamp: new Date().toISOString(),
  });
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

    // Verify webhook signature if secret is configured
    if (workflow.webhookSecret) {
      const signature = req.headers['x-signature-256'] as string | undefined;
      const timestamp = req.headers['x-timestamp'] as string | undefined;

      if (!signature) {
        res.status(401).json({ error: 'Missing X-Signature-256 header' });
        return;
      }

      // Replay protection: reject if timestamp > 5 min old
      if (timestamp) {
        const ts = parseInt(timestamp, 10);
        if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
          res.status(401).json({ error: 'Timestamp too old or invalid' });
          return;
        }
      }

      const body = JSON.stringify(req.body);
      const expected = createHmac('sha256', workflow.webhookSecret)
        .update(timestamp ? `${timestamp}.${body}` : body)
        .digest('hex');

      const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
      try {
        const sigBuf = Buffer.from(sig, 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      } catch {
        res.status(401).json({ error: 'Invalid signature format' });
        return;
      }
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

// ── Orchestrator: 1-minute tick ──
getOrchestratorQueue()
  .add('orchestrator-tick', { type: 'tick' }, { repeat: { every: 60_000 }, jobId: 'orchestrator-tick' })
  .then(() => console.log('[worker] Orchestrator tick registered (every 60s)'))
  .catch((err) => console.error('[worker] Failed to register orchestrator tick:', err));

// ── Calendar reminders: check every minute for due reminders ──
getCalendarReminderQueue()
  .add('calendar-reminder-tick', { type: 'send_reminders' }, { repeat: { every: 60_000 }, jobId: 'calendar-reminder-tick' })
  .then(() => console.log('[worker] Calendar reminder tick registered (every 60s)'))
  .catch((err) => console.error('[worker] Failed to register calendar reminder tick:', err));

// ── Calendar recurrence: generate recurring events every hour ──
getCalendarRecurrenceQueue()
  .add('calendar-recurrence-tick', { horizonDays: 30 }, { repeat: { pattern: '0 * * * *' }, jobId: 'calendar-recurrence-tick' })
  .then(() => console.log('[worker] Calendar recurrence tick registered (every hour)'))
  .catch((err) => console.error('[worker] Failed to register calendar recurrence tick:', err));

// ── Cleanup: delete old action logs daily at 3am ──
getCleanupQueue()
  .add('cleanup-daily', { type: 'old_action_logs', olderThanDays: 90 }, { repeat: { pattern: '0 3 * * *' }, jobId: 'cleanup-daily' })
  .then(() => console.log('[worker] Cleanup job registered (daily at 3am, 90-day retention)'))
  .catch((err) => console.error('[worker] Failed to register cleanup job:', err));

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
