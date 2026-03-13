'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Bot, GitBranch, Target, FileText, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { trpc } from '@/lib/trpc/client';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'agent' | 'workflow' | 'strategy' | 'document';
  href: string;
}

const CATEGORY_CONFIG = {
  agent: { icon: Bot, color: 'text-accent-cyan' },
  workflow: { icon: GitBranch, color: 'text-emerald-400' },
  strategy: { icon: Target, color: 'text-violet-400' },
  document: { icon: FileText, color: 'text-amber-400' },
} as const;

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all agents, workflows, strategies upfront for fast local filtering
  const { data: agents } = trpc.agents.list.useQuery(undefined, { enabled: open });
  const { data: workflows } = trpc.workflows.list.useQuery(undefined, { enabled: open });
  const { data: strategies } = trpc.strategies.list.useQuery(undefined, { enabled: open });
  const docSearchMutation = trpc.documents.search.useMutation();

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search logic
  const runSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }

      const lower = q.toLowerCase();
      const matched: SearchResult[] = [];

      // Local: filter agents
      if (agents) {
        for (const a of agents) {
          if (a.name.toLowerCase().includes(lower) || a.archetype?.toLowerCase().includes(lower)) {
            matched.push({
              id: `agent-${a.id}`,
              title: a.name,
              subtitle: a.archetype ?? undefined,
              category: 'agent',
              href: `/agents/${a.id}`,
            });
          }
        }
      }

      // Local: filter workflows
      if (workflows) {
        for (const w of workflows) {
          if (w.name.toLowerCase().includes(lower) || w.description?.toLowerCase().includes(lower)) {
            matched.push({
              id: `wf-${w.id}`,
              title: w.name,
              subtitle: w.description ?? undefined,
              category: 'workflow',
              href: `/workflows/${w.id}`,
            });
          }
        }
      }

      // Local: filter strategies
      if (strategies) {
        for (const s of strategies) {
          const name = s.userDraft?.slice(0, 60) ?? s.type;
          if (
            name.toLowerCase().includes(lower) ||
            s.type.toLowerCase().includes(lower)
          ) {
            matched.push({
              id: `st-${s.id}`,
              title: name,
              subtitle: s.type,
              category: 'strategy',
              href: '/strategy',
            });
          }
        }
      }

      // Remote: RAG document search (only if query is 3+ chars)
      if (q.length >= 3) {
        setIsSearching(true);
        try {
          const docs = await docSearchMutation.mutateAsync({ query: q });
          for (const d of docs.slice(0, 5)) {
            matched.push({
              id: `doc-${d.documentTitle}-${d.score}`,
              title: d.documentTitle ?? 'Document',
              subtitle: d.content.slice(0, 80),
              category: 'document',
              href: '/memory',
            });
          }
        } catch {
          // Document search failed — continue with other results
        }
        setIsSearching(false);
      }

      setResults(matched.slice(0, 15));
      setSelectedIdx(0);
    },
    [agents, workflows, strategies, docSearchMutation],
  );

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void runSearch(query), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        onClose();
        router.push(results[selectedIdx].href);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIdx, onClose, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.15 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 top-[15%] z-[61] mx-auto w-full max-w-lg"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } }}
            exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.1 } }}
          >
            <div className="border border-border-default bg-bg-deepest shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-2 border-b border-border-default px-3 py-2.5">
                <Search size={14} strokeWidth={1.5} className="shrink-0 text-text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                {isSearching && (
                  <Loader2 size={12} className="shrink-0 animate-spin text-accent-cyan" />
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-5 w-5 items-center justify-center text-text-muted hover:text-text-primary"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-auto">
                {query.length < 2 ? (
                  <div className="px-3 py-6 text-center text-[10px] text-text-muted">
                    {t('searchHint')}
                  </div>
                ) : results.length === 0 && !isSearching ? (
                  <div className="px-3 py-6 text-center text-[10px] text-text-muted">
                    {t('noResults')}
                  </div>
                ) : (
                  <div className="py-1">
                    {results.map((r, idx) => {
                      const cfg = CATEGORY_CONFIG[r.category];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push(r.href);
                          }}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                            idx === selectedIdx
                              ? 'bg-accent-cyan/10 text-text-primary'
                              : 'text-text-secondary hover:bg-bg-base'
                          }`}
                        >
                          <Icon size={14} strokeWidth={1.5} className={`shrink-0 ${cfg.color}`} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-medium">{r.title}</div>
                            {r.subtitle && (
                              <div className="truncate text-[9px] text-text-muted">{r.subtitle}</div>
                            )}
                          </div>
                          <span className="shrink-0 text-[8px] uppercase tracking-wider text-text-muted">
                            {r.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center justify-between border-t border-border-default px-3 py-1.5">
                <div className="flex items-center gap-2 text-[8px] text-text-muted">
                  <span>↑↓ {t('navigate')}</span>
                  <span>↵ {t('select')}</span>
                  <span>esc {t('close')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
