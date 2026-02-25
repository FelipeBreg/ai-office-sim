import { createHmac, timingSafeEqual } from 'crypto';
import { db, whatsappConnections, whatsappMessages, eq } from '@ai-office/db';
import { getAgentExecutionQueue } from '@ai-office/queue';
import { randomUUID } from 'crypto';

/**
 * WhatsApp webhook receiver.
 * Receives incoming messages from WhatsApp API providers (Z-API, Twilio, Meta Cloud).
 * Stores messages and enqueues agent execution for the assigned handler agent.
 *
 * Each provider has its own signature verification:
 * - Meta Cloud API: HMAC-SHA256 with app secret
 * - Twilio: HMAC-SHA1 with auth token
 * - Z-API: Bearer token header
 */

// ── Signature Verification ──

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_META_APP_SECRET;
  if (!secret) {
    console.error('[whatsapp-webhook] WHATSAPP_META_APP_SECRET not configured');
    return false;
  }
  if (!signatureHeader) return false;

  // Header format: "sha256=<hex>"
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  if (expected.length !== signatureHeader.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

function verifyTwilioSignature(rawBody: string, signatureHeader: string | null, url: string): boolean {
  const authToken = process.env.WHATSAPP_TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('[whatsapp-webhook] WHATSAPP_TWILIO_AUTH_TOKEN not configured');
    return false;
  }
  if (!signatureHeader) return false;

  // Twilio signature: HMAC-SHA1 of URL + sorted form params
  const params = new URLSearchParams(rawBody);
  const sortedKeys = [...params.keys()].sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params.get(key);
  }

  const expected = createHmac('sha1', authToken).update(dataString).digest('base64');
  if (expected.length !== signatureHeader.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

function verifyZApiToken(req: Request): boolean {
  const expectedToken = process.env.WHATSAPP_ZAPI_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error('[whatsapp-webhook] WHATSAPP_ZAPI_WEBHOOK_TOKEN not configured');
    return false;
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token || token.length !== expectedToken.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

// ── GET: Meta webhook verification challenge ──

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const secret = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (
    mode === 'subscribe' &&
    secret &&
    token &&
    token.length === secret.length &&
    timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  ) {
    return new Response(challenge ?? '', { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// ── Payload Parsers ──

interface IncomingMessage {
  contactPhone: string;
  contactName?: string;
  content: string;
  mediaUrl?: string;
  providerMessageId?: string;
  timestamp?: string;
  /** The business phone number that received the message (for connection matching) */
  businessPhone?: string;
}

function parseZApiPayload(body: Record<string, unknown>): IncomingMessage | null {
  const phone = (body.phone as string) ?? (body.chatId as string)?.replace('@c.us', '');
  const text =
    (body.text as { message?: string })?.message ??
    (body.body as string) ??
    (body.caption as string);

  if (!phone || !text) return null;

  return {
    contactPhone: phone.startsWith('+') ? phone : `+${phone}`,
    contactName: (body.senderName as string) ?? undefined,
    content: text,
    mediaUrl: (body.image as { imageUrl?: string })?.imageUrl ?? undefined,
    providerMessageId: (body.messageId as string) ?? undefined,
    timestamp: (body.momment as string) ?? (body.timestamp as string) ?? undefined,
  };
}

function parseTwilioPayload(body: Record<string, unknown>): IncomingMessage | null {
  const from = (body.From as string)?.replace('whatsapp:', '');
  const to = (body.To as string)?.replace('whatsapp:', '');
  const msgBody = body.Body as string;

  if (!from || !msgBody) return null;

  return {
    contactPhone: from,
    contactName: (body.ProfileName as string) ?? undefined,
    content: msgBody,
    mediaUrl: (body.MediaUrl0 as string) ?? undefined,
    providerMessageId: (body.MessageSid as string) ?? undefined,
    businessPhone: to,
  };
}

function parseMetaPayload(body: Record<string, unknown>): IncomingMessage | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entry = (body.entry as any[])?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = value?.messages?.[0] as Record<string, any> | undefined;

  if (!message) return null;

  const from = message.from as string;
  const text = (message.text as { body?: string })?.body ?? '';
  const contact = (value.contacts as Array<{ profile?: { name?: string } }>)?.[0];
  const displayPhone = (value.metadata as { display_phone_number?: string })?.display_phone_number;

  return {
    contactPhone: from.startsWith('+') ? from : `+${from}`,
    contactName: contact?.profile?.name ?? undefined,
    content: text,
    providerMessageId: message.id as string,
    timestamp: message.timestamp as string,
    businessPhone: displayPhone ? (displayPhone.startsWith('+') ? displayPhone : `+${displayPhone}`) : undefined,
  };
}

/** Safely parse a provider timestamp. Returns current Date on failure. */
function safeParseTimestamp(ts: string | undefined): Date {
  if (!ts) return new Date();

  // Try Unix epoch seconds (Meta, Z-API)
  const asNumber = Number(ts);
  if (!isNaN(asNumber) && asNumber > 1_000_000_000 && asNumber < 10_000_000_000) {
    return new Date(asNumber * 1000);
  }
  // Try ISO string
  const asDate = new Date(ts);
  if (!isNaN(asDate.getTime())) {
    return asDate;
  }

  return new Date();
}

// ── POST: Incoming message handler ──

export async function POST(req: Request): Promise<Response> {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  let body: Record<string, unknown>;
  let isTwilioFormat = false;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Twilio sends form-encoded data
    const params = new URLSearchParams(rawBody);
    body = Object.fromEntries(params.entries());
    isTwilioFormat = true;
  }

  // Detect provider from payload shape and verify signature
  let parsed: IncomingMessage | null = null;
  let detectedProvider: string = 'unknown';

  if ('entry' in body && 'object' in body) {
    // Meta Cloud API format
    const sig = req.headers.get('x-hub-signature-256');
    if (!verifyMetaSignature(rawBody, sig)) {
      console.warn('[whatsapp-webhook] Meta signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }
    parsed = parseMetaPayload(body);
    detectedProvider = 'meta_cloud';
  } else if (isTwilioFormat || 'AccountSid' in body || 'From' in body) {
    // Twilio format
    const sig = req.headers.get('x-twilio-signature');
    if (!verifyTwilioSignature(rawBody, sig, req.url)) {
      console.warn('[whatsapp-webhook] Twilio signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }
    parsed = parseTwilioPayload(body);
    detectedProvider = 'twilio';
  } else if ('phone' in body || 'chatId' in body) {
    // Z-API format
    if (!verifyZApiToken(req)) {
      console.warn('[whatsapp-webhook] Z-API token verification failed');
      return new Response('Unauthorized', { status: 401 });
    }
    parsed = parseZApiPayload(body);
    detectedProvider = 'zapi';
  }

  if (!parsed) {
    console.warn('[whatsapp-webhook] Could not parse incoming message:', detectedProvider, 'keys:', Object.keys(body));
    // Return 200 to prevent provider retries for unparseable messages
    return new Response('OK', { status: 200 });
  }

  // Find the WhatsApp connection that matches by phone number first
  const connections = await db
    .select()
    .from(whatsappConnections)
    .where(eq(whatsappConnections.status, 'connected'));

  // Match by business phone number (most reliable for multi-tenant)
  let connection = parsed.businessPhone
    ? connections.find((c) => c.phoneNumber && c.phoneNumber === parsed!.businessPhone)
    : undefined;
  // Fallback: match by provider type only if exactly one connection exists for that provider
  if (!connection) {
    const providerMatches = connections.filter((c) => c.provider === detectedProvider);
    connection = providerMatches.length === 1 ? providerMatches[0] : undefined;
  }

  if (!connection) {
    console.warn(`[whatsapp-webhook] No matching WhatsApp connection for provider=${detectedProvider} phone=${parsed.contactPhone}`);
    return new Response('OK', { status: 200 });
  }

  // Store the incoming message (wrapped in try/catch to always return 200)
  let messageRecord: { id: string } | undefined;
  try {
    const [record] = await db
      .insert(whatsappMessages)
      .values({
        projectId: connection.projectId,
        connectionId: connection.id,
        direction: 'inbound',
        status: 'delivered',
        contactPhone: parsed.contactPhone,
        contactName: parsed.contactName,
        content: parsed.content,
        mediaUrl: parsed.mediaUrl,
        providerMessageId: parsed.providerMessageId,
        rawPayload: body,
        sentAt: safeParseTimestamp(parsed.timestamp),
      })
      .returning({ id: whatsappMessages.id });

    messageRecord = record;

    console.log(
      `[whatsapp-webhook] Inbound message from ${parsed.contactPhone} stored (id: ${record!.id})`,
    );
  } catch (err) {
    console.error('[whatsapp-webhook] Failed to store inbound message:', err);
    // Return 200 even on DB failure to prevent infinite retries from provider
    return new Response('OK', { status: 200 });
  }

  // Enqueue agent execution if a handler agent is configured
  if (connection.handlerAgentId && messageRecord) {
    const queue = getAgentExecutionQueue();
    const sessionId = randomUUID();

    try {
      await queue.add(`whatsapp-${messageRecord.id}`, {
        agentId: connection.handlerAgentId,
        projectId: connection.projectId,
        sessionId,
        triggerPayload: {
          trigger_type: 'event',
          event: 'whatsapp:message_received',
          contactPhone: parsed.contactPhone,
          contactName: parsed.contactName,
          messageContent: parsed.content,
          messageId: messageRecord.id,
          mediaUrl: parsed.mediaUrl,
        },
      });

      console.log(
        `[whatsapp-webhook] Enqueued agent execution: agent=${connection.handlerAgentId} session=${sessionId}`,
      );
    } catch (err) {
      console.error('[whatsapp-webhook] Failed to enqueue agent execution:', err);
    }
  }

  return new Response('OK', { status: 200 });
}
