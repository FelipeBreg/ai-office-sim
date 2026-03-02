import type { WorkflowNodeConfig, NodeInput, NodeOutput, OutputNodeConfig } from '@ai-office/shared';
import type { NodeHandler, WorkflowRunContext } from '../types.js';
import { db, emailConnections, eq } from '@ai-office/db';
import { decryptCredentials } from '@ai-office/shared';
import { createEmailClient } from '../../../tools/email/client.js';
import type { EmailProvider, EmailCredentials } from '../../../tools/email/client.js';

/** Resolve {{variable}} placeholders in a string */
function resolveVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

export const outputHandler: NodeHandler = {
  nodeType: 'output',
  async execute(
    config: WorkflowNodeConfig,
    input: NodeInput,
    ctx: WorkflowRunContext,
  ): Promise<NodeOutput> {
    const cfg = config as OutputNodeConfig;

    const resolvedContent = cfg.templateContent
      ? resolveVariables(cfg.templateContent, input.variables)
      : JSON.stringify(input.upstreamOutputs);

    switch (cfg.outputType) {
      case 'log': {
        console.log(
          `[workflow-output] Run=${ctx.workflowRunId} | ${resolvedContent}`,
        );
        return {
          nodeId: '',
          nodeType: 'output',
          status: 'completed',
          data: { outputType: 'log', content: resolvedContent },
          completedAt: new Date().toISOString(),
        };
      }

      case 'webhook': {
        if (!cfg.destination) {
          return {
            nodeId: '',
            nodeType: 'output',
            status: 'failed',
            data: { error: 'Webhook destination URL is required' },
            completedAt: new Date().toISOString(),
          };
        }

        try {
          const res = await fetch(cfg.destination, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowRunId: ctx.workflowRunId,
              content: resolvedContent,
              upstreamOutputs: input.upstreamOutputs,
            }),
          });

          return {
            nodeId: '',
            nodeType: 'output',
            status: res.ok ? 'completed' : 'failed',
            data: {
              outputType: 'webhook',
              statusCode: res.status,
              destination: cfg.destination,
            },
            completedAt: new Date().toISOString(),
          };
        } catch (err) {
          return {
            nodeId: '',
            nodeType: 'output',
            status: 'failed',
            data: {
              outputType: 'webhook',
              error: err instanceof Error ? err.message : String(err),
            },
            completedAt: new Date().toISOString(),
          };
        }
      }

      case 'email': {
        if (!cfg.destination) {
          return {
            nodeId: '',
            nodeType: 'output',
            status: 'failed',
            data: { error: 'Email destination address is required' },
            completedAt: new Date().toISOString(),
          };
        }

        try {
          // Load email connection from DB
          const [conn] = await db
            .select()
            .from(emailConnections)
            .where(eq(emailConnections.projectId, ctx.projectId))
            .limit(1);

          if (!conn) {
            return {
              nodeId: '',
              nodeType: 'output',
              status: 'failed',
              data: { error: 'No email connection configured for this project' },
              completedAt: new Date().toISOString(),
            };
          }

          const rawCreds = conn.apiCredentials as { encrypted?: string } | EmailCredentials | null;
          const credentials: EmailCredentials =
            rawCreds && 'encrypted' in rawCreds && rawCreds.encrypted
              ? JSON.parse(decryptCredentials(rawCreds.encrypted))
              : ((rawCreds ?? {}) as EmailCredentials);
          const emailClient = createEmailClient(conn.provider as EmailProvider, credentials);
          const result = await emailClient.sendEmail({
            from: conn.fromEmail ?? 'noreply@aioffice.app',
            to: [cfg.destination],
            subject: `[Workflow] ${resolvedContent.slice(0, 80)}`,
            html: `<pre>${resolvedContent}</pre>`,
            text: resolvedContent,
          });

          console.log(
            `[workflow-output] Email sent to=${cfg.destination} id=${result.providerMessageId}`,
          );

          return {
            nodeId: '',
            nodeType: 'output',
            status: result.status === 'sent' ? 'completed' : 'failed',
            data: {
              outputType: 'email',
              destination: cfg.destination,
              providerMessageId: result.providerMessageId,
              error: result.error,
            },
            completedAt: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`[workflow-output] Email failed:`, err);
          return {
            nodeId: '',
            nodeType: 'output',
            status: 'failed',
            data: {
              outputType: 'email',
              destination: cfg.destination,
              error: err instanceof Error ? err.message : String(err),
            },
            completedAt: new Date().toISOString(),
          };
        }
      }

      default: {
        return {
          nodeId: '',
          nodeType: 'output',
          status: 'completed',
          data: { outputType: cfg.outputType, content: resolvedContent },
          completedAt: new Date().toISOString(),
        };
      }
    }
  },
};
