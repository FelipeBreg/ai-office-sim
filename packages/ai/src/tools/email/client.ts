import { createTransport, type Transporter } from 'nodemailer';
import { ImapFlow } from 'imapflow';

const PROVIDER_TIMEOUT_MS = 15_000;
const IMAP_DEFAULT_PORT = 993;
const MAX_BODY_LENGTH = 4_000;

export type EmailProvider = 'smtp' | 'sendgrid' | 'aws_ses';

export interface SmtpCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
}

export interface SendGridCredentials {
  apiKey: string;
}

export interface AwsSesCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export type EmailCredentials = SmtpCredentials | SendGridCredentials | AwsSesCredentials;

export interface SendEmailParams {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  providerMessageId: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface EmailConnectionStatus {
  connected: boolean;
  error?: string;
}

export interface ReadEmailParams {
  query?: string;
  limit?: number;
  unreadOnly?: boolean;
}

export interface EmailMessage {
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  messageId: string;
}

export interface ReadEmailResult {
  emails: EmailMessage[];
  error?: string;
}

export interface EmailClient {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  readEmails(params: ReadEmailParams): Promise<ReadEmailResult>;
  verifyConnection(): Promise<EmailConnectionStatus>;
}

// ── SMTP Provider (Nodemailer + IMAP) ──

class SmtpClient implements EmailClient {
  private transporter: Transporter;
  private credentials: SmtpCredentials;

  constructor(credentials: SmtpCredentials) {
    if (!credentials.host || !credentials.user || !credentials.pass) {
      throw new Error('SMTP requires host, user, and pass');
    }
    this.credentials = credentials;
    this.transporter = createTransport({
      host: credentials.host,
      port: credentials.port || 587,
      secure: credentials.secure ?? false,
      auth: {
        user: credentials.user,
        pass: credentials.pass,
      },
      connectionTimeout: PROVIDER_TIMEOUT_MS,
      greetingTimeout: PROVIDER_TIMEOUT_MS,
      socketTimeout: PROVIDER_TIMEOUT_MS,
    });
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: params.from,
        to: params.to.join(', '),
        cc: params.cc?.join(', '),
        bcc: params.bcc?.join(', '),
        replyTo: params.replyTo,
        subject: params.subject,
        html: params.html,
        text: params.text,
        headers: params.headers,
        attachments: params.attachments?.map((a) => ({
          filename: a.filename,
          path: a.path,
          contentType: a.contentType,
        })),
      });

      return {
        providerMessageId: info.messageId ?? '',
        status: 'sent',
      };
    } catch (err) {
      return {
        providerMessageId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown SMTP error',
      };
    }
  }

  async readEmails(params: ReadEmailParams): Promise<ReadEmailResult> {
    const { query, limit = 20, unreadOnly = false } = params;

    const client = new ImapFlow({
      host: this.credentials.imapHost || this.credentials.host,
      port: this.credentials.imapPort || IMAP_DEFAULT_PORT,
      secure: this.credentials.imapSecure ?? true,
      auth: {
        user: this.credentials.user,
        pass: this.credentials.pass,
      },
      logger: false,
      connectionTimeout: PROVIDER_TIMEOUT_MS,
      greetingTimeout: PROVIDER_TIMEOUT_MS,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Build search query
        const searchQuery: Record<string, unknown> = {};
        if (unreadOnly) searchQuery.seen = false;
        if (query) searchQuery.or = [{ subject: query }, { from: query }, { body: query }];
        if (!unreadOnly && !query) searchQuery.all = true;

        const uids = await client.search(searchQuery, { uid: true });
        if (!uids || uids.length === 0) {
          return { emails: [] };
        }

        // Take only the most recent `limit` UIDs
        const recentUids = uids.slice(-limit);

        const emails: EmailMessage[] = [];
        for await (const msg of client.fetch(recentUids, {
          uid: true,
          envelope: true,
          flags: true,
          bodyParts: ['1'],
        }, { uid: true })) {
          const from = msg.envelope?.from?.[0];
          const fromStr = from?.name
            ? `${from.name} <${from.address ?? ''}>`
            : (from?.address ?? 'unknown');

          let body = '';
          if (msg.bodyParts) {
            const part = msg.bodyParts.get('1');
            if (part) {
              body = part.toString('utf-8').slice(0, MAX_BODY_LENGTH);
            }
          }

          emails.push({
            from: fromStr,
            subject: msg.envelope?.subject ?? '(no subject)',
            body,
            date: msg.envelope?.date?.toISOString() ?? '',
            isRead: msg.flags?.has('\\Seen') ?? false,
            messageId: msg.envelope?.messageId ?? String(msg.uid),
          });
        }

        // Return in chronological order (oldest first)
        return { emails };
      } finally {
        lock.release();
      }
    } catch (err) {
      return {
        emails: [],
        error: err instanceof Error ? err.message : 'IMAP read failed',
      };
    } finally {
      await client.logout().catch(() => {});
    }
  }

  async verifyConnection(): Promise<EmailConnectionStatus> {
    try {
      await this.transporter.verify();
      return { connected: true };
    } catch (err) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : 'SMTP verification failed',
      };
    }
  }
}

// ── SendGrid Provider (stub) ──

class SendGridClient implements EmailClient {
  constructor(_credentials: SendGridCredentials) {}

  async sendEmail(_params: SendEmailParams): Promise<SendEmailResult> {
    return { providerMessageId: '', status: 'failed', error: 'SendGrid provider not yet implemented' };
  }

  async readEmails(_params: ReadEmailParams): Promise<ReadEmailResult> {
    return { emails: [], error: 'SendGrid read not supported — use SMTP provider for IMAP access' };
  }

  async verifyConnection(): Promise<EmailConnectionStatus> {
    return { connected: false, error: 'SendGrid provider not yet implemented' };
  }
}

// ── AWS SES Provider (stub) ──

class AwsSesClient implements EmailClient {
  constructor(_credentials: AwsSesCredentials) {}

  async sendEmail(_params: SendEmailParams): Promise<SendEmailResult> {
    return { providerMessageId: '', status: 'failed', error: 'AWS SES provider not yet implemented' };
  }

  async readEmails(_params: ReadEmailParams): Promise<ReadEmailResult> {
    return { emails: [], error: 'AWS SES read not supported — use SMTP provider for IMAP access' };
  }

  async verifyConnection(): Promise<EmailConnectionStatus> {
    return { connected: false, error: 'AWS SES provider not yet implemented' };
  }
}

// ── Factory ──

export function createEmailClient(
  provider: EmailProvider,
  credentials: EmailCredentials,
): EmailClient {
  switch (provider) {
    case 'smtp':
      return new SmtpClient(credentials as SmtpCredentials);
    case 'sendgrid':
      return new SendGridClient(credentials as SendGridCredentials);
    case 'aws_ses':
      return new AwsSesClient(credentials as AwsSesCredentials);
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}
