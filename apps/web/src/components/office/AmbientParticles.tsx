'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePerfStore } from '@/stores/perf-store';

// ── Module-level constants (hoisted, never recreated) ────────────────
const PARTICLE_COUNT = 200;
const PARTICLE_SIZE = 0.02;
const PARTICLE_OPACITY = 0.3;
const DRIFT_SPEED = 0.3; // units per second upward
const OSCILLATION_AMPLITUDE = 0.12; // max horizontal sway
const OSCILLATION_FREQUENCY = 0.5; // radians per second for sway

// Bounding box for particle field
const BOUNDS_MIN_X = -2;
const BOUNDS_MAX_X = 22;
const BOUNDS_MIN_Y = -5;
const BOUNDS_MAX_Y = 12;
const BOUNDS_MIN_Z = -2;
const BOUNDS_MAX_Z = 12;

const AMBIENT_COLOR = new THREE.Color('#1a4a6a');

// ── Helper: random float in range ────────────────────────────────────
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Reduced particle count when low performance is detected
const LOW_PERF_PARTICLE_COUNT = 80;

// ── Component ────────────────────────────────────────────────────────
export function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  // Subscribe via ref to avoid React re-renders in the R3F scene graph
  const lowPerfRef = useRef(usePerfStore.getState().lowPerformance);
  useEffect(() => {
    const unsub = usePerfStore.subscribe((s) => {
      lowPerfRef.current = s.lowPerformance;
    });
    return unsub;
  }, []);

  // Per-particle phase offsets + base X/Z positions for absolute oscillation
  const particleData = useMemo(() => {
    const phases = new Float32Array(PARTICLE_COUNT);
    const baseX = new Float32Array(PARTICLE_COUNT);
    const baseZ = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      baseX[i] = randomRange(BOUNDS_MIN_X, BOUNDS_MAX_X);
      baseZ[i] = randomRange(BOUNDS_MIN_Z, BOUNDS_MAX_Z);
    }
    return { phases, baseX, baseZ };
  }, []);

  // Geometry with initial random positions
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = randomRange(BOUNDS_MIN_X, BOUNDS_MAX_X); // will be overridden by absolute oscillation
      positions[i * 3 + 1] = randomRange(BOUNDS_MIN_Y, BOUNDS_MAX_Y);
      positions[i * 3 + 2] = randomRange(BOUNDS_MIN_Z, BOUNDS_MAX_Z); // will be overridden
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Material
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: AMBIENT_COLOR,
        size: PARTICLE_SIZE,
        transparent: true,
        opacity: PARTICLE_OPACITY,
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

  // Elapsed time ref for oscillation
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;

    const { phases, baseX, baseZ } = particleData;

    // In low-performance mode, only animate a subset of particles
    const activeCount = lowPerfRef.current ? LOW_PERF_PARTICLE_COUNT : PARTICLE_COUNT;

    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3;
      const phase = phases[i]!;

      // Upward drift (delta-based, frame-rate independent)
      positions[i3 + 1]! += DRIFT_SPEED * delta;

      // Horizontal oscillation (absolute offset from base, not additive)
      const swayX = Math.sin(elapsed * OSCILLATION_FREQUENCY + phase) * OSCILLATION_AMPLITUDE;
      const swayZ = Math.cos(elapsed * OSCILLATION_FREQUENCY + phase * 1.3) * OSCILLATION_AMPLITUDE * 0.7;
      positions[i3] = baseX[i]! + swayX;
      positions[i3 + 2] = baseZ[i]! + swayZ;

      // Wrap Y: if above max, reset to min
      if (positions[i3 + 1]! > BOUNDS_MAX_Y) {
        positions[i3 + 1] = BOUNDS_MIN_Y;
        // Re-randomize base X and Z on wrap for variety
        baseX[i] = randomRange(BOUNDS_MIN_X, BOUNDS_MAX_X);
        baseZ[i] = randomRange(BOUNDS_MIN_Z, BOUNDS_MAX_Z);
      }
    }

    // Hide inactive particles off-screen when in low-performance mode
    for (let i = activeCount; i < PARTICLE_COUNT; i++) {
      positions[i * 3 + 1] = BOUNDS_MIN_Y - 100;
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
