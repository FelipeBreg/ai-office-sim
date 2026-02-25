/**
 * Check approval rules for a tool call.
 * Used by the executor to determine if a tool requires approval,
 * is always allowed, or is always blocked.
 */
import { db, approvalRules, eq, and } from '@ai-office/db';

export type ApprovalAction = 'always_allow' | 'always_block' | 'require_approval';

/**
 * Check if there's an approval rule for this agent + tool combination.
 * Returns null if no rule exists (falls back to tool's default requiresApproval).
 */
export async function checkApprovalRule(
  projectId: string,
  agentId: string,
  toolName: string,
): Promise<ApprovalAction | null> {
  const [rule] = await db
    .select({ action: approvalRules.action })
    .from(approvalRules)
    .where(
      and(
        eq(approvalRules.projectId, projectId),
        eq(approvalRules.agentId, agentId),
        eq(approvalRules.toolName, toolName),
      ),
    )
    .limit(1);

  return (rule?.action as ApprovalAction) ?? null;
}
