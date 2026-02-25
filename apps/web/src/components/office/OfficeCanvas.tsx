'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useTranslations } from 'next-intl';
import { OfficeLighting } from './OfficeLighting';
import { OfficeFloor } from './OfficeFloor';
import { OfficeRooms } from './OfficeRooms';
import { OfficeLayout } from './OfficeLayout';
import { AgentLayer } from './AgentLayer';
import type { AgentData } from './AgentLayer';

// TODO: Replace with real agent data from tRPC query when API is wired
const MOCK_AGENTS: AgentData[] = [
  {
    id: 'agent-1',
    name: 'João Suporte',
    roomKey: 'openWorkspace',
    slotIndex: 0,
  },
  {
    id: 'agent-2',
    name: 'Maria Vendas',
    roomKey: 'openWorkspace',
    slotIndex: 1,
  },
  {
    id: 'agent-3',
    name: 'André Análise',
    roomKey: 'openWorkspace',
    slotIndex: 3,
  },
  {
    id: 'agent-4',
    name: 'Lúcia Redação',
    roomKey: 'openWorkspace',
    slotIndex: 4,
  },
];

function Scene({ roomLabels }: { roomLabels: Record<string, string> }) {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={50}
        near={0.1}
        far={100}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minZoom={20}
        maxZoom={120}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        target={[9.5, 0, 4]}
        enablePan
        panSpeed={0.8}
        screenSpacePanning={false}
      />

      <OfficeLighting />
      <OfficeFloor />
      <OfficeRooms roomLabels={roomLabels} />
      <OfficeLayout />
      <AgentLayer agents={MOCK_AGENTS} />
    </>
  );
}

export function OfficeCanvas() {
  const t = useTranslations('office');

  const roomLabels: Record<string, string> = {
    openWorkspace: t('openWorkspace'),
    meetingPod: t('meetingPod'),
    breakroom: t('breakroom'),
    serverRack: t('serverRack'),
  };

  return (
    <div className="relative h-full w-full" style={{ background: '#0A0E14' }}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-[#00C8E0]">
              {t('loading')}
            </span>
          </div>
        }
      >
        <Canvas
          gl={{
            antialias: true,
            toneMapping: ACESFilmicToneMapping,
            outputColorSpace: SRGBColorSpace,
          }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <Scene roomLabels={roomLabels} />
        </Canvas>
      </Suspense>
    </div>
  );
}
