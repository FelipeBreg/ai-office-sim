import { z } from 'zod';

// ── Cascade Context (shared across agent + workflow jobs) ──
export const cascadeContextSchema = z.object({
  cascadeId: z.string().uuid(),
  cascadeDepth: z.number().int().min(0),
  cascadeRootType: z.string(),
  cascadeRootAgentId: z.string().uuid().optional(),
  cascadePath: z.array(z.string()),
  cascadeStatus: z.enum(['in_progress', 'completed', 'partial_failure', 'failed']),
});
export type CascadeContextJob = z.infer<typeof cascadeContextSchema>;

// ── Agent Execution ──
export const triggerTypeEnum = z.enum([
  'manual', 'scheduled', 'event', 'agent_message', 'heartbeat', 'kpi', 'webhook', 'briefing',
]);
export type TriggerType = z.infer<typeof triggerTypeEnum>;

export const agentExecutionJobSchema = z.object({
  agentId: z.string().uuid(),
  projectId: z.string().uuid(),
  sessionId: z.string().uuid(),
  triggerType: triggerTypeEnum.default('manual'),
  triggerPayload: z.record(z.unknown()).optional(),
  /** Serialized session state for resuming after approval */
  resumeState: z.record(z.unknown()).optional(),
  /** Whether the pending tool call was approved (true) or rejected (false) */
  resumeApproved: z.boolean().optional(),
  /** When true, mutation tools are intercepted and return mock results */
  sandboxMode: z.boolean().optional(),
  /** Cascade metadata for chained agent executions */
  cascade: cascadeContextSchema.optional(),
});
export type AgentExecutionJob = z.infer<typeof agentExecutionJobSchema>;

// ── Agent Scheduled ──
export const agentScheduledJobSchema = z.object({
  agentId: z.string().uuid(),
  projectId: z.string().uuid(),
  cron: z.string(),
});
export type AgentScheduledJob = z.infer<typeof agentScheduledJobSchema>;

// ── Tool Execution ──
export const toolExecutionJobSchema = z.object({
  agentId: z.string().uuid(),
  projectId: z.string().uuid(),
  sessionId: z.string().uuid(),
  toolName: z.string(),
  toolInput: z.record(z.unknown()),
  actionLogId: z.string().uuid(),
});
export type ToolExecutionJob = z.infer<typeof toolExecutionJobSchema>;

// ── Embedding Generation ──
export const embeddingGenerationJobSchema = z.object({
  documentId: z.string().uuid(),
  projectId: z.string().uuid(),
  chunkIds: z.array(z.string().uuid()).optional(),
});
export type EmbeddingGenerationJob = z.infer<typeof embeddingGenerationJobSchema>;

// ── Notification ──
export const notificationJobSchema = z.object({
  type: z.enum(['approval_requested', 'approval_resolved', 'agent_error', 'agent_complete']),
  projectId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  approvalId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  message: z.string().optional(),
  /** For approval_resolved: 'approved' or 'rejected' */
  resolvedStatus: z.enum(['approved', 'rejected']).optional(),
});
export type NotificationJob = z.infer<typeof notificationJobSchema>;

// ── Analytics ──
export const analyticsJobSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['daily_aggregation', 'learning_detection', 'cost_report']),
  date: z.string(), // ISO date string
});
export type AnalyticsJob = z.infer<typeof analyticsJobSchema>;

// ── Workflow Execution ──
export const workflowExecutionJobSchema = z.object({
  workflowId: z.string().uuid(),
  workflowRunId: z.string(), // empty string for scheduled triggers (created at execution time)
  projectId: z.string().uuid(),
  variables: z.record(z.string()).default({}),
  resumeFromNodeId: z.string().optional(),
  completedOutputs: z.record(z.unknown()).optional(),
  /** Set by cron scheduler — run is created at execution time */
  _scheduledTrigger: z.boolean().optional(),
  /** Cascade metadata for chained workflow executions */
  cascade: cascadeContextSchema.optional(),
});
export type WorkflowExecutionJob = z.infer<typeof workflowExecutionJobSchema>;

// ── Calendar Reminder ──
export const calendarReminderJobSchema = z.object({
  type: z.enum(['send_reminders', 'mark_overdue']),
});
export type CalendarReminderJob = z.infer<typeof calendarReminderJobSchema>;

// ── Calendar Recurrence ──
export const calendarRecurrenceJobSchema = z.object({
  horizonDays: z.number().int().positive().default(30),
});
export type CalendarRecurrenceJob = z.infer<typeof calendarRecurrenceJobSchema>;

// ── Email Inbound Polling ──
export const emailInboundJobSchema = z.object({
  type: z.enum(['poll_all', 'poll_project']),
  projectId: z.string().uuid().optional(),
});
export type EmailInboundJob = z.infer<typeof emailInboundJobSchema>;

// ── Cleanup ──
export const cleanupJobSchema = z.object({
  type: z.enum(['expired_sessions', 'old_action_logs', 'stale_jobs']),
  olderThanDays: z.number().int().positive().default(30),
});
export type CleanupJob = z.infer<typeof cleanupJobSchema>;

// ── Orchestrator ──
export const orchestratorJobSchema = z.object({
  type: z.enum(['tick', 'check_budgets', 'check_stalled']),
});
export type OrchestratorJob = z.infer<typeof orchestratorJobSchema>;
