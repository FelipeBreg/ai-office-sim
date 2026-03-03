import { Queue } from 'bullmq';
import type { QueueOptions, DefaultJobOptions } from 'bullmq';
import { getConnectionOptions } from './connection.js';
import type {
  AgentExecutionJob,
  AgentScheduledJob,
  ToolExecutionJob,
  EmbeddingGenerationJob,
  NotificationJob,
  AnalyticsJob,
  CleanupJob,
  WorkflowExecutionJob,
  CalendarReminderJob,
  CalendarRecurrenceJob,
  EmailInboundJob,
  OrchestratorJob,
} from './jobs.js';

// ── Queue names (single source of truth) ──
export const QUEUE_NAMES = {
  AGENT_EXECUTION: 'agent-execution',
  AGENT_SCHEDULED: 'agent-scheduled',
  TOOL_EXECUTION: 'tool-execution',
  EMBEDDING_GENERATION: 'embedding-generation',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  WORKFLOW_EXECUTION: 'workflow-execution',
  CALENDAR_REMINDER: 'calendar-reminder',
  CALENDAR_RECURRENCE: 'calendar-recurrence',
  EMAIL_INBOUND: 'email-inbound',
  ORCHESTRATOR: 'orchestrator',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ── Default job options per queue (retry + backoff + dead letter) ──
const defaultJobOptions: Record<QueueName, DefaultJobOptions> = {
  [QUEUE_NAMES.AGENT_EXECUTION]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.AGENT_SCHEDULED]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.TOOL_EXECUTION]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 2000 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.EMBEDDING_GENERATION]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 15_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.NOTIFICATION]: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.ANALYTICS]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.CLEANUP]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 120_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.WORKFLOW_EXECUTION]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.CALENDAR_REMINDER]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.CALENDAR_RECURRENCE]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 120_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.EMAIL_INBOUND]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  },
  [QUEUE_NAMES.ORCHESTRATOR]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  },
};

// ── Queue factory ──
function createQueue<T>(name: QueueName): Queue<T> {
  const opts: QueueOptions = {
    connection: getConnectionOptions(),
    defaultJobOptions: defaultJobOptions[name],
  };
  return new Queue<T>(name, opts);
}

// ── Queue instances (lazy singletons) ──
let _agentExecution: Queue<AgentExecutionJob> | null = null;
let _agentScheduled: Queue<AgentScheduledJob> | null = null;
let _toolExecution: Queue<ToolExecutionJob> | null = null;
let _embeddingGeneration: Queue<EmbeddingGenerationJob> | null = null;
let _notification: Queue<NotificationJob> | null = null;
let _analytics: Queue<AnalyticsJob> | null = null;
let _cleanup: Queue<CleanupJob> | null = null;
let _workflowExecution: Queue<WorkflowExecutionJob> | null = null;
let _calendarReminder: Queue<CalendarReminderJob> | null = null;
let _calendarRecurrence: Queue<CalendarRecurrenceJob> | null = null;
let _emailInbound: Queue<EmailInboundJob> | null = null;
let _orchestrator: Queue<OrchestratorJob> | null = null;

export function getAgentExecutionQueue() {
  _agentExecution ??= createQueue<AgentExecutionJob>(QUEUE_NAMES.AGENT_EXECUTION);
  return _agentExecution;
}

export function getAgentScheduledQueue() {
  _agentScheduled ??= createQueue<AgentScheduledJob>(QUEUE_NAMES.AGENT_SCHEDULED);
  return _agentScheduled;
}

export function getToolExecutionQueue() {
  _toolExecution ??= createQueue<ToolExecutionJob>(QUEUE_NAMES.TOOL_EXECUTION);
  return _toolExecution;
}

export function getEmbeddingGenerationQueue() {
  _embeddingGeneration ??= createQueue<EmbeddingGenerationJob>(QUEUE_NAMES.EMBEDDING_GENERATION);
  return _embeddingGeneration;
}

export function getNotificationQueue() {
  _notification ??= createQueue<NotificationJob>(QUEUE_NAMES.NOTIFICATION);
  return _notification;
}

export function getAnalyticsQueue() {
  _analytics ??= createQueue<AnalyticsJob>(QUEUE_NAMES.ANALYTICS);
  return _analytics;
}

export function getCleanupQueue() {
  _cleanup ??= createQueue<CleanupJob>(QUEUE_NAMES.CLEANUP);
  return _cleanup;
}

export function getWorkflowExecutionQueue() {
  _workflowExecution ??= createQueue<WorkflowExecutionJob>(QUEUE_NAMES.WORKFLOW_EXECUTION);
  return _workflowExecution;
}

export function getCalendarReminderQueue() {
  _calendarReminder ??= createQueue<CalendarReminderJob>(QUEUE_NAMES.CALENDAR_REMINDER);
  return _calendarReminder;
}

export function getCalendarRecurrenceQueue() {
  _calendarRecurrence ??= createQueue<CalendarRecurrenceJob>(QUEUE_NAMES.CALENDAR_RECURRENCE);
  return _calendarRecurrence;
}

export function getEmailInboundQueue() {
  _emailInbound ??= createQueue<EmailInboundJob>(QUEUE_NAMES.EMAIL_INBOUND);
  return _emailInbound;
}

export function getOrchestratorQueue() {
  _orchestrator ??= createQueue<OrchestratorJob>(QUEUE_NAMES.ORCHESTRATOR);
  return _orchestrator;
}

/** Get all queue instances (useful for bull-board) */
export function getAllQueues() {
  return [
    getAgentExecutionQueue(),
    getAgentScheduledQueue(),
    getToolExecutionQueue(),
    getEmbeddingGenerationQueue(),
    getNotificationQueue(),
    getAnalyticsQueue(),
    getCleanupQueue(),
    getWorkflowExecutionQueue(),
    getCalendarReminderQueue(),
    getCalendarRecurrenceQueue(),
    getEmailInboundQueue(),
    getOrchestratorQueue(),
  ];
}
