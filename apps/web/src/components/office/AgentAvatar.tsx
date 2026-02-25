'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// ── Module-level color constants (hoisted, never recreated) ──────────
const COLOR_IDLE = new THREE.Color('#00FF88');
const COLOR_WORKING = new THREE.Color('#00C8FF');
const COLOR_ERROR = new THREE.Color('#FF4444');
const COLOR_AWAITING = new THREE.Color('#FFD700');
const COLOR_OFFLINE = new THREE.Color('#444444');

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
    baseIntensity: 0.1,
    pulse: false,
    pulseSpeed: 0,
  },
};

// ── Props ────────────────────────────────────────────────────────────
export interface AgentAvatarProps {
  name: string;
  status: AgentStatus;
  position: [number, number, number];
  animationOffset?: number;
}

// ── Component ────────────────────────────────────────────────────────
export function AgentAvatar({
  name,
  status,
  position,
  animationOffset = 0,
}: AgentAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);

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

  // ── useFrame: glow pulse + idle bob + breathing ──────────────────
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const cfg = cfgRef.current;
    const pos = posRef.current;

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
    group.scale.set(breathe, breathe, breathe);
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
    >
      {/* Body cylinder — center at y=0.4 (bottom at y=0) */}
      <mesh geometry={geometries.bodyGeo} position={[0, 0.55, 0]}>
        <meshStandardMaterial
          ref={bodyMatRef}
          color={STATUS_CONFIG[status].color}
          transparent
          opacity={0.6}
          emissive={STATUS_CONFIG[status].color}
          emissiveIntensity={STATUS_CONFIG[status].baseIntensity}
        />
      </mesh>

      {/* Head sphere — sits on top of body */}
      <mesh geometry={geometries.headGeo} position={[0, 1.13, 0]}>
        <meshStandardMaterial
          ref={headMatRef}
          color={STATUS_CONFIG[status].color}
          transparent
          opacity={0.6}
          emissive={STATUS_CONFIG[status].color}
          emissiveIntensity={STATUS_CONFIG[status].baseIntensity}
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
}
