'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useProjectStore, useProjects, useActiveProject } from '@/stores/project-store';
import { ChevronDown, Plus } from 'lucide-react';

interface ProjectSwitcherProps {
  collapsed: boolean;
}

export function ProjectSwitcher({ collapsed }: ProjectSwitcherProps) {
  const t = useTranslations('nav');
  const projects = useProjects();
  const activeProject = useActiveProject();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(projectId: string) {
    useProjectStore.getState().setCurrentProject(projectId);
    setOpen(false);
  }

  // Collapsed: show only the colored dot of the active project
  if (collapsed) {
    return (
      <div className="flex items-center justify-center py-1">
        <div
          className="h-2 w-2 shrink-0"
          style={{ backgroundColor: activeProject?.color ?? '#555' }}
          title={activeProject?.name ?? t('switchProject')}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-bg-overlay"
        aria-label={t('switchProject')}
      >
        <div
          className="h-2 w-2 shrink-0"
          style={{ backgroundColor: activeProject?.color ?? '#555' }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[10px] leading-tight text-text-primary">
            {activeProject?.name ?? '---'}
          </span>
          <span className="truncate text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {activeProject?.slug ?? '---'}
          </span>
        </div>
        <ChevronDown
          size={10}
          strokeWidth={1.5}
          className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 w-full border border-border-default bg-bg-base">
          {/* Header */}
          <div className="px-2 pb-1 pt-1.5">
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('switchProject')}
            </span>
          </div>

          {/* Project list */}
          <div className="max-h-[200px] overflow-y-auto">
            {projects.map((project) => {
              const isActive = project.id === activeProject?.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelect(project.id)}
                  className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
                    isActive
                      ? 'border-l-2 border-accent-cyan bg-accent-cyan/5'
                      : 'border-l-2 border-transparent hover:bg-bg-overlay'
                  }`}
                >
                  <div
                    className="h-2 w-2 shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[10px] leading-tight text-text-primary">
                      {project.name}
                    </span>
                    <span className="truncate text-[8px] uppercase tracking-[0.15em] text-text-muted">
                      {project.slug}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* New Project link */}
          <div className="border-t border-border-default">
            <Link
              href="/settings/projects/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-text-secondary transition-colors hover:bg-bg-overlay hover:text-text-primary"
            >
              <Plus size={10} strokeWidth={1.5} className="shrink-0" />
              <span>{t('newProject')}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
