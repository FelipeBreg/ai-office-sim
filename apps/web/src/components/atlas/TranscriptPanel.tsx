'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import type { AtlasMessage } from '@/stores/atlas-store';

interface TranscriptPanelProps {
  messages: AtlasMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSuggestionClick: (text: string) => void;
  disabled: boolean;
}

export function TranscriptPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onSuggestionClick,
  disabled,
}: TranscriptPanelProps) {
  const t = useTranslations('atlas');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <div
      className="flex h-full flex-col border-l"
      style={{
        borderColor: 'rgba(0, 200, 224, 0.1)',
        backgroundColor: '#0A0E14',
        width: 340,
        minWidth: 340,
      }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center border-b px-3 py-2"
        style={{ borderColor: 'rgba(0, 200, 224, 0.1)' }}
      >
        <span
          className="font-mono text-[10px] font-medium uppercase tracking-wider"
          style={{ color: '#00C8E0' }}
        >
          {t('transcript')}
        </span>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p
              className="font-mono text-[9px]"
              style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            >
              {t('emptyState')}
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(text)}
                  disabled={disabled}
                  className="border px-2 py-1 text-left font-mono text-[9px] transition-colors"
                  style={{
                    borderColor: 'rgba(0, 200, 224, 0.15)',
                    color: 'rgba(0, 200, 224, 0.6)',
                    borderRadius: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 200, 224, 0.4)';
                    e.currentTarget.style.color = '#00C8E0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 200, 224, 0.15)';
                    e.currentTarget.style.color = 'rgba(0, 200, 224, 0.6)';
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span
                  className="font-mono text-[8px] uppercase tracking-wider"
                  style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  {msg.role === 'user' ? t('you') : t('atlasLabel')} &middot;{' '}
                  {formatTime(msg.timestamp)}
                </span>
                <div
                  className="max-w-[280px] px-2 py-1.5"
                  style={{
                    borderRadius: 0,
                    backgroundColor:
                      msg.role === 'user' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 200, 224, 0.04)',
                    borderLeft: msg.role === 'atlas' ? '2px solid #00C8E0' : 'none',
                  }}
                >
                  <p
                    className="font-mono text-[10px] leading-relaxed"
                    style={{
                      color:
                        msg.role === 'user'
                          ? 'rgba(255, 255, 255, 0.7)'
                          : 'rgba(0, 200, 224, 0.85)',
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="flex shrink-0 items-center gap-2 border-t px-3 py-2"
        style={{ borderColor: 'rgba(0, 200, 224, 0.1)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          disabled={disabled}
          className="flex-1 border bg-transparent px-2 py-1 font-mono text-[10px] outline-none transition-colors"
          style={{
            borderColor: 'rgba(0, 200, 224, 0.15)',
            color: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 0,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 200, 224, 0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 200, 224, 0.15)';
          }}
        />
        <button
          onClick={onSend}
          disabled={disabled || !input.trim()}
          className="flex h-6 w-6 shrink-0 items-center justify-center border transition-colors"
          style={{
            borderColor: input.trim() && !disabled ? '#00C8E0' : 'rgba(0, 200, 224, 0.15)',
            color: input.trim() && !disabled ? '#00C8E0' : 'rgba(0, 200, 224, 0.3)',
            borderRadius: 0,
          }}
        >
          <Send size={10} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
