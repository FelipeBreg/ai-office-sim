'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Module-level constants (hoisted, never recreated) ────────────────
const PARTICLE_COUNT = 15;
const TRAVEL_DURATION = 2; // seconds to travel source -> destination
const OFFSET_RANGE = 0.15; // random lateral offset for organic feel
const PARTICLE_SIZE = 0.06;

const CYAN_COLOR = new THREE.Color('#00C8E0');

// ── Types ────────────────────────────────────────────────────────────
export interface DataFlowProps {
  source: [number, number, number];
  destination: [number, number, number];
  active: boolean;
}

// ── Component ────────────────────────────────────────────────────────
export const DataFlow = memo(function DataFlow({ source, destination, active }: DataFlowProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Refs for props (avoid stale closures in useFrame)
  const sourceRef = useRef(source);
  sourceRef.current = source;

  const destRef = useRef(destination);
  destRef.current = destination;

  const activeRef = useRef(active);
  activeRef.current = active;

  // Per-particle state arrays (allocated once, mutated in useFrame)
  const particleState = useMemo(() => {
    const progress = new Float32Array(PARTICLE_COUNT); // 0..1 along path
    const offsets = new Float32Array(PARTICLE_COUNT * 3); // random XYZ offsets
    const alive = new Uint8Array(PARTICLE_COUNT); // 1 = visible, 0 = hidden

    // Stagger initial progress so particles are spread along the path
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      progress[i] = i / PARTICLE_COUNT;
      alive[i] = 1;

      // Random lateral offsets (computed once, subtle variation)
      offsets[i * 3] = (Math.random() - 0.5) * OFFSET_RANGE;
      offsets[i * 3 + 1] = (Math.random() - 0.5) * OFFSET_RANGE;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * OFFSET_RANGE;
    }

    return { progress, offsets, alive };
  }, []);

  // Geometry: position buffer for all particles
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Material: additive blending for glow
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: CYAN_COLOR,
        size: PARTICLE_SIZE,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );

  // Dispose on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Track current opacity for fade in/out
  const opacityRef = useRef(active ? 0.8 : 0);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const src = sourceRef.current;
    const dst = destRef.current;
    const isActive = activeRef.current;

    // Fade opacity
    const targetOpacity = isActive ? 0.8 : 0;
    opacityRef.current = THREE.MathUtils.lerp(
      opacityRef.current,
      targetOpacity,
      1 - Math.exp(-3 * delta),
    );
    material.opacity = opacityRef.current;

    // Hide if fully faded
    points.visible = opacityRef.current > 0.01;
    if (!points.visible) return;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const { progress, offsets, alive } = particleState;

    const speed = delta / TRAVEL_DURATION;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Advance progress
      progress[i]! += speed;

      // Wrap around (respawn at source)
      if (progress[i]! >= 1) {
        if (isActive) {
          progress[i] = progress[i]! % 1;
          alive[i] = 1;
          // Re-randomize offset on respawn
          offsets[i * 3] = (Math.random() - 0.5) * OFFSET_RANGE;
          offsets[i * 3 + 1] = (Math.random() - 0.5) * OFFSET_RANGE;
          offsets[i * 3 + 2] = (Math.random() - 0.5) * OFFSET_RANGE;
        } else {
          alive[i] = 0;
        }
      }

      if (alive[i]) {
        const t = progress[i]!;

        // Slight arc: parabolic Y boost peaking at midpoint
        const arcHeight = Math.sin(t * Math.PI) * 0.3;

        positions[i * 3] =
          src[0] + (dst[0] - src[0]) * t + offsets[i * 3]!;
        positions[i * 3 + 1] =
          src[1] + (dst[1] - src[1]) * t + offsets[i * 3 + 1]! + arcHeight;
        positions[i * 3 + 2] =
          src[2] + (dst[2] - src[2]) * t + offsets[i * 3 + 2]!;
      } else {
        // Move offscreen
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -100;
        positions[i * 3 + 2] = 0;
      }
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
});
DataFlow.displayName = 'DataFlow';
