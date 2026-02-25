import { createTransport, type Transporter } from 'nodemailer';

const PROVIDER_TIMEOUT_MS = 15_000;

export type EmailProvider = 'smtp' | 'sendgrid' | 'aws_ses';

export interface SmtpCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
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

export interface EmailClient {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  verifyConnection(): Promise<EmailConnectionStatus>;
}

// ── SMTP Provider (Nodemailer) ──

class SmtpClient implements EmailClient {
  private transporter: Transporter;

  constructor(credentials: SmtpCredentials) {
    if (!credentials.host || !credentials.user || !credentials.pass) {
      throw new Error('SMTP requires host, user, and pass');
    }
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
