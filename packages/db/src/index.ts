export { db } from './client.js';
export type { Database } from './client.js';
export * from './schema/index.js';

// Re-export drizzle-orm operators to prevent duplicate package instances
// across pnpm workspaces. Consumers should import from @ai-office/db.
export { eq, and, or, not, sql, desc, asc, count, inArray } from 'drizzle-orm';
