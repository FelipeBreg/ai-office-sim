'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useProjectStore, useActiveProject, useProjects } from '@/stores/project-store';
import { LocaleSwitcher } from '@/components/locale-switcher/locale-switcher';
import { safeColor } from '@/lib/safe-color';

const routeToNavKey: Record<string, string> = {
  '/office': 'office',
  '/atlas': 'atlas',
  '/agents': 'agents',
  '/workflows': 'workflows',
  '/devops': 'devops',
  '/approvals': 'approvals',
  '/strategy': 'strategy',
  '/memory': 'memory',
  '/tools': 'tools',
  '/analytics': 'analytics',
  '/settings': 'settings',
};

interface HeaderProps {
  pendingApprovalCount?: number;
}

export function Header({ pendingApprovalCount = 0 }: HeaderProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const activeProject = useActiveProject();
  const projects = useProjects();
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Derive current page name from pathname
  const pageName =
    routeToNavKey[
      Object.keys(routeToNavKey).find(
        (route) => pathname === route || pathname.startsWith(route + '/'),
      ) ?? '/office'
    ] ?? 'office';

  // Outside click + Escape to close dropdown
  useEffect(() => {
    if (!projectDropdownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setProjectDropdownOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [projectDropdownOpen]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Open global search dialog
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const projectColor = safeColor(activeProject?.color);

  return (
    <header className="flex h-[var(--height-header)] shrink-0 items-center justify-between border-b border-border-default bg-bg-base px-4">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs">
        {activeProject && (
          <>
            <span className="font-medium" style={{ color: projectColor }}>
              {activeProject.name}
            </span>
            <span className="text-text-muted">/</span>
          </>
        )}
        <span className="text-text-secondary">{t(pageName)}</span>
      </div>

      {/* Center: search stub */}
      <button className="flex items-center gap-2 border border-border-default bg-bg-deepest px-2.5 py-1 transition-colors hover:border-border-hover">
        <Search size={12} strokeWidth={1.5} className="text-text-muted" />
        <span className="text-[11px] text-text-muted">{t('searchPlaceholder')}</span>
        <kbd className="ml-3 border border-border-default bg-bg-base px-1 py-0.5 text-[9px] text-text-muted">
          {isMac ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </button>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative text-text-muted transition-colors hover:text-text-primary"
          aria-label={t('notifications')}
        >
          <Bell size={14} strokeWidth={1.5} />
          {pendingApprovalCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse bg-accent-cyan" />
          )}
        </button>

        {/* Locale switcher */}
        <LocaleSwitcher />

        {/* Company/Project switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex h-6 items-center gap-1.5 border border-border-default bg-bg-deepest px-2 transition-colors hover:border-border-hover"
            aria-expanded={projectDropdownOpen}
            aria-haspopup="listbox"
          >
            {activeProject && (
              <div
                className="h-3 w-3 shrink-0"
                style={{ backgroundColor: projectColor, opacity: 0.8 }}
              />
            )}
            <span className="max-w-[100px] truncate text-[10px] font-medium text-text-primary">
              {activeProject?.name ?? '—'}
            </span>
            <ChevronDown
              size={10}
              strokeWidth={1.5}
              className="shrink-0 text-text-muted transition-transform"
              style={{ transform: projectDropdownOpen ? 'rotate(180deg)' : undefined }}
            />
          </button>

          {projectDropdownOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-1 min-w-[200px] border border-border-default bg-bg-base shadow-lg"
              role="listbox"
            >
              <div className="px-2 py-1.5">
                <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
                  {t('companies')}
                </span>
              </div>
              {projects.map((p) => {
                const pColor = safeColor(p.color);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProject(p.id);
                      setProjectDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-bg-overlay"
                    role="option"
                    aria-selected={activeProject?.id === p.id}
                  >
                    <div
                      className="h-3 w-3 shrink-0"
                      style={{ backgroundColor: pColor, opacity: 0.8 }}
                    />
                    <span className="text-[11px] text-text-primary">{p.name}</span>
                    {activeProject?.id === p.id && (
                      <span className="ml-auto text-[9px] text-accent-cyan">
                        {t('active')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User avatar (Clerk) */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-6 w-6',
            },
          }}
        />
      </div>
    </header>
  );
}
