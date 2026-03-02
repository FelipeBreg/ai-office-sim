import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import {
  db,
  calendarEvents,
  calendarReminders,
  eq,
  and,
  gte,
  lte,
  desc,
} from '@ai-office/db';

export const calendarRouter = createTRPCRouter({
  // ── List events by date range ──
  listEvents: projectProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        eventType: z
          .enum(['deadline', 'agent_run', 'meeting', 'reminder', 'renewal', 'obligation', 'custom'])
          .optional(),
        status: z.enum(['scheduled', 'completed', 'cancelled', 'overdue']).optional(),
        assignedAgentId: z.string().uuid().optional(),
        assignedUserId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const conditions = [
        eq(calendarEvents.projectId, projectId),
        gte(calendarEvents.startAt, new Date(input.startDate)),
        lte(calendarEvents.startAt, new Date(input.endDate)),
      ];

      if (input.eventType) {
        conditions.push(eq(calendarEvents.eventType, input.eventType));
      }
      if (input.status) {
        conditions.push(eq(calendarEvents.status, input.status));
      }
      if (input.assignedAgentId) {
        conditions.push(eq(calendarEvents.assignedAgentId, input.assignedAgentId));
      }
      if (input.assignedUserId) {
        conditions.push(eq(calendarEvents.assignedUserId, input.assignedUserId));
      }

      return db
        .select()
        .from(calendarEvents)
        .where(and(...conditions))
        .orderBy(calendarEvents.startAt);
    }),

  // ── Get single event with reminders ──
  getEvent: projectProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.projectId, projectId),
          ),
        )
        .limit(1);

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      const reminders = await db
        .select()
        .from(calendarReminders)
        .where(eq(calendarReminders.eventId, input.eventId));

      return { event, reminders };
    }),

  // ── Create event ──
  createEvent: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        eventType: z.enum([
          'deadline', 'agent_run', 'meeting', 'reminder', 'renewal', 'obligation', 'custom',
        ]),
        startAt: z.string().datetime(),
        endAt: z.string().datetime().optional(),
        allDay: z.boolean().default(false),
        recurrence: z
          .object({
            freq: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
            interval: z.number().int().positive().optional(),
            until: z.string().datetime().optional(),
            count: z.number().int().positive().optional(),
            byDay: z.array(z.string()).optional(),
          })
          .optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        assignedAgentId: z.string().uuid().optional(),
        assignedUserId: z.string().uuid().optional(),
        metadata: z.record(z.unknown()).optional(),
        remindBefore: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [event] = await db
        .insert(calendarEvents)
        .values({
          projectId,
          title: input.title,
          description: input.description,
          eventType: input.eventType,
          sourceType: 'manual',
          startAt: new Date(input.startAt),
          endAt: input.endAt ? new Date(input.endAt) : null,
          allDay: input.allDay,
          recurrence: input.recurrence,
          priority: input.priority,
          assignedAgentId: input.assignedAgentId,
          assignedUserId: input.assignedUserId,
          metadata: input.metadata,
        })
        .returning();

      // Create reminder if requested
      if (input.remindBefore && event) {
        const remindAt = new Date(
          new Date(input.startAt).getTime() - input.remindBefore * 60_000,
        );
        await db.insert(calendarReminders).values({
          eventId: event.id,
          remindAt,
          channel: 'in_app',
        });
      }

      return event!;
    }),

  // ── Update event ──
  updateEvent: adminProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).optional(),
        startAt: z.string().datetime().optional(),
        endAt: z.string().datetime().nullable().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assignedAgentId: z.string().uuid().nullable().optional(),
        assignedUserId: z.string().uuid().nullable().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;
      const { eventId, ...updates } = input;

      const setValues: Record<string, unknown> = {};
      if (updates.title !== undefined) setValues.title = updates.title;
      if (updates.description !== undefined) setValues.description = updates.description;
      if (updates.startAt !== undefined) setValues.startAt = new Date(updates.startAt);
      if (updates.endAt !== undefined) setValues.endAt = updates.endAt ? new Date(updates.endAt) : null;
      if (updates.priority !== undefined) setValues.priority = updates.priority;
      if (updates.assignedAgentId !== undefined) setValues.assignedAgentId = updates.assignedAgentId;
      if (updates.assignedUserId !== undefined) setValues.assignedUserId = updates.assignedUserId;
      if (updates.metadata !== undefined) setValues.metadata = updates.metadata;

      const [updated] = await db
        .update(calendarEvents)
        .set(setValues)
        .where(
          and(
            eq(calendarEvents.id, eventId),
            eq(calendarEvents.projectId, projectId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      return updated;
    }),

  // ── Delete (cancel) event ──
  deleteEvent: adminProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [cancelled] = await db
        .update(calendarEvents)
        .set({ status: 'cancelled', cancelledAt: new Date() })
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.projectId, projectId),
          ),
        )
        .returning();

      if (!cancelled) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      return cancelled;
    }),

  // ── Complete event ──
  completeEvent: adminProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [completed] = await db
        .update(calendarEvents)
        .set({ status: 'completed', completedAt: new Date() })
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.projectId, projectId),
          ),
        )
        .returning();

      if (!completed) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      return completed;
    }),

  // ── List overdue events ──
  listOverdue: projectProcedure.query(async ({ ctx }) => {
    const projectId = ctx.project!.id;

    return db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.projectId, projectId),
          eq(calendarEvents.status, 'overdue'),
        ),
      )
      .orderBy(calendarEvents.startAt);
  }),

  // ── Create reminder for an event ──
  createReminder: adminProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        remindAt: z.string().datetime(),
        channel: z.enum(['in_app', 'email', 'whatsapp']).default('in_app'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      // Verify event belongs to project
      const [event] = await db
        .select({ id: calendarEvents.id })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.projectId, projectId),
          ),
        )
        .limit(1);

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      const [reminder] = await db
        .insert(calendarReminders)
        .values({
          eventId: input.eventId,
          remindAt: new Date(input.remindAt),
          channel: input.channel,
        })
        .returning();

      return reminder!;
    }),
});
