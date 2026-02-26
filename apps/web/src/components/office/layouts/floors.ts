/**
 * Floor Definitions
 *
 * Single unified floor with all rooms on one Y=0 plane.
 */
import type { FloorConfig } from './types';
import { unifiedLayout } from './unified';

export const FLOOR_CONFIGS: FloorConfig[] = [
  {
    id: 'main',
    labelKey: 'main',
    baseY: 0,
    layout: unifiedLayout,
  },
];

/** Default active floor index */
export const DEFAULT_ACTIVE_FLOOR = 0;
