'use client';

import { useTranslations } from 'next-intl';
import { useActiveProject } from '@/stores/project-store';

/**
 * HeaderOverlay -- DOM overlay (absolute positioned, top-left)
 *
 * Displays "PROJECT A: AI OFFICE SIM" title, current project name,
 * and active agent count. Rendered OUTSIDE the Canvas as a sibling
 * DOM element for crisp 2D readability.
 */
export function HeaderOverlay() {
  const t = useTranslations('office.header');
  const project = useActiveProject();

  return (
    <div
      className="pointer-events-none absolute top-4 left-4 z-10 select-none"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Main title */}
      <div
        className="px-3 py-2"
        style={{
          background: 'rgba(10, 14, 20, 0.75)',
          border: '1px solid rgba(0, 200, 224, 0.2)',
          borderRadius: 0,
        }}
      >
        <h1
          className="text-[11px] font-light uppercase tracking-[0.25em]"
          style={{ color: 'rgba(0, 200, 224, 0.6)' }}
        >
          {t('title')}
        </h1>
        <div className="mt-1 flex items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'rgba(0, 200, 224, 0.4)' }}
          >
            {project?.name ?? t('noProject')}
          </span>
          <span
            className="text-[9px] uppercase tracking-wider"
            style={{ color: 'rgba(0, 200, 224, 0.3)' }}
          >
            {t('activeAgents', { count: 4 })}
          </span>
        </div>
      </div>
    </div>
  );
}
