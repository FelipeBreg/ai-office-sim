/**
 * Floor Definitions
 *
 * Defines all floors in the building with their Y positions and layouts.
 * Floor order: Basement (-3) → Floor 1 (0) → Floor 2 (3) → Floor 3 (6)
 */
import type { FloorConfig } from './types';
import { defaultLayout } from './default';
import { intelligenceLayout } from './intelligence';
import { communicationLayout } from './communication';
import { basementLayout } from './basement';

export const FLOOR_CONFIGS: FloorConfig[] = [
  {
    id: 'basement',
    labelKey: 'basement',
    baseY: -3,
    layout: basementLayout,
  },
  {
    id: 'floor1',
    labelKey: 'floor1',
    baseY: 0,
    layout: defaultLayout,
  },
  {
    id: 'floor2',
    labelKey: 'floor2',
    baseY: 3,
    layout: intelligenceLayout,
  },
  {
    id: 'floor3',
    labelKey: 'floor3',
    baseY: 6,
    layout: communicationLayout,
  },
];

/** Default active floor index (Floor 1 — Operações) */
export const DEFAULT_ACTIVE_FLOOR = 1;

/** Normal spacing between floors (used for baseY computation) */
export const FLOOR_NORMAL_SPACING = 3;

/** Exploded view spacing between floors */
export const FLOOR_EXPLODED_SPACING = 8;
