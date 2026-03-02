import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, documents } from '@ai-office/db';
import { ingestDocument } from '../../memory/ingest.js';

/** Resolve {{variable}} placeholders in a template string */
function resolveTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] ?? '');
}

/** Wrap content in a printable HTML document with inline styles */
function wrapHtmlDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${title.replace(/[<>&]/g, '')}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; max-width: 21cm; margin: 0 auto; padding: 2cm; }
  h1 { font-size: 18pt; margin-bottom: 0.5em; border-bottom: 2px solid #1a1a1a; padding-bottom: 0.3em; }
  h2 { font-size: 14pt; margin-top: 1.5em; }
  h3 { font-size: 12pt; margin-top: 1em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  .header { text-align: center; margin-bottom: 2em; }
  .footer { margin-top: 3em; font-size: 10pt; color: #666; border-top: 1px solid #ccc; padding-top: 0.5em; }
  .signature-line { margin-top: 3em; border-top: 1px solid #1a1a1a; width: 250px; padding-top: 0.3em; }
</style>
</head>
<body>
${bodyHtml}
<div class="footer">
  Generated on ${new Date().toLocaleDateString('pt-BR')} — AI Office
</div>
</body>
</html>`;
}

export const generateDocumentTool: ToolDefinition = {
  name: 'generate_document',
  description:
    'Generate a formatted document from a template or raw content. ' +
    'Supports HTML output with print-ready styling (A4 layout). ' +
    'Use {{variable}} placeholders in the template that get replaced with data values. ' +
    'The generated document is saved to the knowledge base and auto-embedded for search. ' +
    'Use this for contracts, proposals, reports, DRE, SOPs, DARFs, and any formal documents.',
  inputSchema: z.object({
    title: z.string().describe('Document title'),
    template: z
      .string()
      .describe('HTML template with {{variable}} placeholders, or raw HTML/markdown content'),
    data: z
      .record(z.string())
      .optional()
      .describe('Key-value pairs to replace {{variable}} placeholders in the template'),
    format: z
      .enum(['html', 'pdf'])
      .optional()
      .describe('Output format (default: html). PDF returns HTML with print-ready styling.'),
    metadata: z.record(z.unknown()).optional().describe('Optional metadata key-value pairs'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      title,
      template,
      data = {},
      format = 'html',
      metadata,
    } = input as {
      title: string;
      template: string;
      data?: Record<string, string>;
      format?: 'html' | 'pdf';
      metadata?: Record<string, unknown>;
    };

    // Resolve template variables
    const resolvedBody = resolveTemplate(template.slice(0, 100_000), data);

    // Wrap in full HTML document with print-ready styles
    const fullHtml = wrapHtmlDocument(title, resolvedBody);

    // Store in documents table via ingest pipeline (chunking + embedding)
    const result = await ingestDocument({
      projectId: context.projectId,
      title: title.slice(0, 500),
      content: fullHtml,
      sourceType: 'agent',
      metadata: {
        ...metadata,
        format,
        generatedByAgent: context.agentId,
        generatedAt: new Date().toISOString(),
      },
    });

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
      format,
      htmlLength: fullHtml.length,
      message:
        format === 'pdf'
          ? `Document "${title}" generated as print-ready HTML (${fullHtml.length} chars). Open in browser and print to PDF.`
          : `Document "${title}" generated and saved (${result.chunkCount} chunks, searchable).`,
    };
  },
};
