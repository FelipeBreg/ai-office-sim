'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useFloorStore } from '@/stores/floor-store';

/**
 * NavControls -- DOM overlay (absolute positioned, bottom-left)
 *
 * Zoom +/-, reset camera, and directional pan buttons.
 * Dispatches camera actions through the floor store, consumed
 * by FloorCameraController each frame.
 *
 * Rendered OUTSIDE the Canvas as a sibling DOM element.
 */
export function NavControls() {
  const t = useTranslations('office');
  const dispatchCamera = useFloorStore((s) => s.dispatchCamera);

  const handleZoomIn = useCallback(() => {
    dispatchCamera({ type: 'zoom', delta: 1 });
  }, [dispatchCamera]);

  const handleZoomOut = useCallback(() => {
    dispatchCamera({ type: 'zoom', delta: -1 });
  }, [dispatchCamera]);

  const handleReset = useCallback(() => {
    dispatchCamera({ type: 'reset' });
  }, [dispatchCamera]);

  const handlePanUp = useCallback(() => {
    dispatchCamera({ type: 'pan', dx: 0, dz: -1 });
  }, [dispatchCamera]);

  const handlePanDown = useCallback(() => {
    dispatchCamera({ type: 'pan', dx: 0, dz: 1 });
  }, [dispatchCamera]);

  const handlePanLeft = useCallback(() => {
    dispatchCamera({ type: 'pan', dx: -1, dz: 0 });
  }, [dispatchCamera]);

  const handlePanRight = useCallback(() => {
    dispatchCamera({ type: 'pan', dx: 1, dz: 0 });
  }, [dispatchCamera]);

  return (
    <div
      className="pointer-events-auto absolute bottom-20 left-4 z-10 flex flex-col gap-1"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {/* Zoom controls */}
      <div className="flex gap-1">
        <NavButton onClick={handleZoomIn} title={t('zoomIn')} aria-label={t('zoomIn')}>
          +
        </NavButton>
        <NavButton onClick={handleZoomOut} title={t('zoomOut')} aria-label={t('zoomOut')}>
          &minus;
        </NavButton>
      </div>

      {/* Pan d-pad */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        {/* Top row: up arrow */}
        <NavButton onClick={handlePanUp} title={t('nav.panUp')} small>
          <ArrowIcon direction="up" />
        </NavButton>

        {/* Middle row: left + reset + right */}
        <div className="flex gap-0.5">
          <NavButton onClick={handlePanLeft} title={t('nav.panLeft')} small>
            <ArrowIcon direction="left" />
          </NavButton>
          <NavButton onClick={handleReset} title={t('resetView')}>
            <ResetIcon />
          </NavButton>
          <NavButton onClick={handlePanRight} title={t('nav.panRight')} small>
            <ArrowIcon direction="right" />
          </NavButton>
        </div>

        {/* Bottom row: down arrow */}
        <NavButton onClick={handlePanDown} title={t('nav.panDown')} small>
          <ArrowIcon direction="down" />
        </NavButton>
      </div>
    </div>
  );
}

// ── Shared button ──────────────────────────────────────────────────────
function NavButton({
  children,
  onClick,
  title,
  small,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  small?: boolean;
  'aria-label'?: string;
}) {
  const size = small ? 24 : 28;

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      className="flex items-center justify-center text-[11px] font-medium uppercase transition-colors hover:bg-[#00C8E0] hover:text-[#0A0E14]"
      style={{
        width: size,
        height: size,
        background: 'rgba(10, 14, 20, 0.85)',
        color: '#00C8E0',
        border: '1px solid rgba(0, 200, 224, 0.3)',
        borderRadius: 0,
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

// ── Arrow Icon ─────────────────────────────────────────────────────────
function ArrowIcon({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) {
  const rotation = {
    up: 0,
    right: 90,
    down: 180,
    left: 270,
  }[direction];

  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M5 2L8 7H2L5 2Z" fill="currentColor" />
    </svg>
  );
}

// ── Reset Icon ─────────────────────────────────────────────────────────
function ResetIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple crosshair / target icon */}
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}
