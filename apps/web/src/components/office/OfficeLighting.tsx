'use client';

import { memo } from 'react';

export const OfficeLighting = memo(function OfficeLighting() {
  return (
    <>
      {/* Ambient fill — very dim cool tone */}
      <ambientLight intensity={0.15} color="#E0E8FF" />

      {/* Main directional — top-right, cool blue, casts shadow */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.3}
        color="#4488FF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* Hemisphere — dark sky/ground separation */}
      <hemisphereLight
        args={['#1a1a3e', '#0D1117', 0.1]}
      />
    </>
  );
});

OfficeLighting.displayName = 'OfficeLighting';
