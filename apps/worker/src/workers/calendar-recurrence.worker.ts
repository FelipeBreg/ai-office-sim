import { QUEUE_NAMES, calendarRecurrenceJobSchema } from '@ai-office/queue';
import type { CalendarRecurrenceJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { db, calendarEvents, eq, sql } from '@ai-office/db';

export function createCalendarRecurrenceWorker() {
  return createTypedWorker<CalendarRecurrenceJob>({
    queueName: QUEUE_NAMES.CALENDAR_RECURRENCE,
    concurrency: 1,
    schema: calendarRecurrenceJobSchema,
    processor: async (job) => {
      const horizonDays = job.data.horizonDays ?? 30;
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + horizonDays);

      // Find recurring events that need expansion
      const recurringEvents = await db
        .select()
        .from(calendarEvents)
        .where(sql`${calendarEvents.recurrence} IS NOT NULL AND ${calendarEvents.status} = 'scheduled'`);

      let created = 0;

      for (const event of recurringEvents) {
        const recurrence = event.recurrence as {
          freq: string;
          interval?: number;
          until?: string;
          count?: number;
        } | null;

        if (!recurrence) continue;

        const interval = recurrence.interval ?? 1;
        const lastStart = new Date(event.startAt);
        let nextStart = new Date(lastStart);

        // Calculate next occurrence
        switch (recurrence.freq) {
          case 'daily':
            nextStart.setDate(nextStart.getDate() + interval);
            break;
          case 'weekly':
            nextStart.setDate(nextStart.getDate() + 7 * interval);
            break;
          case 'monthly':
            nextStart.setMonth(nextStart.getMonth() + interval);
            break;
          case 'yearly':
            nextStart.setFullYear(nextStart.getFullYear() + interval);
            break;
        }

        // Check if next occurrence is within horizon and not past 'until'
        if (nextStart > horizon) continue;
        if (recurrence.until && nextStart > new Date(recurrence.until)) continue;

        // Check if this occurrence already exists (by sourceId + startAt)
        const [existing] = await db
          .select({ id: calendarEvents.id })
          .from(calendarEvents)
          .where(
            sql`${calendarEvents.sourceId} = ${event.id} AND ${calendarEvents.startAt} = ${nextStart}`,
          )
          .limit(1);

        if (existing) continue;

        // Create the next occurrence
        const duration = event.endAt
          ? new Date(event.endAt).getTime() - lastStart.getTime()
          : null;

        await db.insert(calendarEvents).values({
          projectId: event.projectId,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          sourceType: 'system',
          sourceId: event.id,
          startAt: nextStart,
          endAt: duration ? new Date(nextStart.getTime() + duration) : null,
          allDay: event.allDay,
          recurrence: event.recurrence,
          status: 'scheduled',
          priority: event.priority,
          assignedAgentId: event.assignedAgentId,
          assignedUserId: event.assignedUserId,
          metadata: event.metadata,
        });

        created++;
      }

      console.log(
        `[calendar-recurrence] Processed ${recurringEvents.length} recurring events, created ${created} occurrences`,
      );

      await job.updateProgress(100);
      return { status: 'completed', processed: recurringEvents.length, created };
    },
  });
}
