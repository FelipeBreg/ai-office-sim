'use client';

import { useCallback } from 'react';
import { useSocketEvent } from './use-socket';
import { useRealtimeStore } from '@/stores/realtime-store';
import { trpc } from '@/lib/trpc/client';
import type {
  ApprovalRequestedEvent,
  ApprovalResolvedEvent,
} from '@ai-office/realtime';

/**
 * Subscribes to approval:* Socket.IO events.
 * Updates the pending approval count and invalidates tRPC queries.
 */
export function useApprovalEvents() {
  const incrementPendingApprovals = useRealtimeStore((s) => s.incrementPendingApprovals);
  const decrementPendingApprovals = useRealtimeStore((s) => s.decrementPendingApprovals);
  const utils = trpc.useUtils();

  useSocketEvent(
    'approval:requested',
    useCallback(
      (_data: ApprovalRequestedEvent) => {
        incrementPendingApprovals();
        void utils.approvals.listPending.invalidate();
      },
      [incrementPendingApprovals, utils],
    ),
  );

  useSocketEvent(
    'approval:resolved',
    useCallback(
      (_data: ApprovalResolvedEvent) => {
        decrementPendingApprovals();
        void utils.approvals.listPending.invalidate();
        void utils.approvals.listAll.invalidate();
      },
      [decrementPendingApprovals, utils],
    ),
  );
}
