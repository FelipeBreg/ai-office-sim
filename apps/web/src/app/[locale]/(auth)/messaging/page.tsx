'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  MessageSquare,
  Send,
  Search,
  StickyNote,
  Phone,
  Mail,
  Globe,
  X,
  User,
  Bot,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Types ──

type Channel = 'whatsapp' | 'email' | 'webchat';
type Status = 'open' | 'snoozed' | 'resolved' | 'closed';
type ChannelFilter = Channel | 'all';

const CHANNEL_ICONS: Record<Channel, typeof Phone> = {
  whatsapp: Phone,
  email: Mail,
  webchat: Globe,
};

const CHANNEL_COLORS: Record<Channel, string> = {
  whatsapp: 'text-green-400',
  email: 'text-blue-400',
  webchat: 'text-accent-cyan',
};

const STATUS_COLORS: Record<Status, string> = {
  open: 'bg-status-success/20 text-status-success',
  snoozed: 'bg-status-warning/20 text-status-warning',
  resolved: 'bg-text-muted/20 text-text-muted',
  closed: 'bg-text-muted/20 text-text-muted',
};

// ── Conversation List Item ──

interface ConversationItemProps {
  conversation: {
    id: string;
    channel: Channel;
    contactName: string | null;
    contactIdentifier: string;
    status: Status;
    lastMessagePreview: string | null;
    lastMessageAt: Date | null;
    unreadCount: number;
  };
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const ChannelIcon = CHANNEL_ICONS[conversation.channel];
  const channelColor = CHANNEL_COLORS[conversation.channel];
  const displayName = conversation.contactName || conversation.contactIdentifier;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 border-b border-border-subtle px-3 py-2.5 text-left transition-colors ${
        isActive
          ? 'border-l-2 border-l-accent-cyan bg-bg-overlay'
          : 'border-l-2 border-l-transparent hover:bg-bg-overlay/50'
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
        <ChannelIcon size={14} className={channelColor} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-xs font-medium text-text-primary">
            {displayName}
          </span>
          {conversation.unreadCount > 0 && (
            <Badge variant="cyan" className="text-[8px]">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-[10px] text-text-muted">
          {conversation.lastMessagePreview || 'No messages yet'}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`inline-flex items-center px-1 py-0.5 text-[8px] uppercase ${STATUS_COLORS[conversation.status]}`}>
            {conversation.status}
          </span>
          {conversation.lastMessageAt && (
            <span className="text-[8px] text-text-muted">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Message Bubble ──

interface MessageItemProps {
  message: {
    id: string;
    direction: 'inbound' | 'outbound' | 'internal_note';
    senderType: 'agent' | 'user' | 'contact' | 'system';
    content: string;
    createdAt: Date;
  };
}

function MessageItem({ message }: MessageItemProps) {
  const borderColor =
    message.direction === 'inbound'
      ? 'border-border-default'
      : message.direction === 'internal_note'
        ? 'border-status-warning'
        : message.senderType === 'agent'
          ? 'border-accent-cyan'
          : 'border-status-success';

  const SenderIcon = message.senderType === 'agent' ? Bot : message.senderType === 'contact' ? User : User;

  return (
    <div className={`border-l-2 ${borderColor} bg-bg-base px-3 py-2`}>
      <div className="flex items-center gap-1.5">
        <SenderIcon size={10} className="text-text-muted" />
        <span className="text-[8px] uppercase tracking-wider text-text-muted">
          {message.senderType}
          {message.direction === 'internal_note' && ' — internal note'}
        </span>
        <span className="ml-auto text-[8px] text-text-muted">
          {formatTime(message.createdAt)}
        </span>
      </div>
      <p className={`mt-1 text-xs text-text-primary ${message.direction === 'internal_note' ? 'italic' : ''}`}>
        {message.content}
      </p>
    </div>
  );
}

// ── Helpers ──

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Main Page ──

export default function MessagingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<Status>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [composeText, setComposeText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Queries ──

  const conversationsQuery = trpc.messaging.listConversations.useQuery({
    channel: channelFilter === 'all' ? undefined : channelFilter,
    status: statusFilter,
    limit: 50,
  });

  const conversationDetail = trpc.messaging.getConversation.useQuery(
    { conversationId: selectedId!, messageLimit: 100 },
    { enabled: !!selectedId },
  );

  const utils = trpc.useUtils();

  const sendMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setComposeText('');
      setIsInternalNote(false);
      void utils.messaging.getConversation.invalidate({ conversationId: selectedId! });
      void utils.messaging.listConversations.invalidate();
    },
  });

  const updateStatusMutation = trpc.messaging.updateStatus.useMutation({
    onSuccess: () => {
      void utils.messaging.listConversations.invalidate();
      void utils.messaging.getConversation.invalidate({ conversationId: selectedId! });
    },
  });

  const markReadMutation = trpc.messaging.markRead.useMutation({
    onSuccess: () => {
      void utils.messaging.listConversations.invalidate();
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetail.data?.messages]);

  // Mark as read when selecting a conversation
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      markReadMutation.mutate({ conversationId: id });
    },
    [markReadMutation],
  );

  const handleSend = useCallback(() => {
    if (!selectedId || !composeText.trim()) return;
    sendMutation.mutate({
      conversationId: selectedId,
      content: composeText.trim(),
      isInternalNote,
    });
  }, [selectedId, composeText, isInternalNote, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const conversations = conversationsQuery.data?.items ?? [];
  const detail = conversationDetail.data;
  const activeConv = detail?.conversation;

  return (
    <div className="flex h-full">
      {/* ── Left Panel: Conversation List ── */}
      <div className="flex w-80 shrink-0 flex-col border-r border-border-default">
        {/* Header */}
        <div className="border-b border-border-default px-3 py-2.5">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-accent-cyan" />
            <h1 className="text-xs font-medium uppercase tracking-wider text-text-primary">
              Messaging
            </h1>
          </div>

          {/* Search */}
          <div className="mt-2 flex items-center gap-1.5 border border-border-default bg-bg-base px-2 py-1.5">
            <Search size={12} className="text-text-muted" />
            <input
              type="text"
              placeholder="search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[10px] text-text-primary placeholder-text-muted outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')}>
                <X size={10} className="text-text-muted" />
              </button>
            )}
          </div>

          {/* Channel filter tabs */}
          <div className="mt-2 flex gap-1">
            {(['all', 'whatsapp', 'email', 'webchat'] as ChannelFilter[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                className={`px-2 py-1 text-[8px] uppercase tracking-wider transition-colors ${
                  channelFilter === ch
                    ? 'border border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border border-border-default text-text-muted hover:text-text-secondary'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="mt-1.5 flex gap-1">
            {(['open', 'snoozed', 'resolved'] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 text-[8px] uppercase tracking-wider transition-colors ${
                  statusFilter === s
                    ? 'border border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border border-border-default text-text-muted hover:text-text-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading && (
            <div className="flex flex-col gap-0.5 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse border border-border-subtle bg-bg-overlay" />
              ))}
            </div>
          )}

          {!conversationsQuery.isLoading && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare size={24} className="mb-2 text-text-muted" />
              <p className="text-xs text-text-muted">No conversations</p>
              <p className="mt-1 text-[10px] text-text-muted">
                Inbound messages will appear here
              </p>
            </div>
          )}

          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv as ConversationItemProps['conversation']}
              isActive={selectedId === conv.id}
              onClick={() => handleSelect(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right Panel: Active Conversation ── */}
      <div className="flex flex-1 flex-col">
        {!selectedId && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-text-muted" />
              <p className="text-xs text-text-muted">Select a conversation</p>
            </div>
          </div>
        )}

        {selectedId && activeConv && (
          <>
            {/* Conversation header */}
            <div className="flex items-center gap-3 border-b border-border-default px-4 py-2.5">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = CHANNEL_ICONS[activeConv.channel as Channel];
                  return <Icon size={14} className={CHANNEL_COLORS[activeConv.channel as Channel]} />;
                })()}
                <span className="text-xs font-medium text-text-primary">
                  {activeConv.contactName || activeConv.contactIdentifier}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] uppercase ${STATUS_COLORS[activeConv.status as Status]}`}>
                  {activeConv.status}
                </span>
              </div>

              <div className="ml-auto flex gap-1.5">
                {activeConv.status === 'open' && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        conversationId: activeConv.id,
                        status: 'resolved',
                      })
                    }
                    className="border border-border-default px-2 py-1 text-[8px] uppercase text-text-secondary hover:border-status-success hover:text-status-success"
                  >
                    Resolve
                  </button>
                )}
                {activeConv.status === 'resolved' && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        conversationId: activeConv.id,
                        status: 'open',
                      })
                    }
                    className="border border-border-default px-2 py-1 text-[8px] uppercase text-text-secondary hover:border-accent-cyan hover:text-accent-cyan"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {conversationDetail.isLoading && (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse border-l-2 border-border-default bg-bg-overlay" />
                  ))}
                </div>
              )}

              {detail?.messages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <MessageItem message={msg as MessageItemProps['message']} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose bar */}
            <div className="border-t border-border-default px-4 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => setIsInternalNote(!isInternalNote)}
                  className={`flex items-center gap-1 px-2 py-1 text-[8px] uppercase tracking-wider transition-colors ${
                    isInternalNote
                      ? 'border border-status-warning bg-status-warning/10 text-status-warning'
                      : 'border border-border-default text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <StickyNote size={10} />
                  {isInternalNote ? 'Note' : 'Reply'}
                </button>
                {isInternalNote && (
                  <span className="text-[8px] italic text-status-warning">
                    Internal note — not visible to contact
                  </span>
                )}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isInternalNote ? 'Write an internal note...' : 'Type a message...'}
                  rows={2}
                  className="flex-1 resize-none border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-cyan"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!composeText.trim() || sendMutation.isPending}
                  className="flex h-8 w-8 items-center justify-center border border-border-default bg-bg-base text-text-muted transition-colors hover:border-accent-cyan hover:text-accent-cyan disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
