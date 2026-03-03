import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { verifyToken } from '@clerk/backend';
import { db, users, projects, eq, and } from '@ai-office/db';
import { getAgentExecutionQueue, getRedisClient } from '@ai-office/queue';
import { randomUUID } from 'crypto';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@ai-office/realtime';

export type TypedSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

let io: TypedSocketServer | null = null;

function getAllowedOrigins(): string[] {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  if (process.env.WEB_URL) {
    origins.push(process.env.WEB_URL);
  }
  return origins;
}

/**
 * Create and configure the Socket.IO server.
 * Attaches to the existing HTTP server instance.
 */
export function createSocketServer(httpServer: HttpServer): TypedSocketServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Authentication middleware ──
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (!clerkSecretKey) {
        return next(new Error('Server misconfigured: missing CLERK_SECRET_KEY'));
      }

      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });

      const clerkUserId = payload.sub;
      if (!clerkUserId) {
        return next(new Error('Invalid token: missing subject'));
      }

      // Look up internal user to get orgId for authorization
      const [user] = await db
        .select({ id: users.id, orgId: users.orgId, role: users.role })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user.id;
      socket.data.orgId = user.orgId;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  // ── Connection handler ──
  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id} (user: ${socket.data.userId})`);

    // Subscribe to a project room — verify user belongs to project's org
    socket.on('subscribe:project', async ({ projectId }) => {
      try {
        const [project] = await db
          .select({ id: projects.id, orgId: projects.orgId })
          .from(projects)
          .where(
            and(
              eq(projects.id, projectId),
              eq(projects.orgId, socket.data.orgId),
            ),
          )
          .limit(1);

        if (!project) {
          socket.emit('agent:error', {
            agentId: '',
            sessionId: '',
            error: 'Project not found or unauthorized',
            timestamp: new Date().toISOString(),
          } as Parameters<ServerToClientEvents['agent:error']>[0]);
          return;
        }

        const room = `project:${projectId}`;
        void socket.join(room);
        console.log(`[socket] ${socket.id} joined room ${room}`);

        // Drain queued offline events
        drainPendingEvents(projectId, socket).catch(() => {});
      } catch (err) {
        console.error(`[socket] Error joining project room:`, err);
      }
    });

    // Trigger agent execution from client — requires admin+ role
    socket.on('trigger:agent', ({ agentId, payload }) => {
      const role = socket.data.role as string;
      const ROLE_HIERARCHY: Record<string, number> = {
        viewer: 0,
        manager: 1,
        admin: 2,
        owner: 3,
      };
      if ((ROLE_HIERARCHY[role] ?? 0) < ROLE_HIERARCHY['admin']!) {
        console.warn(`[socket] ${socket.id} unauthorized trigger:agent (role: ${role})`);
        return;
      }

      console.log(`[socket] ${socket.id} triggered agent ${agentId}`);

      const sessionId = randomUUID();
      const queue = getAgentExecutionQueue();
      void queue.add(`manual-${agentId}`, {
        agentId,
        projectId: [...socket.rooms].find((r) => r.startsWith('project:'))?.replace('project:', '') ?? '',
        sessionId,
        triggerType: 'manual' as const,
        triggerPayload: payload as Record<string, unknown> | undefined,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Emit an event to all clients in a project room.
 */
const PENDING_EVENTS_TTL = 7 * 24 * 60 * 60; // 7 days

export function emitToProject<E extends keyof ServerToClientEvents>(
  projectId: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  if (!io) {
    console.warn('[socket] Cannot emit: Socket.IO server not initialized');
    return;
  }

  const room = `project:${projectId}`;
  const roomSockets = io.sockets.adapter.rooms.get(room);

  if (!roomSockets || roomSockets.size === 0) {
    // No clients connected — queue event for later delivery
    try {
      const redis = getRedisClient();
      const eventData = JSON.stringify({ event, args, timestamp: Date.now() });
      const key = `pending_events:${projectId}`;
      redis.rpush(key, eventData).catch(() => {});
      redis.expire(key, PENDING_EVENTS_TTL).catch(() => {});
    } catch {
      // Non-blocking
    }
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (io.to(room) as any).emit(event, ...args);
}

/** Drain queued offline events for a project and emit them to the socket */
export async function drainPendingEvents(projectId: string, socket: any): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `pending_events:${projectId}`;
    const events = await redis.lrange(key, 0, -1);
    if (events.length > 0) {
      await redis.del(key);
      for (const raw of events) {
        try {
          const { event, args } = JSON.parse(raw);
          socket.emit(event, ...args);
        } catch {
          // Skip malformed events
        }
      }
      console.log(`[socket] Drained ${events.length} pending events for project ${projectId}`);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Get the Socket.IO server instance (may be null before init).
 */
export function getSocketServer(): TypedSocketServer | null {
  return io;
}
