import * as Sentry from '@sentry/node';
import express from 'express';

// Initialize Sentry (no-op if NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN is unset)
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
import { createSocketServer } from './socket/server.js';
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
];

console.log(`[worker] Started ${workers.length} queue workers`);

// ── Express server for health + bull board ──
const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', workers: workers.length, timestamp: new Date().toISOString() });
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
