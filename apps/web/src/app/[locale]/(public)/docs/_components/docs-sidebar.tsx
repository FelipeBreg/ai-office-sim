'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X, ChevronRight } from 'lucide-react';
import { topics } from '../_lib/docs-data';
import type { DocTopic } from '../_lib/docs-data';

function TopicItem({ topic, active }: { topic: DocTopic; active: boolean }) {
  const [expanded, setExpanded] = useState(active);
  const Icon = topic.icon;
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

  const isExpanded = active || expanded;

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={`/docs/${topic.slug}`}
          className={`flex flex-1 items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${
            active
              ? 'bg-accent-cyan-dim text-accent-cyan'
              : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
          }`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{topic.label}</span>
        </Link>
        {hasSubtopics && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="px-2 py-2 text-text-muted transition-colors hover:text-text-primary"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}
      </div>

      {hasSubtopics && isExpanded && (
        <div className="ml-5 border-l border-border-default">
          {topic.subtopics!.map((sub) => (
            <Link
              key={sub.id}
              href={`/docs/${topic.slug}#${sub.id}`}
              className="block px-3 py-1 font-mono text-[11px] text-text-muted transition-colors hover:text-accent-cyan"
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocsSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Extract current topic slug from pathname like /docs/agents
  const currentSlug = pathname.replace(/^\/docs\/?/, '').split('#')[0] || 'overview';

  const sidebar = (
    <nav className="flex flex-col gap-0.5 py-2">
      {topics.map((topic) => (
        <TopicItem
          key={topic.slug}
          topic={topic}
          active={currentSlug === topic.slug}
        />
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-4 right-4 z-50 border border-border-default bg-bg-deepest p-3 text-accent-cyan lg:hidden"
        aria-label="Toggle sidebar"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-bg-deepest/80 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 overflow-y-auto border-r border-border-default bg-bg-deepest transition-transform lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-border-default px-4 py-3">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent-cyan">
            Topics
          </p>
        </div>
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-border-default lg:block">
        {sidebar}
      </aside>
    </>
  );
}
