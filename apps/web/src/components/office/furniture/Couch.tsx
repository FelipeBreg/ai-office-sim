'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';

const EDGE_COLOR = '#2288CC';
const FILL_COLOR = '#0A1929';
const FILL_OPACITY = 0.1;

export const Couch = memo(function Couch() {
  const geometries = useMemo(() => {
    const seatGeo = new THREE.BoxGeometry(1.2, 0.2, 0.5);
    const seatEdges = new THREE.EdgesGeometry(seatGeo);

    const backGeo = new THREE.BoxGeometry(1.2, 0.4, 0.1);
    const backEdges = new THREE.EdgesGeometry(backGeo);

    const armGeo = new THREE.BoxGeometry(0.1, 0.3, 0.5);
    const armEdges = new THREE.EdgesGeometry(armGeo);

    return { seatGeo, seatEdges, backGeo, backEdges, armGeo, armEdges };
  }, []);

  useEffect(() => {
    return () => {
      geometries.seatGeo.dispose();
      geometries.seatEdges.dispose();
      geometries.backGeo.dispose();
      geometries.backEdges.dispose();
      geometries.armGeo.dispose();
      geometries.armEdges.dispose();
    };
  }, [geometries]);

  return (
    <group>
      {/* Seat */}
      <mesh geometry={geometries.seatGeo} position={[0, 0.3, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.seatEdges} position={[0, 0.3, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Back */}
      <mesh geometry={geometries.backGeo} position={[0, 0.6, -0.2]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.backEdges} position={[0, 0.6, -0.2]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Left arm */}
      <mesh geometry={geometries.armGeo} position={[-0.65, 0.45, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.armEdges} position={[-0.65, 0.45, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Right arm */}
      <mesh geometry={geometries.armGeo} position={[0.65, 0.45, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.armEdges} position={[0.65, 0.45, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>
    </group>
  );
});

Couch.displayName = 'Couch';
