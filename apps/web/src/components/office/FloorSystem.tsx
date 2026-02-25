'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OfficeFloor } from './OfficeFloor';
import { OfficeRooms } from './OfficeRooms';
import { OfficeLayout } from './OfficeLayout';
import { AgentLayer } from './AgentLayer';
import type { AgentData } from './AgentLayer';
import { useFloorStore } from '@/stores/floor-store';
import {
  FLOOR_CONFIGS,
  FLOOR_NORMAL_SPACING,
  FLOOR_EXPLODED_SPACING,
} from './layouts/floors';
import type { FloorConfig } from './layouts/types';

// ── Constants ───────────────────────────────────────────────────────────
const OPACITY_ACTIVE = 1;
const OPACITY_GHOST = 0.1;
const OPACITY_EXPLODED_INACTIVE = 0.35;
const OPACITY_EXPLODED_ACTIVE = 0.9;
const LERP_SPEED = 4; // interpolation speed for Y positioning

// ── Per-floor mock agents (only Floor 1 has agents for now) ─────────────
const FLOOR_AGENTS: Record<string, AgentData[]> = {
  floor1: [
    { id: 'agent-1', name: 'João Suporte', roomKey: 'openWorkspace', slotIndex: 0 },
    { id: 'agent-2', name: 'Maria Vendas', roomKey: 'openWorkspace', slotIndex: 1 },
    { id: 'agent-3', name: 'André Análise', roomKey: 'openWorkspace', slotIndex: 3 },
    { id: 'agent-4', name: 'Lúcia Redação', roomKey: 'openWorkspace', slotIndex: 4 },
  ],
};

// ── Material type guard helpers ──────────────────────────────────────────
type MaterialWithOpacity = THREE.MeshStandardMaterial | THREE.LineBasicMaterial;

// ── Single Floor Layer ──────────────────────────────────────────────────
interface FloorLayerProps {
  config: FloorConfig;
  index: number;
  roomLabels: Record<string, string>;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
}

function FloorLayer({ config, index, roomLabels, selectedAgentId, onSelectAgent }: FloorLayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Subscribe to store via refs to avoid re-renders of the R3F scene tree
  const activeFloorRef = useRef(useFloorStore.getState().activeFloor);
  const explodedRef = useRef(useFloorStore.getState().exploded);

  useEffect(() => {
    const unsub = useFloorStore.subscribe((s) => {
      activeFloorRef.current = s.activeFloor;
      explodedRef.current = s.exploded;
    });
    return unsub;
  }, []);

  // Track current animated opacity
  const currentOpacityRef = useRef(
    index === activeFloorRef.current ? OPACITY_ACTIVE : OPACITY_GHOST,
  );

  // Collect material references once after mount (H1 fix)
  const materialsRef = useRef<MaterialWithOpacity[]>([]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Wait one frame for children to mount
    const raf = requestAnimationFrame(() => {
      const mats: MaterialWithOpacity[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.isMeshStandardMaterial) {
            mat.transparent = true;
            (mat.userData as { baseOpacity?: number }).baseOpacity ??= mat.opacity;
            mats.push(mat);
          }
        }
        if (child instanceof THREE.LineSegments && child.material) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.transparent = true;
          (mat.userData as { baseOpacity?: number }).baseOpacity ??= mat.opacity;
          mats.push(mat);
        }
      });
      materialsRef.current = mats;
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const activeFloor = activeFloorRef.current;
    const exploded = explodedRef.current;
    const isActive = index === activeFloor;

    // Compute target Y position
    const spacing = exploded ? FLOOR_EXPLODED_SPACING : FLOOR_NORMAL_SPACING;
    const targetY = index * spacing - spacing;

    // Lerp group position
    const t = 1 - Math.exp(-LERP_SPEED * delta);
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, t);

    // Compute target opacity
    let targetOpacity: number;
    if (exploded) {
      targetOpacity = isActive ? OPACITY_EXPLODED_ACTIVE : OPACITY_EXPLODED_INACTIVE;
    } else {
      targetOpacity = isActive ? OPACITY_ACTIVE : OPACITY_GHOST;
    }

    // Lerp opacity
    currentOpacityRef.current = THREE.MathUtils.lerp(
      currentOpacityRef.current,
      targetOpacity,
      t,
    );

    const opacity = currentOpacityRef.current;

    // Apply opacity to cached materials (no per-frame traverse)
    for (const mat of materialsRef.current) {
      const baseOpacity = (mat.userData as { baseOpacity?: number }).baseOpacity ?? 1;
      mat.opacity = opacity * baseOpacity;
    }

    // Visibility: in normal mode hide ghost floors that are too faint
    group.visible = exploded || isActive || opacity > 0.02;
  });

  const agents = FLOOR_AGENTS[config.id] ?? [];

  // Use computed initial Y from index formula (not baseY)
  const initialY = index * FLOOR_NORMAL_SPACING - FLOOR_NORMAL_SPACING;

  return (
    <group ref={groupRef} position={[0, initialY, 0]}>
      <OfficeFloor />
      <OfficeRooms
        roomLabels={roomLabels}
        layout={config.layout}
      />
      <OfficeLayout layout={config.layout} />
      {agents.length > 0 && (
        <AgentLayer
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
      )}
    </group>
  );
}

// ── Floor System ────────────────────────────────────────────────────────
interface FloorSystemProps {
  roomLabels: Record<string, string>;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
}

export function FloorSystem({ roomLabels, selectedAgentId, onSelectAgent }: FloorSystemProps) {
  return (
    <group>
      {FLOOR_CONFIGS.map((config, index) => (
        <FloorLayer
          key={config.id}
          config={config}
          index={index}
          roomLabels={roomLabels}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
      ))}
    </group>
  );
}
