'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useFloorStore } from '@/stores/floor-store';
import { FLOOR_CONFIGS } from './layouts/floors';

/**
 * FloorSelector — DOM overlay (absolute positioned, bottom-right of 3D view)
 *
 * Stacked rectangle icons representing each floor. Active floor highlighted
 * with cyan accent. Clicking a floor updates the store's activeFloor, which
 * triggers the camera animation via FloorCameraController.
 *
 * Renders OUTSIDE the Canvas as a sibling DOM element.
 */
export function FloorSelector() {
  const t = useTranslations('office.floors');
  const activeFloor = useFloorStore((s) => s.activeFloor);
  const setActiveFloor = useFloorStore((s) => s.setActiveFloor);
  const exploded = useFloorStore((s) => s.exploded);
  const toggleExploded = useFloorStore((s) => s.toggleExploded);

  // Render floors in reverse order (top floor at top of stack visually)
  const floorsWithIndex = useMemo(
    () => FLOOR_CONFIGS.map((config, index) => ({ config, index })).reverse(),
    [],
  );

  return (
    <div
      className="pointer-events-auto absolute right-4 bottom-4 z-10 flex flex-col gap-1"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Exploded view toggle */}
      <button
        onClick={toggleExploded}
        className="mb-2 flex items-center justify-center px-2 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
        style={{
          background: exploded ? '#00C8E0' : '#0A0E14',
          color: exploded ? '#0A0E14' : '#00C8E0',
          border: '1px solid #00C8E0',
          borderRadius: 0,
          cursor: 'pointer',
          minWidth: 120,
        }}
        title={exploded ? t('collapseView') : t('explodedView')}
      >
        <ExplodedIcon active={exploded} />
        <span className="ml-1.5">
          {exploded ? t('collapseView') : t('explodedView')}
        </span>
      </button>

      {/* Floor buttons */}
      {floorsWithIndex.map(({ config, index: floorIndex }) => {
        const isActive = floorIndex === activeFloor;

        return (
          <button
            key={config.id}
            onClick={() => setActiveFloor(floorIndex)}
            className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider transition-colors"
            style={{
              background: isActive ? '#00C8E0' : '#0A0E14',
              color: isActive ? '#0A0E14' : '#00C8E0',
              border: `1px solid ${isActive ? '#00C8E0' : '#1A3A5F'}`,
              borderRadius: 0,
              cursor: 'pointer',
              minWidth: 120,
              opacity: isActive ? 1 : 0.7,
            }}
            title={t(config.labelKey)}
          >
            {/* Floor level indicator rectangle */}
            <span
              className="inline-block"
              style={{
                width: 14,
                height: 6,
                background: isActive ? '#0A0E14' : '#00C8E0',
                border: `1px solid ${isActive ? '#0A0E14' : '#00C8E0'}`,
                borderRadius: 0,
                opacity: isActive ? 1 : 0.5,
              }}
            />
            <span>{t(config.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Exploded View Icon ──────────────────────────────────────────────────
function ExplodedIcon({ active }: { active: boolean }) {
  const color = active ? '#0A0E14' : '#00C8E0';
  // Simple stacked-layers icon using inline SVG
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Bottom layer */}
      <rect x="1" y="10" width="12" height="2" fill={color} />
      {/* Middle layer */}
      <rect x="1" y={active ? '5' : '6'} width="12" height="2" fill={color} />
      {/* Top layer */}
      <rect x="1" y={active ? '0' : '2'} width="12" height="2" fill={color} />
    </svg>
  );
}
