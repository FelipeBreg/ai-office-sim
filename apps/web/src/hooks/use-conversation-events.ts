'use client';

import { useCallback } from 'react';
import { useSocketEvent } from './use-socket';
import { trpc } from '@/lib/trpc/client';
import type {
  ConversationNewMessageEvent,
  ConversationStatusChangedEvent,
  ConversationAssignedEvent,
} from '@ai-office/realtime';

/**
 * Subscribes to conversation:* Socket.IO events.
 * Invalidates messaging tRPC queries so the inbox stays current.
 */
export function useConversationEvents() {
  const utils = trpc.useUtils();

  useSocketEvent(
    'conversation:new_message',
    useCallback(
      (_data: ConversationNewMessageEvent) => {
        void utils.messaging.invalidate();
      },
      [utils],
    ),
  );

  useSocketEvent(
    'conversation:status_changed',
    useCallback(
      (_data: ConversationStatusChangedEvent) => {
        void utils.messaging.invalidate();
      },
      [utils],
    ),
  );

  useSocketEvent(
    'conversation:assigned',
    useCallback(
      (_data: ConversationAssignedEvent) => {
        void utils.messaging.invalidate();
      },
      [utils],
    ),
  );
}
