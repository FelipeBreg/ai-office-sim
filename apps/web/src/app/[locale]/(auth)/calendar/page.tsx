'use client';

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Types ──

type EventType = 'deadline' | 'agent_run' | 'meeting' | 'reminder' | 'renewal' | 'obligation' | 'custom';
type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'overdue';
type ViewMode = 'month' | 'agenda';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  deadline: 'border-status-error',
  agent_run: 'border-accent-cyan',
  meeting: 'border-blue-500',
  reminder: 'border-status-warning',
  renewal: 'border-yellow-500',
  obligation: 'border-yellow-500',
  custom: 'border-border-default',
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  deadline: 'DEADLINE',
  agent_run: 'AGENT RUN',
  meeting: 'MEETING',
  reminder: 'REMINDER',
  renewal: 'RENEWAL',
  obligation: 'OBLIGATION',
  custom: 'CUSTOM',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-text-muted/20 text-text-muted',
  medium: 'bg-accent-cyan/20 text-accent-cyan',
  high: 'bg-status-warning/20 text-status-warning',
  urgent: 'bg-status-error/20 text-status-error',
};

const STATUS_COLORS: Record<EventStatus, string> = {
  scheduled: 'bg-accent-cyan/20 text-accent-cyan',
  completed: 'bg-status-success/20 text-status-success',
  cancelled: 'bg-text-muted/20 text-text-muted',
  overdue: 'bg-status-error/20 text-status-error',
};

// ── Helpers ──

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Event Card (for agenda view) ──

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    eventType: EventType;
    status: EventStatus;
    priority: Priority;
    startAt: Date;
    endAt: Date | null;
    allDay: boolean;
  };
  onSelect: (id: string) => void;
  onComplete: (id: string) => void;
}

function EventCard({ event, onSelect, onComplete }: EventCardProps) {
  const borderColor = EVENT_TYPE_COLORS[event.eventType];

  return (
    <div
      className={`border border-border-default border-l-2 ${borderColor} bg-bg-base p-3 cursor-pointer transition-colors hover:bg-bg-overlay`}
      onClick={() => onSelect(event.id)}
    >
      <div className="flex items-center gap-2">
        <span className="text-[8px] uppercase tracking-wider text-text-muted">
          {event.allDay ? 'All day' : formatTime(event.startAt)}
          {event.endAt && !event.allDay && ` – ${formatTime(event.endAt)}`}
        </span>
        <span className="text-xs font-medium text-text-primary">{event.title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`px-1 py-0.5 text-[8px] uppercase ${STATUS_COLORS[event.status]}`}>
            {event.status}
          </span>
          <span className={`px-1 py-0.5 text-[8px] uppercase ${PRIORITY_COLORS[event.priority]}`}>
            {event.priority}
          </span>
          <Badge variant="default" className="text-[8px]">
            {EVENT_TYPE_LABELS[event.eventType]}
          </Badge>
        </div>
      </div>
      {event.description && (
        <p className="mt-1 truncate text-[10px] text-text-muted">{event.description}</p>
      )}
      {event.status === 'scheduled' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(event.id);
          }}
          className="mt-1.5 flex items-center gap-1 border border-border-default px-1.5 py-0.5 text-[8px] uppercase text-text-muted hover:border-status-success hover:text-status-success"
        >
          <Check size={8} />
          Complete
        </button>
      )}
    </div>
  );
}

// ── Create Event Form ──

interface CreateEventFormProps {
  onSubmit: (data: {
    title: string;
    eventType: EventType;
    startAt: string;
    priority: Priority;
    description?: string;
  }) => void;
  onClose: () => void;
}

function CreateEventForm({ onSubmit, onClose }: CreateEventFormProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('custom');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title || !startDate) return;
    const startAt = new Date(`${startDate}T${startTime}`).toISOString();
    onSubmit({ title, eventType, startAt, priority, description: description || undefined });
  };

  const inputClass = 'w-full border border-border-default bg-bg-base px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent-cyan';

  return (
    <div className="border border-border-default bg-bg-base p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-primary">Create Event</h3>
        <button type="button" onClick={onClose}>
          <X size={14} className="text-text-muted hover:text-text-primary" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <input type="text" placeholder="Event title..." value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />

        <div className="flex gap-2">
          <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className={inputClass}>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
        </div>

        <textarea placeholder="Description (optional)..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title || !startDate}
          className="flex items-center justify-center gap-1.5 border border-accent-cyan bg-accent-cyan/10 px-3 py-1.5 text-xs uppercase text-accent-cyan transition-colors hover:bg-accent-cyan/20 disabled:opacity-40"
        >
          <Plus size={12} />
          Create
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Date range for query
  const startDate = useMemo(() => new Date(year, month, 1).toISOString(), [year, month]);
  const endDate = useMemo(() => new Date(year, month + 1, 0, 23, 59, 59).toISOString(), [year, month]);

  const eventsQuery = trpc.calendar.listEvents.useQuery({
    startDate,
    endDate,
  });

  const overdueQuery = trpc.calendar.listOverdue.useQuery();

  const eventDetail = trpc.calendar.getEvent.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId },
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      setShowCreateForm(false);
      void utils.calendar.listEvents.invalidate();
    },
  });

  const completeMutation = trpc.calendar.completeEvent.useMutation({
    onSuccess: () => {
      void utils.calendar.listEvents.invalidate();
      void utils.calendar.listOverdue.invalidate();
    },
  });

  const events = eventsQuery.data ?? [];
  const days = getMonthDays(year, month);
  const today = new Date();

  const navigate = useCallback(
    (dir: -1 | 1) => {
      setCurrentDate(new Date(year, month + dir, 1));
    },
    [year, month],
  );

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  // Group events by date for agenda view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, typeof events> = {};
    for (const e of events) {
      const key = new Date(e.startAt).toISOString().slice(0, 10);
      (grouped[key] ??= []).push(e);
    }
    return grouped;
  }, [events]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-default px-4 py-2.5">
        <CalendarIcon size={14} className="text-accent-cyan" />
        <h1 className="text-xs font-medium uppercase tracking-wider text-text-primary">
          Calendar
        </h1>

        <div className="ml-4 flex items-center gap-1.5">
          <button type="button" onClick={() => navigate(-1)} className="border border-border-default p-1 text-text-muted hover:text-text-primary">
            <ChevronLeft size={12} />
          </button>
          <span className="min-w-[140px] text-center text-xs text-text-primary">
            {MONTHS[month]} {year}
          </span>
          <button type="button" onClick={() => navigate(1)} className="border border-border-default p-1 text-text-muted hover:text-text-primary">
            <ChevronRight size={12} />
          </button>
          <button type="button" onClick={goToday} className="border border-border-default px-2 py-1 text-[8px] uppercase text-text-muted hover:text-accent-cyan">
            Today
          </button>
        </div>

        {/* View tabs */}
        <div className="ml-4 flex gap-1">
          {(['month', 'agenda'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1 text-[8px] uppercase tracking-wider transition-colors ${
                viewMode === mode
                  ? 'border border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : 'border border-border-default text-text-muted hover:text-text-secondary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Overdue badge */}
        {(overdueQuery.data?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-status-error">
            <AlertTriangle size={12} />
            <span className="text-[10px]">{overdueQuery.data!.length} overdue</span>
          </div>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 border border-accent-cyan px-2.5 py-1.5 text-[10px] uppercase text-accent-cyan transition-colors hover:bg-accent-cyan/10"
          >
            <Plus size={12} />
            Create Event
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Create form */}
          {showCreateForm && (
            <div className="mb-4">
              <CreateEventForm
                onSubmit={(data) => createMutation.mutate(data)}
                onClose={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {/* Month view */}
          {viewMode === 'month' && (
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border-default">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="px-1 py-1.5 text-center text-[8px] uppercase tracking-wider text-text-muted">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const isToday = day && isSameDay(day, today);
                  const dayEvents = day
                    ? events.filter((e) => isSameDay(new Date(e.startAt), day))
                    : [];

                  return (
                    <div
                      key={i}
                      className={`min-h-[80px] border-b border-r border-border-subtle p-1 ${
                        day ? 'bg-bg-base' : 'bg-bg-overlay/30'
                      }`}
                    >
                      {day && (
                        <>
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center text-[10px] ${
                              isToday
                                ? 'bg-accent-cyan text-bg-base font-medium'
                                : 'text-text-secondary'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                          <div className="mt-0.5 flex flex-col gap-0.5">
                            {dayEvents.slice(0, 3).map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => setSelectedEventId(e.id)}
                                className={`w-full truncate border-l-2 ${EVENT_TYPE_COLORS[e.eventType as EventType]} px-1 py-0.5 text-left text-[8px] text-text-primary hover:bg-bg-overlay`}
                              >
                                {e.title}
                              </button>
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="px-1 text-[8px] text-text-muted">
                                +{dayEvents.length - 3} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agenda view */}
          {viewMode === 'agenda' && (
            <div className="flex flex-col gap-3">
              {eventsQuery.isLoading && (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse border border-border-subtle bg-bg-overlay" />
                  ))}
                </div>
              )}

              {Object.entries(eventsByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, dayEvents]) => (
                  <div key={dateKey}>
                    <div className="mb-1.5 flex items-center gap-2 border-b border-border-subtle pb-1">
                      <Clock size={10} className="text-text-muted" />
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">
                        {formatDate(new Date(dateKey))}
                      </span>
                      <Badge variant="default" className="text-[8px]">
                        {dayEvents.length}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {dayEvents.map((e) => (
                        <EventCard
                          key={e.id}
                          event={e as EventCardProps['event']}
                          onSelect={setSelectedEventId}
                          onComplete={(id) => completeMutation.mutate({ eventId: id })}
                        />
                      ))}
                    </div>
                  </div>
                ))}

              {!eventsQuery.isLoading && events.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon size={24} className="mb-2 text-text-muted" />
                  <p className="text-xs text-text-muted">No events this month</p>
                  <p className="mt-1 text-[10px] text-text-muted">
                    Create events or let agents schedule them
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event detail panel */}
        {selectedEventId && eventDetail.data && (
          <div className="w-80 shrink-0 border-l border-border-default overflow-y-auto">
            <div className="border-b border-border-default px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-text-primary">
                  Event Detail
                </span>
                <button type="button" onClick={() => setSelectedEventId(null)}>
                  <X size={14} className="text-text-muted hover:text-text-primary" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-sm font-medium text-text-primary">
                {eventDetail.data.event.title}
              </h2>

              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-wider text-text-muted w-16">Type</span>
                  <Badge variant="default" className="text-[8px]">
                    {EVENT_TYPE_LABELS[eventDetail.data.event.eventType as EventType]}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-wider text-text-muted w-16">Status</span>
                  <span className={`px-1.5 py-0.5 text-[8px] uppercase ${STATUS_COLORS[eventDetail.data.event.status as EventStatus]}`}>
                    {eventDetail.data.event.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-wider text-text-muted w-16">Priority</span>
                  <span className={`px-1.5 py-0.5 text-[8px] uppercase ${PRIORITY_COLORS[eventDetail.data.event.priority as Priority]}`}>
                    {eventDetail.data.event.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-wider text-text-muted w-16">Start</span>
                  <span className="text-xs text-text-primary">
                    {formatDate(eventDetail.data.event.startAt)} {formatTime(eventDetail.data.event.startAt)}
                  </span>
                </div>

                {eventDetail.data.event.endAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] uppercase tracking-wider text-text-muted w-16">End</span>
                    <span className="text-xs text-text-primary">
                      {formatDate(eventDetail.data.event.endAt)} {formatTime(eventDetail.data.event.endAt)}
                    </span>
                  </div>
                )}

                {eventDetail.data.event.description && (
                  <div className="mt-2 border-t border-border-subtle pt-2">
                    <span className="text-[8px] uppercase tracking-wider text-text-muted">Description</span>
                    <p className="mt-1 text-xs text-text-primary">
                      {eventDetail.data.event.description}
                    </p>
                  </div>
                )}

                {eventDetail.data.reminders.length > 0 && (
                  <div className="mt-2 border-t border-border-subtle pt-2">
                    <span className="text-[8px] uppercase tracking-wider text-text-muted">Reminders</span>
                    {eventDetail.data.reminders.map((r) => (
                      <div key={r.id} className="mt-1 flex items-center gap-1.5 text-[10px] text-text-secondary">
                        <Clock size={8} />
                        {formatDate(r.remindAt)} {formatTime(r.remindAt)}
                        {r.sent && <Check size={8} className="text-status-success" />}
                      </div>
                    ))}
                  </div>
                )}

                {eventDetail.data.event.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => completeMutation.mutate({ eventId: selectedEventId })}
                    className="mt-3 flex items-center justify-center gap-1.5 border border-status-success bg-status-success/10 px-3 py-1.5 text-[10px] uppercase text-status-success transition-colors hover:bg-status-success/20"
                  >
                    <Check size={12} />
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
