'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// ── Module-level color constants (hoisted, never recreated) ──────────
const COLOR_IDLE = new THREE.Color('#00FF88');
const COLOR_WORKING = new THREE.Color('#00C8FF');
const COLOR_ERROR = new THREE.Color('#FF4444');
const COLOR_AWAITING = new THREE.Color('#FFD700');
const COLOR_OFFLINE = new THREE.Color('#666666');

const LABEL_COLOR = '#00C8E0';

// Characters to pre-build for drei <Text> (includes PT-BR diacritics + punctuation)
const TEXT_CHARACTERS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ' +
  'áàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ.-_/()';

// ── Status config ────────────────────────────────────────────────────
export type AgentStatus =
  | 'idle'
  | 'working'
  | 'error'
  | 'awaiting_approval'
  | 'offline';

interface StatusConfig {
  color: THREE.Color;
  baseIntensity: number;
  pulse: boolean;
  pulseSpeed: number; // radians per second
}

const STATUS_CONFIG: Record<AgentStatus, StatusConfig> = {
  idle: {
    color: COLOR_IDLE,
    baseIntensity: 0.5,
    pulse: false,
    pulseSpeed: 0,
  },
  working: {
    color: COLOR_WORKING,
    baseIntensity: 0.7,
    pulse: true,
    pulseSpeed: 3, // moderate pulse
  },
  error: {
    color: COLOR_ERROR,
    baseIntensity: 0.8,
    pulse: true,
    pulseSpeed: 8, // fast pulse
  },
  awaiting_approval: {
    color: COLOR_AWAITING,
    baseIntensity: 0.6,
    pulse: false,
    pulseSpeed: 0,
  },
  offline: {
    color: COLOR_OFFLINE,
    baseIntensity: 0.4,
    pulse: false,
    pulseSpeed: 0,
  },
};

// ── Props ────────────────────────────────────────────────────────────
export interface AgentAvatarProps {
  agentId: string;
  name: string;
  status: AgentStatus;
  position: [number, number, number];
  animationOffset?: number;
  selected?: boolean;
  onSelect?: (agentId: string) => void;
}

// ── Hover intensity boost ────────────────────────────────────────────
const HOVER_SCALE = 1.05;
const HOVER_INTENSITY_BOOST = 0.3;
const SELECTED_INTENSITY_BOOST = 0.4;

// ── Component ────────────────────────────────────────────────────────
export const AgentAvatar = memo(function AgentAvatar({
  agentId,
  name,
  status,
  position,
  animationOffset = 0,
  selected = false,
  onSelect,
}: AgentAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  // ── Geometry (capsule body = cylinder + sphere head) ──────────────
  const geometries = useMemo(() => {
    // Body: cylinder, radius 0.2, height 0.8
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12);
    // Head: sphere, radius 0.18
    const headGeo = new THREE.SphereGeometry(0.18, 12, 8);

    return { bodyGeo, headGeo };
  }, []);

  // Dispose geometries + materials on unmount
  useEffect(() => {
    return () => {
      geometries.bodyGeo.dispose();
      geometries.headGeo.dispose();
      bodyMatRef.current?.dispose();
      headMatRef.current?.dispose();
    };
  }, [geometries]);

  // ── Refs for useFrame (avoid stale closures) ────────────────────
  const cfgRef = useRef(STATUS_CONFIG[status]);
  cfgRef.current = STATUS_CONFIG[status];

  const posRef = useRef(position);
  posRef.current = position;

  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;

  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // ── Pointer handlers ─────────────────────────────────────────────
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect?.(agentId);
    },
    [onSelect, agentId],
  );

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // ── useFrame: glow pulse + idle bob + breathing ──────────────────
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const cfg = cfgRef.current;
    const pos = posRef.current;
    const isHovered = hoveredRef.current;
    const isSelected = selectedRef.current;

    // Accumulate time via group.userData
    const ud = group.userData as { t?: number };
    ud.t = (ud.t ?? 0) + delta;
    const t = ud.t + animationOffset;

    // ── Status glow pulse ──────────────────────────────────────────
    let intensity = cfg.baseIntensity;
    if (cfg.pulse) {
      const wave = Math.sin(t * cfg.pulseSpeed) * 0.5 + 0.5; // 0..1
      intensity = cfg.baseIntensity * (0.5 + 0.5 * wave);
    }

    // Boost intensity on hover or selection
    if (isSelected) {
      intensity += SELECTED_INTENSITY_BOOST;
    } else if (isHovered) {
      intensity += HOVER_INTENSITY_BOOST;
    }

    // Apply material updates
    if (bodyMatRef.current) {
      bodyMatRef.current.emissive.copy(cfg.color);
      bodyMatRef.current.emissiveIntensity = intensity;
      bodyMatRef.current.color.copy(cfg.color);
    }
    if (headMatRef.current) {
      headMatRef.current.emissive.copy(cfg.color);
      headMatRef.current.emissiveIntensity = intensity;
      headMatRef.current.color.copy(cfg.color);
    }

    // ── Idle floating bob (y oscillation) ──────────────────────────
    // 4s period = 2*PI / 4 = ~1.57 rad/s
    const bobY = Math.sin(t * 1.5708) * 0.02;
    group.position.y = pos[1] + bobY;

    // ── Subtle breathing scale pulse ───────────────────────────────
    // 3s period for breathing
    const breathe = 1 + Math.sin(t * 2.094) * 0.015;
    // Apply hover/selected scale boost
    const scaleMultiplier = isHovered || isSelected ? HOVER_SCALE : 1;
    const finalScale = breathe * scaleMultiplier;
    group.scale.set(finalScale, finalScale, finalScale);
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Body cylinder — center at y=0.4 (bottom at y=0) */}
      <mesh geometry={geometries.bodyGeo} position={[0, 0.55, 0]}>
        <meshStandardMaterial
          ref={bodyMatRef}
          color={COLOR_IDLE}
          transparent
          opacity={0.6}
          emissive={COLOR_IDLE}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Head sphere — sits on top of body */}
      <mesh geometry={geometries.headGeo} position={[0, 1.13, 0]}>
        <meshStandardMaterial
          ref={headMatRef}
          color={COLOR_IDLE}
          transparent
          opacity={0.6}
          emissive={COLOR_IDLE}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Floating name label */}
      <Text
        position={[0, 1.55, 0]}
        fontSize={0.14}
        color={LABEL_COLOR}
        anchorX="center"
        anchorY="middle"
        font="/fonts/IBMPlexMono-Medium.ttf"
        characters={TEXT_CHARACTERS}
      >
        {name}
      </Text>
    </group>
  );
}, (prev, next) =>
  prev.agentId === next.agentId &&
  prev.status === next.status &&
  prev.selected === next.selected &&
  prev.name === next.name &&
  prev.position[0] === next.position[0] &&
  prev.position[1] === next.position[1] &&
  prev.position[2] === next.position[2] &&
  prev.onSelect === next.onSelect
);

AgentAvatar.displayName = 'AgentAvatar';
