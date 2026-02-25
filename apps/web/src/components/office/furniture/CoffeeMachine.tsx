'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const EDGE_COLOR = '#2288CC';
const FILL_COLOR = '#0A1929';
const FILL_OPACITY = 0.1;

export function CoffeeMachine() {
  const geometries = useMemo(() => {
    const bodyGeo = new THREE.BoxGeometry(0.3, 0.4, 0.25);
    const bodyEdges = new THREE.EdgesGeometry(bodyGeo);

    const topGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
    const topEdges = new THREE.EdgesGeometry(topGeo);

    return { bodyGeo, bodyEdges, topGeo, topEdges };
  }, []);

  useEffect(() => {
    return () => {
      geometries.bodyGeo.dispose();
      geometries.bodyEdges.dispose();
      geometries.topGeo.dispose();
      geometries.topEdges.dispose();
    };
  }, [geometries]);

  return (
    <group>
      {/* Body */}
      <mesh geometry={geometries.bodyGeo} position={[0, 0.2, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.bodyEdges} position={[0, 0.2, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Top hopper */}
      <mesh geometry={geometries.topGeo} position={[0, 0.45, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.topEdges} position={[0, 0.45, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>
    </group>
  );
}
