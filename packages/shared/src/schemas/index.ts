import { z } from 'zod';

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// UUID schema
export const uuidSchema = z.string().uuid();

// Project context schema (used in tRPC context)
export const projectContextSchema = z.object({
  projectId: uuidSchema,
  orgId: uuidSchema,
});
