import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, calendarEvents, calendarReminders } from '@ai-office/db';

export const scheduleEventTool: ToolDefinition = {
  name: 'schedule_event',
  description:
    'Create a calendar event (deadline, meeting, reminder, renewal, obligation, or custom). ' +
    'Use this to schedule follow-ups, set deadlines, create renewal reminders, or track obligations. ' +
    'Optionally set a reminder that fires before the event.',
  inputSchema: z.object({
    title: z.string().describe('Short, descriptive title for the event'),
    description: z.string().optional().describe('Detailed description or context'),
    eventType: z
      .enum(['deadline', 'agent_run', 'meeting', 'reminder', 'renewal', 'obligation', 'custom'])
      .describe('Type of calendar event'),
    startAt: z.string().describe('Start date/time in ISO 8601 format'),
    endAt: z.string().optional().describe('End date/time in ISO 8601 format (optional)'),
    allDay: z.boolean().optional().describe('Whether this is an all-day event (default: false)'),
    recurrence: z
      .object({
        freq: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
        interval: z.number().optional(),
        until: z.string().optional(),
      })
      .optional()
      .describe('Recurrence pattern (optional)'),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'])
      .optional()
      .describe('Priority level (default: medium)'),
    remindBefore: z
      .number()
      .optional()
      .describe('Minutes before the event to send a reminder (e.g., 30 for 30 minutes)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      title,
      description,
      eventType,
      startAt,
      endAt,
      allDay = false,
      recurrence,
      priority = 'medium',
      remindBefore,
    } = input as {
      title: string;
      description?: string;
      eventType: 'deadline' | 'agent_run' | 'meeting' | 'reminder' | 'renewal' | 'obligation' | 'custom';
      startAt: string;
      endAt?: string;
      allDay?: boolean;
      recurrence?: { freq: string; interval?: number; until?: string };
      priority?: string;
      remindBefore?: number;
    };

    const [event] = await db
      .insert(calendarEvents)
      .values({
        projectId: context.projectId,
        title: title.slice(0, 500),
        description: description?.slice(0, 5000),
        eventType,
        sourceType: 'agent',
        sourceId: context.agentId,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        allDay,
        recurrence: recurrence as typeof calendarEvents.$inferInsert['recurrence'],
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        assignedAgentId: context.agentId,
      })
      .returning({ id: calendarEvents.id });

    // Create reminder if requested
    if (remindBefore && event) {
      const remindAt = new Date(new Date(startAt).getTime() - remindBefore * 60_000);
      await db.insert(calendarReminders).values({
        eventId: event.id,
        remindAt,
        channel: 'in_app',
      });
    }

    return {
      success: true,
      eventId: event!.id,
      message: `Calendar event "${title}" scheduled for ${startAt}.`,
    };
  },
};
