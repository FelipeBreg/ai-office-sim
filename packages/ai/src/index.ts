// Client
export { createAnthropicClient, createDirectClient } from './client.js';
export type { HeliconeProperties } from './client.js';

// Engine
export { callLLM } from './engine/llm.js';
export type { LLMCallContext, LLMCallResult } from './engine/llm.js';
export { executeAgent } from './engine/executor.js';
export type {
  AgentSession,
  AgentContext,
  ToolDefinition,
  ToolExecutionContext,
  ExecutionResult,
  ActionRecord,
  SafetyLimits,
} from './engine/types.js';
export { DEFAULT_SAFETY_LIMITS } from './engine/types.js';
export { checkApprovalRule } from './engine/approval-check.js';
export type { ApprovalAction } from './engine/approval-check.js';

// Workflow Engine
export { executeWorkflow } from './engine/workflow/executor.js';
export type { WorkflowRunContext, WorkflowExecutionResult } from './engine/workflow/types.js';
export { PausedException } from './engine/workflow/types.js';

// Tools
export { toolRegistry } from './tools/registry.js';

// Web Search
export { searchWebTool } from './tools/web-search/index.js';

// WhatsApp
export {
  createWhatsAppClient,
  sendWhatsAppMessageTool,
  readWhatsAppMessagesTool,
} from './tools/whatsapp/index.js';
export type {
  WhatsAppProvider,
  WhatsAppCredentials,
  WhatsAppClient,
  SendMessageParams,
  SendMessageResult,
  ConnectionStatus,
} from './tools/whatsapp/index.js';

// Email
export {
  createEmailClient,
  sendEmailTool,
  readEmailTool,
} from './tools/email/index.js';
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
} from './tools/email/index.js';

// CRM (RD Station)
export {
  createCrmClient,
  searchContactsTool,
  createContactTool,
  updateContactTool,
  listDealsTool,
  createDealTool,
} from './tools/crm/index.js';
export type { CrmClient, RdStationContact, RdStationDeal } from './tools/crm/index.js';

// Google Sheets
export {
  createSheetsClient,
  readSpreadsheetTool,
  writeSpreadsheetTool,
  appendToSpreadsheetTool,
} from './tools/sheets/index.js';
export type { SheetsClient } from './tools/sheets/index.js';

// Finance (Pix + NFe)
export {
  monitorPixTransactionsTool,
  checkNfeStatusTool,
} from './tools/finance/index.js';

// OAuth2 Helper
export { getValidAccessToken } from './tools/oauth2-helper.js';

// Memory
export { loadMemory, saveMemory, searchMemory } from './memory/individual.js';
export { ingestDocument, deleteDocument, splitIntoChunks } from './memory/ingest.js';
export type { IngestDocumentParams, IngestResult, DocumentSourceType } from './memory/ingest.js';
export { ragSearch } from './memory/rag-search.js';
export type { RagSearchParams, RagSearchResult } from './memory/rag-search.js';
export { extractMemories, autoExtractAndSave } from './memory/auto-extract.js';
export type { MemoryEntry } from './memory/auto-extract.js';
export { autoIngestRecentSessions } from './memory/auto-ingest.js';
