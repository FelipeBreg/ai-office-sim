'use client';

import { useTranslations } from 'next-intl';
import { X, Bot } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface AgentDrawerProps {
  team: 'development' | 'research' | 'marketing' | 'sales' | 'support' | 'finance' | 'operations';
  open: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-text-muted',
  working: 'bg-accent-cyan',
  awaiting_approval: 'bg-status-warning',
  error: 'bg-status-error',
  offline: 'bg-border-default',
};

export function AgentDrawer({ team, open, onClose }: AgentDrawerProps) {
  const t = useTranslations('dashboard');
  const { data: agents, isLoading } = trpc.agents.listByTeam.useQuery(
    { team },
    { enabled: open },
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border-default bg-bg-base">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-accent-cyan" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-primary">
              {t('teamAgents')}
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse border border-border-subtle bg-bg-overlay" />
              ))}
            </div>
          )}

          {!isLoading && (!agents || agents.length === 0) && (
            <p className="py-8 text-center text-[10px] text-text-muted">{t('noAgentsTeam')}</p>
          )}

          {agents && agents.length > 0 && (
            <div className="flex flex-col gap-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="border border-border-default bg-bg-overlay p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-text-primary">{agent.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 ${STATUS_COLORS[agent.status] ?? 'bg-text-muted'}`} />
                      <span className="text-[9px] uppercase text-text-muted">{agent.status}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[9px] text-text-muted">{agent.archetype}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
