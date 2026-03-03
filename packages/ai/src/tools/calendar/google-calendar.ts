/**
 * Google Calendar API v3 tool — sync events between platform calendar and Google Calendar.
 */
import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const FETCH_TIMEOUT_MS = 15_000;

interface CalendarApiEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
}

async function calendarRequest<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${CALENDAR_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export const syncGoogleCalendarTool: ToolDefinition = {
  name: 'sync_google_calendar',
  description:
    'Interact with Google Calendar — list upcoming events, create events, or delete events. ' +
    'Requires Google Calendar OAuth2 connection in Settings > Tools.',
  inputSchema: z.object({
    action: z
      .enum(['list', 'create', 'delete'])
      .describe('Action to perform: list upcoming events, create a new event, or delete an event'),
    calendarId: z
      .string()
      .optional()
      .describe('Google Calendar ID (default: "primary")'),
    maxResults: z
      .number()
      .optional()
      .describe('Maximum number of events to return for list action (default: 10)'),
    timeMin: z
      .string()
      .optional()
      .describe('Start of time range for list action (ISO 8601, default: now)'),
    timeMax: z
      .string()
      .optional()
      .describe('End of time range for list action (ISO 8601)'),
    summary: z.string().optional().describe('Event title (for create action)'),
    description: z.string().optional().describe('Event description (for create action)'),
    startDateTime: z.string().optional().describe('Event start (ISO 8601, for create action)'),
    endDateTime: z.string().optional().describe('Event end (ISO 8601, for create action)'),
    eventId: z.string().optional().describe('Event ID (for delete action)'),
  }),
  requiresApproval: false,
  isMutation: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      action,
      calendarId = 'primary',
      maxResults = 10,
      timeMin,
      timeMax,
      summary,
      description,
      startDateTime,
      endDateTime,
      eventId,
    } = input as {
      action: 'list' | 'create' | 'delete';
      calendarId?: string;
      maxResults?: number;
      timeMin?: string;
      timeMax?: string;
      summary?: string;
      description?: string;
      startDateTime?: string;
      endDateTime?: string;
      eventId?: string;
    };

    const token = await getValidAccessToken(context.projectId, 'google_calendar');
    if (!token) {
      return { error: 'Google Calendar not connected. Set it up in Settings > Tools.' };
    }

    try {
      if (action === 'list') {
        const params = new URLSearchParams({
          maxResults: String(maxResults),
          singleEvents: 'true',
          orderBy: 'startTime',
          timeMin: timeMin ?? new Date().toISOString(),
        });
        if (timeMax) params.set('timeMax', timeMax);

        const data = await calendarRequest<{ items?: CalendarApiEvent[] }>(
          token,
          'GET',
          `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
        );

        return {
          eventCount: data.items?.length ?? 0,
          events: (data.items ?? []).map((e) => ({
            id: e.id,
            title: e.summary ?? '(no title)',
            description: e.description?.slice(0, 500),
            start: e.start?.dateTime ?? e.start?.date ?? '',
            end: e.end?.dateTime ?? e.end?.date ?? '',
            status: e.status,
            link: e.htmlLink,
          })),
        };
      }

      if (action === 'create') {
        if (!summary || !startDateTime || !endDateTime) {
          return { error: 'create action requires summary, startDateTime, and endDateTime' };
        }

        const event = await calendarRequest<CalendarApiEvent>(
          token,
          'POST',
          `/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            summary,
            description,
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime },
          },
        );

        return {
          success: true,
          eventId: event.id,
          link: event.htmlLink,
          message: `Event "${summary}" created.`,
        };
      }

      if (action === 'delete') {
        if (!eventId) {
          return { error: 'delete action requires eventId' };
        }

        await fetch(
          `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          },
        );

        return { success: true, message: `Event ${eventId} deleted.` };
      }

      return { error: `Unknown action: ${action}` };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Google Calendar operation failed' };
    }
  },
};
