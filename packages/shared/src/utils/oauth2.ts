/**
 * OAuth2 utilities for Google and RD Station integrations.
 * Handles authorization URL generation, token exchange, and refresh.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const RDSTATION_AUTH_URL = 'https://api.rd.services/auth/dialog';
const RDSTATION_TOKEN_URL = 'https://api.rd.services/auth/token';

const FETCH_TIMEOUT_MS = 15_000;

export type OAuth2Provider = 'google' | 'rdstation';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

// Scopes for each tool type
export const GOOGLE_SCOPES: Record<string, string[]> = {
  google_gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  google_sheets: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
};

export const RDSTATION_SCOPES: Record<string, string[]> = {
  rdstation_crm: [],
  rdstation_marketing: [],
};

/**
 * Generate an OAuth2 authorization URL.
 */
export function getAuthorizationUrl(
  provider: OAuth2Provider,
  config: OAuth2Config,
  scopes: string[],
  state: string,
): string {
  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  if (provider === 'rdstation') {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state,
    });
    return `${RDSTATION_AUTH_URL}?${params.toString()}`;
  }

  throw new Error(`Unsupported OAuth2 provider: ${provider}`);
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  provider: OAuth2Provider,
  config: OAuth2Config,
  code: string,
): Promise<OAuth2Tokens> {
  const tokenUrl = provider === 'google' ? GOOGLE_TOKEN_URL : RDSTATION_TOKEN_URL;

  const body: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
    grant_type: 'authorization_code',
  };

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth2 token exchange failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(
  provider: OAuth2Provider,
  config: OAuth2Config,
  refreshToken: string,
): Promise<OAuth2Tokens> {
  const tokenUrl = provider === 'google' ? GOOGLE_TOKEN_URL : RDSTATION_TOKEN_URL;

  const body: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  };

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth2 token refresh failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
  };
}
