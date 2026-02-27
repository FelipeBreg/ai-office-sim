'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { ApprovalPopup } from '@/components/atlas/ApprovalPopup';
import type { AtlasMessage, AtlasAction } from '@/stores/atlas-store';

interface TranscriptPanelProps {
  messages: AtlasMessage[];
  pendingActions: AtlasAction[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSuggestionClick: (text: string) => void;
  onApproveAction: (id: string) => void;
  onRejectAction: (id: string) => void;
  disabled: boolean;
}

export function TranscriptPanel({
  messages,
  pendingActions,
  input,
  onInputChange,
  onSend,
  onSuggestionClick,
  onApproveAction,
  onRejectAction,
  disabled,
}: TranscriptPanelProps) {
  const t = useTranslations('atlas');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or actions
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingActions]);

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

  // Build an interleaved timeline of messages and actions
  type TimelineItem =
    | { kind: 'message'; data: AtlasMessage }
    | { kind: 'action'; data: AtlasAction };

  const timeline: TimelineItem[] = [];
  for (const msg of messages) {
    timeline.push({ kind: 'message', data: msg });
  }
  for (const action of pendingActions) {
    timeline.push({ kind: 'action', data: action });
  }
  timeline.sort((a, b) => {
    const aTime = a.data.timestamp;
    const bTime = b.data.timestamp;
    return aTime - bTime;
  });

  return (
    <div
      className="flex h-full w-[340px] min-w-[340px] flex-col border-l border-accent-cyan/10 bg-bg-deepest"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center border-b border-accent-cyan/10 px-3 py-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-accent-cyan">
          {t('transcript')}
        </span>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'thin' }}>
        {timeline.length === 0 ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="font-mono text-[9px] text-text-disabled">
              {t('emptyState')}
            </p>
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
          /* Timeline */
          <div className="flex flex-col gap-2">
            {timeline.map((item) => {
              if (item.kind === 'action') {
                return (
                  <ApprovalPopup
                    key={item.data.id}
                    action={item.data}
                    onApprove={onApproveAction}
                    onReject={onRejectAction}
                  />
                );
              }

              const msg = item.data;
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
                        msg.role === 'user'
                          ? 'text-text-secondary'
                          : 'text-accent-cyan/85'
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
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
