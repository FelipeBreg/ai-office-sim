/**
 * Agent Positioning System
 *
 * Maps desk positions from ALL floor layouts so agents can be
 * assigned to specific slots within each room across any floor.
 *
 * Position coordinates are in world-space (layout room offset + desk offset).
 * NOTE: computed once at import time from all floor configs.
 */

import { FLOOR_CONFIGS } from './layouts/floors';

// ── Types ────────────────────────────────────────────────────────────
export interface DeskSlot {
  roomKey: string;
  slotIndex: number;
  worldPosition: [number, number, number];
}

// ── Pre-computed desk positions per room (all floors) ────────────────
const deskSlotsByRoom: Map<string, [number, number, number][]> = new Map();

for (const floorConfig of FLOOR_CONFIGS) {
  for (const room of floorConfig.layout.rooms) {
    const desks: [number, number, number][] = [];

    for (const item of room.furniture) {
      if (item.type === 'desk') {
        desks.push([
          room.position[0] + item.position[0],
          0, // ground level (relative to floor group)
          room.position[2] + item.position[2],
        ]);
      }
    }

    // Merge with existing slots if room key already seen
    const existing = deskSlotsByRoom.get(room.labelKey) ?? [];
    deskSlotsByRoom.set(room.labelKey, [...existing, ...desks]);
  }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Returns the world position for an agent at a given room + slot index.
 * If the slot index is out of range, it wraps around.
 * Falls back to a default position if the room key is unknown.
 */
export function getAgentPosition(
  roomKey: string,
  slotIndex: number,
): [number, number, number] {
  const slots = deskSlotsByRoom.get(roomKey);

  if (!slots || slots.length === 0) {
    // Fallback: center of open workspace
    return [5, 0, 4];
  }

  const idx = slotIndex % slots.length;
  return slots[idx]!;
}

/**
 * Returns all available desk slots for a given room.
 */
export function getRoomSlots(roomKey: string): [number, number, number][] {
  return deskSlotsByRoom.get(roomKey) ?? [];
}

/**
 * Returns the total number of desk slots available in a room.
 */
export function getRoomCapacity(roomKey: string): number {
  return deskSlotsByRoom.get(roomKey)?.length ?? 0;
}

/**
 * Returns all room keys that have desk slots.
 */
export function getRoomKeys(): string[] {
  return Array.from(deskSlotsByRoom.keys()).filter(
    (key) => (deskSlotsByRoom.get(key)?.length ?? 0) > 0,
  );
}
