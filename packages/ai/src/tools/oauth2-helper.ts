/**
 * Helper to retrieve a valid OAuth2 access token for a tool.
 * Auto-refreshes if expired.
 */
import { db, toolCredentials, eq, and } from '@ai-office/db';
import {
  decryptCredentials,
  encryptCredentials,
  refreshAccessToken,
  type OAuth2Config,
  type OAuth2Provider,
} from '@ai-office/shared';

type ToolType = 'google_gmail' | 'google_sheets' | 'rdstation_crm' | 'rdstation_marketing';

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

function getProvider(toolType: ToolType): OAuth2Provider {
  if (toolType.startsWith('google_')) return 'google';
  if (toolType.startsWith('rdstation_')) return 'rdstation';
  throw new Error(`Unknown tool type: ${toolType}`);
}

function getOAuth2Config(provider: OAuth2Provider): OAuth2Config | null {
  if (provider === 'google') {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) return null;
    return { clientId, clientSecret, redirectUri };
  }
  if (provider === 'rdstation') {
    const clientId = process.env.RDSTATION_OAUTH_CLIENT_ID;
    const clientSecret = process.env.RDSTATION_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.RDSTATION_OAUTH_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) return null;
    return { clientId, clientSecret, redirectUri };
  }
  return null;
}

/**
 * Get a valid access token for a tool type + project.
 * Returns null if no credential exists, or throws if refresh fails.
 */
export async function getValidAccessToken(
  projectId: string,
  toolType: ToolType,
): Promise<string | null> {
  const [cred] = await db
    .select()
    .from(toolCredentials)
    .where(
      and(
        eq(toolCredentials.projectId, projectId),
        eq(toolCredentials.toolType, toolType),
      ),
    )
    .limit(1);

  if (!cred) return null;

  const isExpired = cred.expiresAt && cred.expiresAt.getTime() - REFRESH_BUFFER_MS < Date.now();

  if (!isExpired) {
    return decryptCredentials(cred.accessToken);
  }

  // Token expired — try to refresh
  if (!cred.refreshToken) {
    return null; // Can't refresh without a refresh token
  }

  const provider = getProvider(toolType);
  const config = getOAuth2Config(provider);
  if (!config) return null;

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

  return tokens.accessToken;
}
