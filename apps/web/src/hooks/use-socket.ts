'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@ai-office/realtime';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;
let activeProjectId: string | null = null;
let connectionCount = 0;

/**
 * Manages the Socket.IO connection lifecycle.
 * Connects on mount with Clerk auth token, joins project room, disconnects on unmount.
 */
export function useSocket(projectId: string | null) {
  const { getToken } = useAuth();
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    connectionCount++;

    async function connect() {
      const token = await getToken();
      if (cancelled || !token) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

      // Reuse existing connection if already connected
      if (globalSocket?.connected) {
        socketRef.current = globalSocket;
        // Only re-subscribe if project changed
        if (activeProjectId !== projectId) {
          globalSocket.emit('subscribe:project', { projectId: projectId! });
          activeProjectId = projectId;
        }
        return;
      }

      const socket: TypedSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        socket.emit('subscribe:project', { projectId: projectId! });
        activeProjectId = projectId;
      });

      globalSocket = socket;
      socketRef.current = socket;
    }

    void connect();

    return () => {
      cancelled = true;
      connectionCount--;
      // Disconnect when no components are using the socket
      if (connectionCount <= 0) {
        connectionCount = 0;
        globalSocket?.disconnect();
        globalSocket = null;
        activeProjectId = null;
        socketRef.current = null;
      }
    };
  }, [projectId, getToken]);

  return socketRef;
}

/**
 * Subscribe to a specific Socket.IO event.
 * Handles the race condition where the socket may not be connected yet
 * by re-subscribing when the socket connects.
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // Use any cast to work around socket.io-client's complex generic types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrappedHandler = (...args: any[]) => {
      (handlerRef.current as (...a: unknown[]) => void)(...args);
    };

    function subscribe(socket: TypedSocket) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on(event as any, wrappedHandler);
    }

    function unsubscribe(socket: TypedSocket) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event as any, wrappedHandler);
    }

    // Subscribe immediately if socket exists
    const socket = globalSocket;
    if (socket) {
      subscribe(socket);

      // Also re-subscribe on reconnect to handle missed events
      const onConnect = () => subscribe(socket);
      socket.on('connect', onConnect);

      return () => {
        unsubscribe(socket);
        socket.off('connect', onConnect);
      };
    }

    // If socket not yet created, poll briefly for it
    const interval = setInterval(() => {
      const s = globalSocket;
      if (s) {
        clearInterval(interval);
        subscribe(s);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      const s = globalSocket;
      if (s) {
        unsubscribe(s);
      }
    };
  }, [event]);
}
