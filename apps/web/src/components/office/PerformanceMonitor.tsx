'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { usePerfStore } from '@/stores/perf-store';

// ── Constants ────────────────────────────────────────────────────────
const FPS_SAMPLE_INTERVAL = 1; // seconds between FPS checks
const LOW_FPS_THRESHOLD = 45; // below this = low performance
const RECOVERY_FPS_THRESHOLD = 55; // above this = recovered (hysteresis)
const MIN_SAMPLES = 3; // require N consecutive low/high before toggling

/**
 * PerformanceMonitor
 *
 * Runs inside the R3F scene graph. Measures FPS and sets a Zustand flag
 * when performance drops below threshold. Components can read the
 * `lowPerformance` flag to reduce effects.
 *
 * Also conditionally renders drei's <Stats> in dev mode.
 */
export function PerformanceMonitor() {
  const frameCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const consecutiveLowRef = useRef(0);
  const consecutiveHighRef = useRef(0);

  // Direct store access to avoid re-renders
  const lowPerfRef = useRef(usePerfStore.getState().lowPerformance);

  useFrame((_, delta) => {
    frameCountRef.current += 1;
    elapsedRef.current += delta;

    if (elapsedRef.current >= FPS_SAMPLE_INTERVAL) {
      const fps = frameCountRef.current / elapsedRef.current;

      // Update store FPS only when value changed (avoid unnecessary Zustand notifications)
      const currentFps = Math.round(fps);
      if (currentFps !== usePerfStore.getState().fps) {
        usePerfStore.getState().setFps(currentFps);
      }

      // Check low performance with hysteresis
      if (fps < LOW_FPS_THRESHOLD) {
        consecutiveLowRef.current += 1;
        consecutiveHighRef.current = 0;

        if (consecutiveLowRef.current >= MIN_SAMPLES && !lowPerfRef.current) {
          lowPerfRef.current = true;
          usePerfStore.getState().setLowPerformance(true);
        }
      } else if (fps > RECOVERY_FPS_THRESHOLD) {
        consecutiveHighRef.current += 1;
        consecutiveLowRef.current = 0;

        if (consecutiveHighRef.current >= MIN_SAMPLES && lowPerfRef.current) {
          lowPerfRef.current = false;
          usePerfStore.getState().setLowPerformance(false);
        }
      } else {
        // In between thresholds — maintain current state
        consecutiveLowRef.current = 0;
        consecutiveHighRef.current = 0;
      }

      // Reset counters
      frameCountRef.current = 0;
      elapsedRef.current = 0;
    }
  });

  return null;
}

/**
 * DevStats
 *
 * Renders drei's <Stats> overlay only in development mode.
 * Must be placed inside the R3F Canvas.
 */
export function DevStats() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <Stats showPanel={0} className="stats-panel" />;
}
