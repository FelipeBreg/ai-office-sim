import { z } from 'zod';
import { createTRPCRouter, adminProcedure, projectProcedure } from '../trpc.js';
import {
  db,
  whatsappConnections,
  whatsappTemplates,
  whatsappMessages,
  eq,
  and,
  desc,
  lt,
} from '@ai-office/db';
import { encryptCredentials, decryptCredentials } from '@ai-office/shared';
import { createWhatsAppClient } from '@ai-office/ai';
import { TRPCError } from '@trpc/server';

type ConnectionRow = typeof whatsappConnections.$inferSelect;

/** Strip apiCredentials from a connection row before returning to client */
function sanitizeConnection(connection: ConnectionRow) {
  const { apiCredentials: _, ...safe } = connection;
  return safe;
}

export const whatsappRouter = createTRPCRouter({
  // ── Connection Management ──

  getConnection: projectProcedure.query(async ({ ctx }) => {
    const [connection] = await db
      .select()
      .from(whatsappConnections)
      .where(eq(whatsappConnections.projectId, ctx.project!.id))
      .limit(1);

    if (!connection) return null;

    return {
      id: connection.id,
      provider: connection.provider,
      status: connection.status,
      phoneNumber: connection.phoneNumber,
      handlerAgentId: connection.handlerAgentId,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }),

  saveConnection: adminProcedure
    .input(
      z.object({
        provider: z.enum(['zapi', 'twilio', 'meta_cloud']),
        phoneNumber: z.string().optional(),
        apiCredentials: z.object({
          instanceId: z.string().optional(),
          token: z.string().optional(),
          accountSid: z.string().optional(),
          authToken: z.string().optional(),
          phoneNumberId: z.string().optional(),
          accessToken: z.string().optional(),
        }),
        handlerAgentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Encrypt credentials before storing
      const encryptedCredentials = encryptCredentials(JSON.stringify(input.apiCredentials));

      // Upsert: one connection per project
      const [existing] = await db
        .select({ id: whatsappConnections.id })
        .from(whatsappConnections)
        .where(eq(whatsappConnections.projectId, ctx.project!.id))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(whatsappConnections)
          .set({
            provider: input.provider,
            phoneNumber: input.phoneNumber,
            apiCredentials: { encrypted: encryptedCredentials },
            handlerAgentId: input.handlerAgentId,
            status: 'pending',
          })
          .where(eq(whatsappConnections.id, existing.id))
          .returning();
        return sanitizeConnection(updated!);
      }

      const [created] = await db
        .insert(whatsappConnections)
        .values({
          projectId: ctx.project!.id,
          provider: input.provider,
          phoneNumber: input.phoneNumber,
          apiCredentials: { encrypted: encryptedCredentials },
          handlerAgentId: input.handlerAgentId,
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
      // If setting to 'connected', verify credentials actually work
      if (input.status === 'connected') {
        const [connection] = await db
          .select()
          .from(whatsappConnections)
          .where(eq(whatsappConnections.projectId, ctx.project!.id))
          .limit(1);

        if (!connection) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'WhatsApp connection not found' });
        }

        // Decrypt and verify credentials by checking connection status
        try {
          const creds = connection.apiCredentials as { encrypted?: string } | null;
          if (!creds?.encrypted) {
            throw new Error('No credentials stored');
          }
          const decrypted = JSON.parse(decryptCredentials(creds.encrypted));
          const client = createWhatsAppClient(
            connection.provider as 'zapi' | 'twilio' | 'meta_cloud',
            decrypted,
            connection.phoneNumber ?? undefined,
          );
          const status = await client.getConnectionStatus();
          if (!status.connected) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Provider verification failed: credentials are invalid or service is unreachable',
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
        .update(whatsappConnections)
        .set({ status: input.status })
        .where(eq(whatsappConnections.projectId, ctx.project!.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'WhatsApp connection not found' });
      }
      return sanitizeConnection(updated);
    }),

  // ── Template Management ──

  listTemplates: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.projectId, ctx.project!.id))
      .orderBy(desc(whatsappTemplates.createdAt));
  }),

  createTemplate: adminProcedure
    .input(
      z.object({
        templateName: z.string().min(1).max(100),
        language: z.string().default('pt-BR'),
        content: z.string().min(1).max(4096),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .insert(whatsappTemplates)
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
        templateName: z.string().min(1).max(100).optional(),
        content: z.string().min(1).max(4096).optional(),
        language: z.string().optional(),
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        providerTemplateId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(whatsappTemplates)
        .set(data)
        .where(
          and(eq(whatsappTemplates.id, id), eq(whatsappTemplates.projectId, ctx.project!.id)),
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
        .delete(whatsappTemplates)
        .where(
          and(
            eq(whatsappTemplates.id, input.id),
            eq(whatsappTemplates.projectId, ctx.project!.id),
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
        contactPhone: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(whatsappMessages.projectId, ctx.project!.id)];

      if (input.contactPhone) {
        conditions.push(eq(whatsappMessages.contactPhone, input.contactPhone));
      }

      // Cursor-based pagination: fetch messages older than the cursor
      if (input.cursor) {
        const [cursorMsg] = await db
          .select({ sentAt: whatsappMessages.sentAt })
          .from(whatsappMessages)
          .where(eq(whatsappMessages.id, input.cursor))
          .limit(1);

        if (cursorMsg) {
          conditions.push(lt(whatsappMessages.sentAt, cursorMsg.sentAt));
        }
      }

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...conditions))
        .orderBy(desc(whatsappMessages.sentAt))
        .limit(input.limit + 1);

      const hasMore = messages.length > input.limit;
      if (hasMore) messages.pop();

      return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1]?.id : undefined,
      };
    }),
});
