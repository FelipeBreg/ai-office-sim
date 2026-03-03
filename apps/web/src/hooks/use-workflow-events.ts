'use client';

import { useCallback } from 'react';
import { useSocketEvent } from './use-socket';
import { trpc } from '@/lib/trpc/client';
import type {
  WorkflowStartedEvent,
  WorkflowNodeCompleteEvent,
  WorkflowCompleteEvent,
} from '@ai-office/realtime';

/**
 * Subscribes to all workflow:* Socket.IO events.
 * Invalidates relevant tRPC queries so UI stays in sync.
 */
export function useWorkflowEvents() {
  const utils = trpc.useUtils();

  useSocketEvent(
    'workflow:started',
    useCallback(
      (_data: WorkflowStartedEvent) => {
        void utils.workflows.list.invalidate();
      },
      [utils],
    ),
  );

  useSocketEvent(
    'workflow:node_complete',
    useCallback(
      (_data: WorkflowNodeCompleteEvent) => {
        void utils.workflows.list.invalidate();
      },
      [utils],
    ),
  );

  useSocketEvent(
    'workflow:complete',
    useCallback(
      (_data: WorkflowCompleteEvent) => {
        void utils.workflows.list.invalidate();
      },
      [utils],
    ),
  );
}
