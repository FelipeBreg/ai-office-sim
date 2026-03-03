/**
 * Agent priority levels mapped to BullMQ priority values.
 * BullMQ: lower number = higher priority (1 is highest).
 */
export type AgentPriority = 'critical' | 'high' | 'normal' | 'low';

const PRIORITY_MAP: Record<AgentPriority, number> = {
  critical: 1,
  high: 5,
  normal: 10,
  low: 20,
};

/** Convert agent priority string to BullMQ numeric priority */
export function toBullMQPriority(priority: string | undefined): number {
  return PRIORITY_MAP[priority as AgentPriority] ?? PRIORITY_MAP.normal;
}
