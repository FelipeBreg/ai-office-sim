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
  ReadEmailParams,
  ReadEmailResult,
  EmailMessage,
} from './client.js';
export { sendEmailTool } from './send.js';
export { readEmailTool } from './read.js';
