/**
 * Auto-ingest completed agent session summaries into the company RAG.
 * Runs as a scheduled job — takes completed action logs, summarizes them,
 * and ingests into the document pipeline.
 */
import { db, actionLogs, agents, eq, and, sql } from '@ai-office/db';
import { ingestDocument } from './ingest.js';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const SUMMARY_MODEL = 'gpt-4o-mini';
const FETCH_TIMEOUT_MS = 30_000;

const SUMMARY_PROMPT = `Summarize the following agent action log into a concise paragraph (2-4 sentences). Include:
- What the agent did (tools used, actions taken)
- Key outcomes or results
- Any notable decisions or errors

Write in past tense, professional tone. This summary will be used as searchable knowledge.`;

/**
 * Summarize a session's action logs into a paragraph.
 */
async function summarizeSession(
  agentName: string,
  sessionLogs: Array<{ toolName?: string; input?: unknown; output?: unknown; error?: string }>,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: create a basic summary without LLM
    const tools = [...new Set(sessionLogs.map((l) => l.toolName).filter(Boolean))];
    const errors = sessionLogs.filter((l) => l.error).length;
    return `Agent "${agentName}" executed ${sessionLogs.length} actions using tools: ${tools.join(', ') || 'none'}. ${errors > 0 ? `${errors} errors occurred.` : 'All actions completed successfully.'}`;
  }

  const logSummary = sessionLogs.map((l, i) => {
    const parts = [`Action ${i + 1}: ${l.toolName ?? 'llm_call'}`];
    if (l.input) parts.push(`Input: ${JSON.stringify(l.input).slice(0, 200)}`);
    if (l.error) parts.push(`Error: ${l.error}`);
    return parts.join(' | ');
  }).join('\n');

  const res = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SUMMARY_MODEL,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user', content: `Agent: ${agentName}\n\n${logSummary}` },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Summary generation failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? '';
}

/**
 * Ingest completed sessions from the past N hours into RAG.
 * Returns the number of sessions ingested.
 */
export async function autoIngestRecentSessions(
  projectId: string,
  hoursAgo: number = 24,
): Promise<{ ingestedCount: number; error?: string }> {
  try {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Get distinct completed sessions with their logs
    const logs = await db
      .select({
        sessionId: actionLogs.sessionId,
        agentId: actionLogs.agentId,
        agentName: agents.name,
        toolName: actionLogs.toolName,
        input: actionLogs.input,
        output: actionLogs.output,
        error: actionLogs.error,
        status: actionLogs.status,
        createdAt: actionLogs.createdAt,
      })
      .from(actionLogs)
      .innerJoin(agents, eq(actionLogs.agentId, agents.id))
      .where(
        and(
          eq(actionLogs.projectId, projectId),
          eq(actionLogs.status, 'completed'),
          sql`${actionLogs.createdAt} >= ${cutoff.toISOString()}::timestamptz`,
        ),
      );

    // Group by session
    const sessions = new Map<string, {
      agentName: string;
      logs: Array<{ toolName?: string | null; input?: unknown; output?: unknown; error?: string | null }>;
    }>();

    for (const log of logs) {
      const key = log.sessionId;
      if (!sessions.has(key)) {
        sessions.set(key, { agentName: log.agentName, logs: [] });
      }
      sessions.get(key)!.logs.push({
        toolName: log.toolName,
        input: log.input,
        output: log.output,
        error: log.error,
      });
    }

    let ingested = 0;
    for (const [sessionId, session] of sessions) {
      const summary = await summarizeSession(
        session.agentName,
        session.logs as Array<{ toolName?: string; input?: unknown; output?: unknown; error?: string }>,
      );

      if (summary.length > 0) {
        const tools = [...new Set(session.logs.map((l) => l.toolName).filter(Boolean))];
        await ingestDocument({
          projectId,
          title: `Agent Session: ${session.agentName} (${new Date().toISOString().split('T')[0]})`,
          content: summary,
          sourceType: 'agent',
          metadata: {
            sessionId,
            agentName: session.agentName,
            toolsUsed: tools,
            actionCount: session.logs.length,
          },
        });
        ingested++;
      }
    }

    return { ingestedCount: ingested };
  } catch (err) {
    return {
      ingestedCount: 0,
      error: err instanceof Error ? err.message : 'Auto-ingestion failed',
    };
  }
}
