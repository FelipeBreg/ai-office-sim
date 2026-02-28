import { z } from 'zod';

// ── Agent Execution ──
export const agentExecutionJobSchema = z.object({
  agentId: z.string().uuid(),
  projectId: z.string().uuid(),
  sessionId: z.string().uuid(),
  triggerPayload: z.record(z.unknown()).optional(),
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
  workflowRunId: z.string().uuid(),
  projectId: z.string().uuid(),
  variables: z.record(z.string()).default({}),
  resumeFromNodeId: z.string().optional(),
  completedOutputs: z.record(z.unknown()).optional(),
});
export type WorkflowExecutionJob = z.infer<typeof workflowExecutionJobSchema>;

// ── Cleanup ──
export const cleanupJobSchema = z.object({
  type: z.enum(['expired_sessions', 'old_action_logs', 'stale_jobs']),
  olderThanDays: z.number().int().positive().default(30),
});
export type CleanupJob = z.infer<typeof cleanupJobSchema>;
