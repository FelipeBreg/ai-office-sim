import Anthropic from '@anthropic-ai/sdk';

const HELICONE_BASE_URL = 'https://anthropic.helicone.ai';
const DIRECT_BASE_URL = 'https://api.anthropic.com';

export interface HeliconeProperties {
  projectId?: string;
  agentId?: string;
  sessionId?: string;
  agentName?: string;
}

function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  return apiKey;
}

function getBaseHeaders(properties?: HeliconeProperties): Record<string, string> {
  const heliconeKey = process.env.HELICONE_API_KEY;

  if (!heliconeKey) {
    return {};
  }

  const headers: Record<string, string> = {
    'Helicone-Auth': `Bearer ${heliconeKey}`,
  };

  if (properties?.projectId) {
    headers['Helicone-Property-ProjectId'] = properties.projectId;
  }
  if (properties?.agentId) {
    headers['Helicone-Property-AgentId'] = properties.agentId;
  }
  if (properties?.sessionId) {
    headers['Helicone-Property-SessionId'] = properties.sessionId;
  }
  if (properties?.agentName) {
    headers['Helicone-Property-AgentName'] = properties.agentName;
  }

  return headers;
}

/**
 * Create an Anthropic client routed through Helicone proxy.
 * Falls back to direct Anthropic API if HELICONE_API_KEY is not set.
 */
export function createAnthropicClient(properties?: HeliconeProperties): Anthropic {
  const apiKey = getApiKey();
  const heliconeKey = process.env.HELICONE_API_KEY;
  const useHelicone = Boolean(heliconeKey);

  return new Anthropic({
    apiKey,
    baseURL: useHelicone ? HELICONE_BASE_URL : DIRECT_BASE_URL,
    defaultHeaders: useHelicone ? getBaseHeaders(properties) : undefined,
  });
}

// Cached direct client singleton (avoids connection pool churn)
let _directClient: Anthropic | null = null;

/**
 * Create a direct Anthropic client (bypasses Helicone).
 * Cached as singleton since it has no per-request properties.
 */
export function createDirectClient(): Anthropic {
  if (!_directClient) {
    _directClient = new Anthropic({
      apiKey: getApiKey(),
      baseURL: DIRECT_BASE_URL,
    });
  }
  return _directClient;
}
