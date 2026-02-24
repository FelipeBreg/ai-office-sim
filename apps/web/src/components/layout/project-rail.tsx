'use client';

import { useTranslations } from 'next-intl';
import { Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useProjectStore, useActiveProject, useProjects } from '@/stores/project-store';
import { Tooltip } from '@/components/ui/tooltip';
import { safeColor } from '@/lib/safe-color';

export function ProjectRail() {
  const t = useTranslations('nav');
  const projects = useProjects();
  const activeProject = useActiveProject();
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const collapsed = useUIStore((s) => s.railCollapsed);
  const toggleRail = useUIStore((s) => s.toggleRail);

  return (
    <div
      className="relative flex shrink-0 flex-col items-center border-r border-border-default bg-bg-deepest transition-all duration-200"
      style={{ width: collapsed ? 0 : 48, overflow: 'hidden' }}
    >
      <div className="flex w-12 flex-col items-center gap-2 py-4">
        {projects.map((project) => {
          const isActive = activeProject?.id === project.id;
          const initial = project.name.charAt(0).toUpperCase();
          const color = safeColor(project.color);

          return (
            <Tooltip key={project.id} content={project.name} side="right">
              <button
                onClick={() => setCurrentProject(project.id)}
                className="group relative flex h-9 w-9 items-center justify-center text-[10px] font-semibold tracking-wider transition-all"
                style={{
                  border: `1px solid ${isActive ? color : 'var(--color-border-default)'}`,
                  background: isActive ? `${color}18` : 'transparent',
                  color: isActive ? color : 'var(--color-text-secondary)',
                }}
              >
                {initial}
                {isActive && (
                  <span
                    className="absolute -left-[5px] h-4 w-[2px]"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            </Tooltip>
          );
        })}

        <Tooltip content={t('newProject')} side="right">
          <button className="flex h-9 w-9 items-center justify-center border border-dashed border-border-default text-text-muted transition-all hover:border-accent-cyan hover:text-accent-cyan">
            <Plus size={14} strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>

      {/* Only show collapse toggle when rail is expanded (clipped by overflow:hidden when collapsed) */}
      {!collapsed && (
        <button
          onClick={toggleRail}
          className="absolute -right-2.5 top-3 z-10 flex h-5 w-5 items-center justify-center border border-border-default bg-bg-deepest text-text-muted transition-colors hover:text-text-primary"
          aria-label={t('collapseNav')}
        >
          <PanelLeftClose size={10} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

/** Small expand button shown when rail is collapsed */
export function RailExpandButton() {
  const t = useTranslations('nav');
  const collapsed = useUIStore((s) => s.railCollapsed);
  const toggleRail = useUIStore((s) => s.toggleRail);

  if (!collapsed) return null;

  return (
    <button
      onClick={toggleRail}
      className="flex h-full w-5 shrink-0 items-start justify-center border-r border-border-default bg-bg-deepest pt-3 text-text-muted transition-colors hover:text-accent-cyan"
      aria-label={t('expandNav')}
    >
      <PanelLeftOpen size={12} strokeWidth={1.5} />
    </button>
  );
}
