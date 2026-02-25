'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';

const EDGE_COLOR = '#2288CC';
const FILL_COLOR = '#0A1929';
const FILL_OPACITY = 0.1;
const SCREEN_COLOR = '#0D1B2A';
const SCREEN_EMISSIVE = new THREE.Color('#003355');

export const Monitor = memo(function Monitor() {
  const geometries = useMemo(() => {
    const screenGeo = new THREE.BoxGeometry(0.4, 0.3, 0.02);
    const screenEdges = new THREE.EdgesGeometry(screenGeo);

    const standGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
    const standEdges = new THREE.EdgesGeometry(standGeo);

    const baseGeo = new THREE.BoxGeometry(0.15, 0.015, 0.1);
    const baseEdges = new THREE.EdgesGeometry(baseGeo);

    return { screenGeo, screenEdges, standGeo, standEdges, baseGeo, baseEdges };
  }, []);

  useEffect(() => {
    return () => {
      geometries.screenGeo.dispose();
      geometries.screenEdges.dispose();
      geometries.standGeo.dispose();
      geometries.standEdges.dispose();
      geometries.baseGeo.dispose();
      geometries.baseEdges.dispose();
    };
  }, [geometries]);

  return (
    <group>
      {/* Screen */}
      <mesh geometry={geometries.screenGeo} position={[0, 0.35, 0]}>
        <meshStandardMaterial
          color={SCREEN_COLOR}
          transparent
          opacity={0.3}
          emissive={SCREEN_EMISSIVE}
          emissiveIntensity={0.3}
        />
      </mesh>
      <lineSegments geometry={geometries.screenEdges} position={[0, 0.35, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Stand */}
      <mesh geometry={geometries.standGeo} position={[0, 0.1, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.standEdges} position={[0, 0.1, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Base */}
      <mesh geometry={geometries.baseGeo} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.baseEdges} position={[0, 0, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>
    </group>
  );
});

Monitor.displayName = 'Monitor';
