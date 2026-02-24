'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@ai-office/api';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> =
  createTRPCReact<AppRouter>();
