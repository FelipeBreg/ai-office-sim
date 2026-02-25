import { z } from 'zod';
import { createTRPCRouter, adminProcedure, projectProcedure } from '../trpc.js';
import {
  db,
  emailConnections,
  emailTemplates,
  emailMessages,
  eq,
  and,
  desc,
  lt,
} from '@ai-office/db';
import { encryptCredentials, decryptCredentials } from '@ai-office/shared';
import { createEmailClient } from '@ai-office/ai';
import { TRPCError } from '@trpc/server';

type ConnectionRow = typeof emailConnections.$inferSelect;

/** Strip apiCredentials from a connection row before returning to client */
function sanitizeConnection(connection: ConnectionRow) {
  const { apiCredentials: _, ...safe } = connection;
  return safe;
}

export const emailRouter = createTRPCRouter({
  // ── Connection Management ──

  getConnection: projectProcedure.query(async ({ ctx }) => {
    const [connection] = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.projectId, ctx.project!.id))
      .limit(1);

    if (!connection) return null;

    return {
      id: connection.id,
      provider: connection.provider,
      status: connection.status,
      fromEmail: connection.fromEmail,
      fromName: connection.fromName,
      replyTo: connection.replyTo,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }),

  saveConnection: adminProcedure
    .input(
      z.object({
        provider: z.enum(['smtp', 'sendgrid', 'aws_ses']),
        fromEmail: z.string().email(),
        fromName: z.string().optional(),
        replyTo: z.string().email().optional(),
        apiCredentials: z.object({
          host: z.string().optional(),
          port: z.number().optional(),
          secure: z.boolean().optional(),
          user: z.string().optional(),
          pass: z.string().optional(),
          apiKey: z.string().optional(),
          accessKeyId: z.string().optional(),
          secretAccessKey: z.string().optional(),
          region: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encryptedCredentials = encryptCredentials(JSON.stringify(input.apiCredentials));

      const [existing] = await db
        .select({ id: emailConnections.id })
        .from(emailConnections)
        .where(eq(emailConnections.projectId, ctx.project!.id))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(emailConnections)
          .set({
            provider: input.provider,
            fromEmail: input.fromEmail,
            fromName: input.fromName,
            replyTo: input.replyTo,
            apiCredentials: { encrypted: encryptedCredentials },
            status: 'pending',
          })
          .where(eq(emailConnections.id, existing.id))
          .returning();
        return sanitizeConnection(updated!);
      }

      const [created] = await db
        .insert(emailConnections)
        .values({
          projectId: ctx.project!.id,
          provider: input.provider,
          fromEmail: input.fromEmail,
          fromName: input.fromName,
          replyTo: input.replyTo,
          apiCredentials: { encrypted: encryptedCredentials },
          status: 'pending',
        })
        .returning();
      return sanitizeConnection(created!);
    }),

  updateConnectionStatus: adminProcedure
    .input(
      z.object({
        status: z.enum(['connected', 'disconnected', 'pending']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.status === 'connected') {
        const [connection] = await db
          .select()
          .from(emailConnections)
          .where(eq(emailConnections.projectId, ctx.project!.id))
          .limit(1);

        if (!connection) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Email connection not found' });
        }

        try {
          const creds = connection.apiCredentials as { encrypted?: string } | null;
          if (!creds?.encrypted) {
            throw new Error('No credentials stored');
          }
          const decrypted = JSON.parse(decryptCredentials(creds.encrypted));
          const client = createEmailClient(
            connection.provider as 'smtp' | 'sendgrid' | 'aws_ses',
            decrypted,
          );
          const status = await client.verifyConnection();
          if (!status.connected) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Email verification failed: ${status.error ?? 'credentials are invalid or service is unreachable'}`,
            });
          }
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Credential verification failed: ${err instanceof Error ? err.message : 'unknown error'}`,
          });
        }
      }

      const [updated] = await db
        .update(emailConnections)
        .set({ status: input.status })
        .where(eq(emailConnections.projectId, ctx.project!.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Email connection not found' });
      }
      return sanitizeConnection(updated);
    }),

  // ── Template Management ──

  listTemplates: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.projectId, ctx.project!.id))
      .orderBy(desc(emailTemplates.createdAt));
  }),

  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        subject: z.string().min(1).max(998),
        bodyHtml: z.string().min(1).max(256 * 1024),
        bodyText: z.string().optional(),
        messageType: z.enum(['transactional', 'marketing']).default('transactional'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .insert(emailTemplates)
        .values({
          projectId: ctx.project!.id,
          ...input,
        })
        .returning();
      return template;
    }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        subject: z.string().min(1).max(998).optional(),
        bodyHtml: z.string().min(1).max(256 * 1024).optional(),
        bodyText: z.string().optional(),
        messageType: z.enum(['transactional', 'marketing']).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(emailTemplates)
        .set(data)
        .where(
          and(eq(emailTemplates.id, id), eq(emailTemplates.projectId, ctx.project!.id)),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return updated;
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.projectId, ctx.project!.id),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }
      return { deleted: true };
    }),

  // ── Message History ──

  listMessages: projectProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(emailMessages.projectId, ctx.project!.id)];

      if (input.cursor) {
        const [cursorMsg] = await db
          .select({ createdAt: emailMessages.createdAt })
          .from(emailMessages)
          .where(eq(emailMessages.id, input.cursor))
          .limit(1);

        if (cursorMsg) {
          conditions.push(lt(emailMessages.createdAt, cursorMsg.createdAt));
        }
      }

      const messages = await db
        .select()
        .from(emailMessages)
        .where(and(...conditions))
        .orderBy(desc(emailMessages.createdAt))
        .limit(input.limit + 1);

      const hasMore = messages.length > input.limit;
      if (hasMore) messages.pop();

      return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1]?.id : undefined,
      };
    }),
});
