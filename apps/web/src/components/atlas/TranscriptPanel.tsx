'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import { ApprovalPopup } from '@/components/atlas/ApprovalPopup';
import { Button } from '@/components/ui/button';
import type { AtlasMessage, PendingToolCall, ToolCallResult } from '@/stores/atlas-store';

interface TranscriptPanelProps {
  messages: AtlasMessage[];
  pendingToolCalls: PendingToolCall[];
  toolCallResults: ToolCallResult[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSuggestionClick: (text: string) => void;
  onApproveToolCall: (id: string) => void;
  onRejectToolCall: (id: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  disabled: boolean;
  isAwaitingApproval: boolean;
}

function formatToolName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function TranscriptPanel({
  messages,
  pendingToolCalls,
  toolCallResults,
  input,
  onInputChange,
  onSend,
  onSuggestionClick,
  onApproveToolCall,
  onRejectToolCall,
  onApproveAll,
  onRejectAll,
  disabled,
  isAwaitingApproval,
}: TranscriptPanelProps) {
  const t = useTranslations('atlas');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages, tool calls, or results
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingToolCalls, toolCallResults]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault();
      onSend();
    }
  }

  function formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 60_000) return t('now');
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3')];

  // Build timeline
  type TimelineItem =
    | { kind: 'message'; data: AtlasMessage }
    | { kind: 'tool_call'; data: PendingToolCall }
    | { kind: 'tool_result'; data: ToolCallResult };

  const timeline: TimelineItem[] = [];
  for (const msg of messages) {
    timeline.push({ kind: 'message', data: msg });
  }
  for (const result of toolCallResults) {
    timeline.push({ kind: 'tool_result', data: result });
  }
  // Sort by timestamp
  timeline.sort((a, b) => {
    const aTime = 'timestamp' in a.data ? a.data.timestamp : 0;
    const bTime = 'timestamp' in b.data ? b.data.timestamp : 0;
    return aTime - bTime;
  });

  const hasPendingApprovals = pendingToolCalls.some((tc) => tc.status === 'pending');

  return (
    <div className="flex h-full w-[340px] min-w-[340px] flex-col border-l border-accent-cyan/10 bg-bg-deepest">
      {/* Header */}
      <div className="flex shrink-0 items-center border-b border-accent-cyan/10 px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-accent-cyan">
          {t('transcript')}
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {timeline.length === 0 && pendingToolCalls.length === 0 ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="font-mono text-[9px] text-text-disabled">{t('emptyState')}</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(text)}
                  disabled={disabled}
                  className="border border-accent-cyan/15 px-2 py-1 text-left font-mono text-[9px] text-accent-cyan/60 transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Timeline items */}
            {timeline.map((item) => {
              if (item.kind === 'tool_result') {
                const result = item.data;
                return (
                  <div
                    key={result.id}
                    className={`my-0.5 border-l-2 p-2 ${
                      result.isError
                        ? 'border-status-error/50 bg-status-error/5'
                        : 'border-accent-cyan/30 bg-accent-cyan/3'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] uppercase tracking-wider text-text-disabled">
                        {formatToolName(result.toolName)}
                      </span>
                      {result.autoExecuted && (
                        <span className="rounded-sm bg-accent-cyan/10 px-1 py-px text-[7px] uppercase tracking-wider text-accent-cyan/60">
                          {t('toolExecuted')}
                        </span>
                      )}
                      {result.isError && (
                        <span className="rounded-sm bg-status-error/10 px-1 py-px text-[7px] uppercase tracking-wider text-status-error/60">
                          {t('toolFailed')}
                        </span>
                      )}
                    </div>
                    <pre className="mt-1 max-h-[100px] overflow-auto font-mono text-[8px] leading-relaxed text-text-muted">
                      {result.output.length > 200
                        ? result.output.slice(0, 200) + '...'
                        : result.output}
                    </pre>
                  </div>
                );
              }

              const msg = item.data as AtlasMessage;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="font-mono text-[8px] uppercase tracking-wider text-text-disabled">
                    {msg.role === 'user' ? t('you') : t('atlasLabel')} &middot;{' '}
                    {formatTime(msg.timestamp)}
                  </span>
                  <div
                    className={`max-w-[280px] px-2 py-1.5 ${
                      msg.role === 'user'
                        ? 'bg-text-primary/4'
                        : 'border-l-2 border-accent-cyan bg-accent-cyan/4'
                    }`}
                  >
                    <p
                      className={`font-mono text-[10px] leading-relaxed ${
                        msg.role === 'user' ? 'text-text-secondary' : 'text-accent-cyan/85'
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Pending tool call approvals */}
            {pendingToolCalls.length > 0 && (
              <>
                {pendingToolCalls.map((tc) => (
                  <ApprovalPopup
                    key={tc.id}
                    toolCall={tc}
                    onApprove={onApproveToolCall}
                    onReject={onRejectToolCall}
                  />
                ))}

                {/* Approve All / Reject All buttons */}
                {hasPendingApprovals && (
                  <div className="flex items-center gap-1.5 border-t border-accent-cyan/10 pt-2">
                    <Button size="sm" variant="primary" onClick={onApproveAll}>
                      <CheckCircle size={10} strokeWidth={2} className="mr-0.5" />
                      {t('approveAll')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onRejectAll}>
                      <XCircle size={10} strokeWidth={2} className="mr-0.5" />
                      {t('rejectAll')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex shrink-0 items-center gap-2 border-t border-accent-cyan/10 px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          disabled={disabled}
          className="flex-1 border border-accent-cyan/15 bg-transparent px-2 py-1 font-mono text-[10px] text-text-secondary outline-none transition-colors focus:border-accent-cyan/40"
        />
        <button
          onClick={onSend}
          disabled={disabled || !input.trim()}
          className={`flex h-6 w-6 shrink-0 items-center justify-center border transition-colors ${
            input.trim() && !disabled
              ? 'border-accent-cyan text-accent-cyan'
              : 'border-accent-cyan/15 text-accent-cyan/30'
          }`}
        >
          <Send size={10} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
