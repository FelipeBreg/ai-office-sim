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

// Memory
export { loadMemory, saveMemory, searchMemory } from './memory/individual.js';
