import { z } from 'zod';
import { createTRPCRouter, adminProcedure, projectProcedure } from '../trpc.js';
import { db, toolCredentials, eq, and } from '@ai-office/db';
import {
  encryptCredentials,
  decryptCredentials,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  GOOGLE_SCOPES,
  RDSTATION_SCOPES,
  type OAuth2Config,
  type OAuth2Provider,
} from '@ai-office/shared';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'crypto';

const TOOL_TYPE_VALUES = [
  'google_gmail',
  'google_sheets',
  'rdstation_crm',
  'rdstation_marketing',
] as const;
type ToolType = (typeof TOOL_TYPE_VALUES)[number];

/** Map tool type to OAuth2 provider */
function getProvider(toolType: ToolType): OAuth2Provider {
  if (toolType.startsWith('google_')) return 'google';
  if (toolType.startsWith('rdstation_')) return 'rdstation';
  throw new Error(`Unknown tool type: ${toolType}`);
}

/** Build OAuth2 config from env vars */
function getOAuth2Config(provider: OAuth2Provider): OAuth2Config {
  if (provider === 'google') {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Google OAuth2 not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.',
      });
    }
    return { clientId, clientSecret, redirectUri };
  }

  if (provider === 'rdstation') {
    const clientId = process.env.RDSTATION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.RDSTATION_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.RDSTATION_OAUTH_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'RD Station OAuth2 not configured. Set RDSTATION_OAUTH_CLIENT_ID, RDSTATION_OAUTH_CLIENT_SECRET, and RDSTATION_OAUTH_REDIRECT_URI.',
      });
    }
    return { clientId, clientSecret, redirectUri };
  }

  throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown provider: ${provider}` });
}

/** Get scopes for a tool type */
function getScopes(toolType: ToolType): string[] {
  return GOOGLE_SCOPES[toolType] ?? RDSTATION_SCOPES[toolType] ?? [];
}

export const toolCredentialsRouter = createTRPCRouter({
  /** List all tool connections for this project */
  list: projectProcedure.query(async ({ ctx }) => {
    const creds = await db
      .select({
        id: toolCredentials.id,
        toolType: toolCredentials.toolType,
        expiresAt: toolCredentials.expiresAt,
        metadata: toolCredentials.metadata,
        createdAt: toolCredentials.createdAt,
        updatedAt: toolCredentials.updatedAt,
      })
      .from(toolCredentials)
      .where(eq(toolCredentials.projectId, ctx.project!.id));

    return creds.map((c) => ({
      ...c,
      connected: true,
      expired: c.expiresAt ? c.expiresAt < new Date() : false,
    }));
  }),

  /** Get authorization URL to start OAuth2 flow */
  getAuthUrl: adminProcedure
    .input(z.object({
      toolType: z.enum(TOOL_TYPE_VALUES),
    }))
    .mutation(({ ctx, input }) => {
      const provider = getProvider(input.toolType);
      const config = getOAuth2Config(provider);
      const scopes = getScopes(input.toolType);

      // State encodes project ID + tool type for the callback
      const nonce = randomBytes(16).toString('hex');
      const state = Buffer.from(
        JSON.stringify({
          projectId: ctx.project!.id,
          toolType: input.toolType,
          nonce,
        }),
      ).toString('base64url');

      const url = getAuthorizationUrl(provider, config, scopes, state);
      return { url, state };
    }),

  /** Exchange authorization code for tokens (called from OAuth callback) */
  exchangeCode: adminProcedure
    .input(z.object({
      toolType: z.enum(TOOL_TYPE_VALUES),
      code: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const provider = getProvider(input.toolType);
      const config = getOAuth2Config(provider);

      const tokens = await exchangeCodeForTokens(provider, config, input.code);

      const encryptedAccess = encryptCredentials(tokens.accessToken);
      const encryptedRefresh = tokens.refreshToken
        ? encryptCredentials(tokens.refreshToken)
        : null;

      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null;

      // Upsert: one credential per project + tool type
      const [existing] = await db
        .select({ id: toolCredentials.id })
        .from(toolCredentials)
        .where(
          and(
            eq(toolCredentials.projectId, ctx.project!.id),
            eq(toolCredentials.toolType, input.toolType),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(toolCredentials)
          .set({
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            expiresAt,
            metadata: {
              scopes: tokens.scope?.split(' '),
            },
          })
          .where(eq(toolCredentials.id, existing.id));
      } else {
        await db.insert(toolCredentials).values({
          projectId: ctx.project!.id,
          toolType: input.toolType,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          expiresAt,
          metadata: {
            scopes: tokens.scope?.split(' '),
          },
        });
      }

      return { connected: true, toolType: input.toolType };
    }),

  /** Disconnect (delete) a tool credential */
  disconnect: adminProcedure
    .input(z.object({
      toolType: z.enum(TOOL_TYPE_VALUES),
    }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(toolCredentials)
        .where(
          and(
            eq(toolCredentials.projectId, ctx.project!.id),
            eq(toolCredentials.toolType, input.toolType),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No ${input.toolType} connection found`,
        });
      }

      return { disconnected: true, toolType: input.toolType };
    }),

  /** Manually refresh tokens for a tool */
  refreshTokens: adminProcedure
    .input(z.object({
      toolType: z.enum(TOOL_TYPE_VALUES),
    }))
    .mutation(async ({ ctx, input }) => {
      const [cred] = await db
        .select()
        .from(toolCredentials)
        .where(
          and(
            eq(toolCredentials.projectId, ctx.project!.id),
            eq(toolCredentials.toolType, input.toolType),
          ),
        )
        .limit(1);

      if (!cred) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `No ${input.toolType} connection` });
      }
      if (!cred.refreshToken) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No refresh token available' });
      }

      const provider = getProvider(input.toolType);
      const config = getOAuth2Config(provider);
      const decryptedRefresh = decryptCredentials(cred.refreshToken);

      const tokens = await refreshAccessToken(provider, config, decryptedRefresh);

      const encryptedAccess = encryptCredentials(tokens.accessToken);
      const encryptedRefresh = tokens.refreshToken
        ? encryptCredentials(tokens.refreshToken)
        : cred.refreshToken;

      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null;

      await db
        .update(toolCredentials)
        .set({
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          expiresAt,
        })
        .where(eq(toolCredentials.id, cred.id));

      return { refreshed: true, expiresAt };
    }),
});
