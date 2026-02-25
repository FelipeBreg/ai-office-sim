export { createEmailClient } from './client.js';
export type {
  EmailProvider,
  EmailCredentials,
  SmtpCredentials,
  SendGridCredentials,
  AwsSesCredentials,
  EmailClient,
  SendEmailParams,
  SendEmailResult,
  EmailConnectionStatus,
} from './client.js';
export { sendEmailTool } from './send.js';
