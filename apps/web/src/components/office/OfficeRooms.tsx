'use client';

import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomLayout } from './layouts/default';
import { defaultLayout } from './layouts/default';

interface RoomProps {
  room: RoomLayout;
  label: string;
}

const WALL_HEIGHT = 2;
const WALL_THICKNESS = 0.05;
const WALL_COLOR = '#1A3A5F';
const EDGE_COLOR = '#00D4FF';

function Room({ room, label }: RoomProps) {
  const { position, size } = room;
  const [width, depth] = size;

  const walls = useMemo(() => {
    const definitions: {
      size: [number, number, number];
      pos: [number, number, number];
    }[] = [
      // Back wall (along X at z=0)
      {
        size: [width, WALL_HEIGHT, WALL_THICKNESS],
        pos: [width / 2, WALL_HEIGHT / 2, 0],
      },
      // Front wall (along X at z=depth)
      {
        size: [width, WALL_HEIGHT, WALL_THICKNESS],
        pos: [width / 2, WALL_HEIGHT / 2, depth],
      },
      // Left wall (along Z at x=0)
      {
        size: [WALL_THICKNESS, WALL_HEIGHT, depth],
        pos: [0, WALL_HEIGHT / 2, depth / 2],
      },
      // Right wall (along Z at x=width)
      {
        size: [WALL_THICKNESS, WALL_HEIGHT, depth],
        pos: [width, WALL_HEIGHT / 2, depth / 2],
      },
    ];

    return definitions.map((def) => {
      const geo = new THREE.BoxGeometry(...def.size);
      const edges = new THREE.EdgesGeometry(geo);
      return { geo, edges, pos: def.pos };
    });
  }, [width, depth]);

  useEffect(() => {
    return () => {
      walls.forEach((wall) => {
        wall.geo.dispose();
        wall.edges.dispose();
      });
    };
  }, [walls]);

  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Walls */}
      {walls.map((wall, i) => (
        <group key={i} position={wall.pos}>
          <mesh geometry={wall.geo}>
            <meshStandardMaterial
              color={WALL_COLOR}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments geometry={wall.edges}>
            <lineBasicMaterial color={EDGE_COLOR} />
          </lineSegments>
        </group>
      ))}

      {/* Room point light */}
      <pointLight
        position={[width / 2, 1.5, depth / 2]}
        intensity={0.2}
        color="#00D4FF"
        distance={5}
        decay={2}
      />

      {/* Floating label */}
      <Text
        position={[width / 2, WALL_HEIGHT + 0.3, depth / 2]}
        fontSize={0.3}
        color="#00D4FF"
        anchorX="center"
        anchorY="middle"
        font="/fonts/IBMPlexMono-Medium.ttf"
        characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 áàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ"
      >
        {label}
      </Text>
    </group>
  );
}

interface OfficeRoomsProps {
  roomLabels: Record<string, string>;
}

export function OfficeRooms({ roomLabels }: OfficeRoomsProps) {
  return (
    <group>
      {defaultLayout.rooms.map((room) => (
        <Room
          key={room.labelKey}
          room={room}
          label={roomLabels[room.labelKey] ?? room.name}
        />
      ))}
    </group>
  );
}
