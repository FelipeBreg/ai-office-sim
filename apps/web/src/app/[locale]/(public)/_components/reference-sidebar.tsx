'use client';

import { useMemo, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X, ChevronRight } from 'lucide-react';
import type { ReferenceTopic } from './reference-types';

function TopicItem({
  topic,
  active,
  basePath,
}: {
  topic: ReferenceTopic;
  active: boolean;
  basePath: string;
}) {
  const [expanded, setExpanded] = useState(active);
  const Icon = topic.icon;
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

  const isExpanded = active || expanded;

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={`${basePath}/${topic.slug}`}
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
              href={`${basePath}/${topic.slug}#${sub.id}`}
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

function SidebarGroup({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-1.5 px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary first:pt-0"
      >
        <ChevronRight
          className={`h-2.5 w-2.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {label}
      </button>
      {open && children}
    </div>
  );
}

export default function ReferenceSidebar({
  topics,
  basePath,
  defaultSlug,
  title,
}: {
  topics: ReferenceTopic[];
  basePath: string;
  defaultSlug: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const regex = new RegExp(`^${basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/?`);
  const currentSlug = pathname.replace(regex, '').split('#')[0] || defaultSlug;

  const groups = useMemo(() => {
    const map = new Map<string, ReferenceTopic[]>();
    for (const topic of topics) {
      const g = topic.group ?? '';
      const arr = map.get(g);
      if (arr) arr.push(topic);
      else map.set(g, [topic]);
    }
    return Array.from(map.entries());
  }, [topics]);

  const sidebar = (
    <nav className="flex flex-col gap-0.5 py-2">
      {groups.map(([group, items]) => {
        const hasActive = items.some((t) => t.slug === currentSlug);
        return group ? (
          <SidebarGroup key={group} label={group} defaultOpen={hasActive}>
            {items.map((topic) => (
              <TopicItem
                key={topic.slug}
                topic={topic}
                active={currentSlug === topic.slug}
                basePath={basePath}
              />
            ))}
          </SidebarGroup>
        ) : (
          <div key="ungrouped">
            {items.map((topic) => (
              <TopicItem
                key={topic.slug}
                topic={topic}
                active={currentSlug === topic.slug}
                basePath={basePath}
              />
            ))}
          </div>
        );
      })}
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
            {title}
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
