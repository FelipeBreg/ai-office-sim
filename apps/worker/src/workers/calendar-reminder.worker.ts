import { QUEUE_NAMES, calendarReminderJobSchema } from '@ai-office/queue';
import type { CalendarReminderJob } from '@ai-office/queue';
import { createTypedWorker } from './create-worker.js';
import { db, calendarReminders, calendarEvents, eq, and, lte, sql } from '@ai-office/db';
import { emitToProject } from '../socket/server.js';

export function createCalendarReminderWorker() {
  return createTypedWorker<CalendarReminderJob>({
    queueName: QUEUE_NAMES.CALENDAR_REMINDER,
    concurrency: 1,
    schema: calendarReminderJobSchema,
    processor: async (job) => {
      const { type } = job.data;
      const now = new Date();

      if (type === 'send_reminders') {
        // Find unsent reminders that are due
        const dueReminders = await db
          .select({
            reminderId: calendarReminders.id,
            eventId: calendarReminders.eventId,
            channel: calendarReminders.channel,
            eventTitle: calendarEvents.title,
            eventType: calendarEvents.eventType,
            projectId: calendarEvents.projectId,
            startAt: calendarEvents.startAt,
          })
          .from(calendarReminders)
          .innerJoin(calendarEvents, eq(calendarReminders.eventId, calendarEvents.id))
          .where(
            and(
              lte(calendarReminders.remindAt, now),
              eq(calendarReminders.sent, false),
            ),
          )
          .limit(100);

        for (const reminder of dueReminders) {
          // Emit in-app notification via Socket.IO
          if (reminder.channel === 'in_app') {
            emitToProject(reminder.projectId, 'notification:calendar_reminder', {
              eventId: reminder.eventId,
              eventTitle: reminder.eventTitle,
              eventType: reminder.eventType,
              startAt: reminder.startAt?.toISOString() ?? null,
              reminderId: reminder.reminderId,
              timestamp: now.toISOString(),
            });
          }

          // Mark as sent
          await db
            .update(calendarReminders)
            .set({ sent: true, sentAt: now })
            .where(eq(calendarReminders.id, reminder.reminderId));
        }

        console.log(`[calendar-reminder] Processed ${dueReminders.length} reminders`);
      }

      if (type === 'mark_overdue') {
        // Mark past-due scheduled events as overdue
        const result = await db
          .update(calendarEvents)
          .set({ status: 'overdue' })
          .where(
            and(
              lte(calendarEvents.startAt, now),
              eq(calendarEvents.status, 'scheduled'),
            ),
          )
          .returning({ id: calendarEvents.id });

        console.log(`[calendar-reminder] Marked ${result.length} events as overdue`);
      }

      await job.updateProgress(100);
      return { status: 'completed', type };
    },
  });
}
