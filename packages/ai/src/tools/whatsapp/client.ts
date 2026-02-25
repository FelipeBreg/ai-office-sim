/**
 * WhatsApp Business API provider abstraction layer.
 * Supports Z-API (BR-native), Twilio, and Meta Cloud API.
 * Provider can be swapped by changing the connection config.
 */

const PROVIDER_TIMEOUT_MS = 15_000;

export type WhatsAppProvider = 'zapi' | 'twilio' | 'meta_cloud';

export interface WhatsAppCredentials {
  instanceId?: string;
  token?: string;
  accountSid?: string;
  authToken?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

export interface SendMessageParams {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface SendMessageResult {
  providerMessageId: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  phoneNumber?: string;
}

export interface WhatsAppClient {
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
  getConnectionStatus(): Promise<ConnectionStatus>;
}

// ── Z-API Provider ──

class ZApiClient implements WhatsAppClient {
  // NOTE: Z-API embeds the token in the URL path. This means the token
  // will appear in HTTP access logs. This is a Z-API design constraint
  // and cannot be avoided with their current API.
  private baseUrl: string;

  constructor(credentials: WhatsAppCredentials) {
    if (!credentials.instanceId || !credentials.token) {
      throw new Error('Z-API requires instanceId and token');
    }
    this.baseUrl = `https://api.z-api.io/instances/${credentials.instanceId}/token/${credentials.token}`;
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const endpoint = params.mediaUrl ? '/send-image' : '/send-text';

    const body = params.mediaUrl
      ? { phone: params.to, image: params.mediaUrl, caption: params.message }
      : { phone: params.to, message: params.message };

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      return { providerMessageId: '', status: 'failed', error: `Z-API error ${res.status}: ${text}` };
    }

    const data = (await res.json()) as { zapiMessageId?: string; messageId?: string };
    return {
      providerMessageId: data.zapiMessageId ?? data.messageId ?? '',
      status: 'sent',
    };
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    const res = await fetch(`${this.baseUrl}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!res.ok) {
      return { connected: false };
    }

    const data = (await res.json()) as { connected?: boolean; smartphoneConnected?: boolean; phoneNumber?: string };
    return {
      connected: data.connected === true || data.smartphoneConnected === true,
      phoneNumber: data.phoneNumber,
    };
  }
}

// ── Twilio Provider ──

class TwilioClient implements WhatsAppClient {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(credentials: WhatsAppCredentials, phoneNumber: string) {
    if (!credentials.accountSid || !credentials.authToken) {
      throw new Error('Twilio requires accountSid and authToken');
    }
    if (!phoneNumber) {
      throw new Error('Twilio requires a non-empty fromNumber (phone number)');
    }
    this.accountSid = credentials.accountSid;
    this.authToken = credentials.authToken;
    this.fromNumber = phoneNumber;
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      From: `whatsapp:${this.fromNumber}`,
      To: `whatsapp:${params.to}`,
      Body: params.message,
      ...(params.mediaUrl ? { MediaUrl: params.mediaUrl } : {}),
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      return { providerMessageId: '', status: 'failed', error: `Twilio error ${res.status}: ${text}` };
    }

    const data = (await res.json()) as { sid?: string };
    return {
      providerMessageId: data.sid ?? '',
      status: 'sent',
    };
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    // Twilio is always "connected" if credentials are valid
    return { connected: true, phoneNumber: this.fromNumber };
  }
}

// ── Meta Cloud API Provider ──

class MetaCloudClient implements WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;

  constructor(credentials: WhatsAppCredentials) {
    if (!credentials.phoneNumberId || !credentials.accessToken) {
      throw new Error('Meta Cloud API requires phoneNumberId and accessToken');
    }
    this.phoneNumberId = credentials.phoneNumberId;
    this.accessToken = credentials.accessToken;
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: params.mediaUrl ? 'image' : 'text',
    };

    if (params.mediaUrl) {
      body.image = { link: params.mediaUrl, caption: params.message };
    } else {
      body.text = { body: params.message };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      return { providerMessageId: '', status: 'failed', error: `Meta API error ${res.status}: ${text}` };
    }

    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    return {
      providerMessageId: data.messages?.[0]?.id ?? '',
      status: 'sent',
    };
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return { connected: true };
  }
}

// ── Factory ──

export function createWhatsAppClient(
  provider: WhatsAppProvider,
  credentials: WhatsAppCredentials,
  phoneNumber?: string,
): WhatsAppClient {
  switch (provider) {
    case 'zapi':
      return new ZApiClient(credentials);
    case 'twilio':
      return new TwilioClient(credentials, phoneNumber ?? '');
    case 'meta_cloud':
      return new MetaCloudClient(credentials);
    default:
      throw new Error(`Unsupported WhatsApp provider: ${provider}`);
  }
}
