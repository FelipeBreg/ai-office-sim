/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export { encryptCredentials, decryptCredentials } from './crypto.js';
export {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  GOOGLE_SCOPES,
  RDSTATION_SCOPES,
} from './oauth2.js';
export type { OAuth2Provider, OAuth2Config, OAuth2Tokens } from './oauth2.js';
