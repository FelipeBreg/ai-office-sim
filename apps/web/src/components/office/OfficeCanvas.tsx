'use client';

import { memo, Suspense, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useTranslations } from 'next-intl';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OfficeLighting } from './OfficeLighting';
import { FloorSystem } from './FloorSystem';
import { FloorCameraController } from './FloorCameraController';
import { FloorSelector } from './FloorSelector';
import { AgentInspectPanel } from './AgentInspectPanel';
import type { InspectedAgent } from './AgentInspectPanel';
import { TeamRoster } from './TeamRoster';
import { DataFlowLayer } from './DataFlowLayer';
import type { DataFlowAgent } from './DataFlowLayer';
import { AmbientParticles } from './AmbientParticles';
import { PerformanceMonitor, DevStats } from './PerformanceMonitor';
import { HeaderOverlay } from './HeaderOverlay';
import { NavControls } from './NavControls';
import type { AgentStatus } from './AgentAvatar';
import { useAgentStatuses } from './useAgentStatuses';

// ── Extended agent data with archetype for inspection panel ──────────
interface MockAgentExtended {
  id: string;
  name: string;
  archetype: string;
}

// All known agents across all floors (for inspection panel lookup)
const ALL_MOCK_AGENTS: MockAgentExtended[] = [
  { id: 'agent-1', name: 'João Suporte', archetype: 'Support' },
  { id: 'agent-2', name: 'Maria Vendas', archetype: 'Sales' },
  { id: 'agent-3', name: 'André Análise', archetype: 'Data Analyst' },
  { id: 'agent-4', name: 'Lúcia Redação', archetype: 'Content Writer' },
];

// ── Mock current actions per status ──────────────────────────────────
const MOCK_CURRENT_ACTIONS: Partial<Record<AgentStatus, string>> = {
  working: 'Processando mensagem...',
  awaiting_approval: 'Aguardando aprovação para envio',
  error: 'Falha na conexão com API',
};

// ── Agent room/slot mapping for data flow visualization ──────────────
// Mirrors FLOOR_AGENTS in FloorSystem — needed to compute world positions
const AGENT_ROOM_MAP: Record<string, { roomKey: string; slotIndex: number }> = {
  'agent-1': { roomKey: 'openWorkspace', slotIndex: 0 },
  'agent-2': { roomKey: 'openWorkspace', slotIndex: 1 },
  'agent-3': { roomKey: 'openWorkspace', slotIndex: 3 },
  'agent-4': { roomKey: 'openWorkspace', slotIndex: 4 },
};

// ── Post-processing (memo'd to avoid heavy re-creation) ──────────────
const PostProcessing = memo(function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
});
PostProcessing.displayName = 'PostProcessing';

// ── Scene (inside r3f Canvas) ────────────────────────────────────────
interface SceneProps {
  roomLabels: Record<string, string>;
  agentStatuses: Map<string, AgentStatus>;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  dataFlowAgents: DataFlowAgent[];
}

const Scene = memo(function Scene({
  roomLabels,
  agentStatuses,
  selectedAgentId,
  onSelectAgent,
  dataFlowAgents,
}: SceneProps) {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={50}
        near={0.1}
        far={200}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minZoom={15}
        maxZoom={120}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        target={[9.5, 0, 4]}
        enablePan
        panSpeed={0.8}
        screenSpacePanning={false}
      />

      <FloorCameraController />
      <OfficeLighting />
      <FloorSystem
        roomLabels={roomLabels}
        agentStatuses={agentStatuses}
        selectedAgentId={selectedAgentId}
        onSelectAgent={onSelectAgent}
      />

      {/* Data flow particles: agent -> server room */}
      <DataFlowLayer agents={dataFlowAgents} />

      {/* Ambient background particle field */}
      <AmbientParticles />

      {/* Performance monitoring: FPS detection + dev stats overlay */}
      <PerformanceMonitor />
      <DevStats />

      {/* Post-processing: bloom for emissive glow */}
      <PostProcessing />
    </>
  );
});
Scene.displayName = 'Scene';

// ── OfficeCanvas ─────────────────────────────────────────────────────
export function OfficeCanvas() {
  const t = useTranslations('office');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Get live statuses for building inspected agent data
  const agentIds = useMemo(() => ALL_MOCK_AGENTS.map((a) => a.id), []);
  const statuses = useAgentStatuses(agentIds);

  const roomLabels = useMemo<Record<string, string>>(() => ({
    // Floor 1 — Operações
    openWorkspace: t('openWorkspace'),
    meetingPod: t('meetingPod'),
    breakroom: t('breakroom'),
    serverRack: t('serverRack'),
    // Floor 2 — Inteligência
    analysisRoom: t('analysisRoom'),
    dataLab: t('dataLab'),
    // Floor 3 — Comunicação
    marketing: t('marketing'),
    sales: t('sales'),
    // Basement — Servidores
    datacenter: t('datacenter'),
  }), [t]);

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId((prev) => (prev === agentId ? null : agentId));
  }, []);

  const handleDeselectAgent = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  // Build data flow agent list (agent positions + live statuses for particle flows)
  const dataFlowAgents: DataFlowAgent[] = useMemo(
    () =>
      ALL_MOCK_AGENTS.map((agent) => {
        const mapping = AGENT_ROOM_MAP[agent.id];
        return {
          id: agent.id,
          roomKey: mapping?.roomKey ?? 'openWorkspace',
          slotIndex: mapping?.slotIndex ?? 0,
          status: statuses.get(agent.id) ?? 'idle',
        };
      }),
    [statuses],
  );

  // Build inspected agent data for the panel
  const inspectedAgent: InspectedAgent | null = useMemo(() => {
    if (!selectedAgentId) return null;
    const agent = ALL_MOCK_AGENTS.find((a) => a.id === selectedAgentId);
    if (!agent) return null;

    const status: AgentStatus = statuses.get(agent.id) ?? 'idle';
    return {
      id: agent.id,
      name: agent.name,
      archetype: agent.archetype,
      status,
      currentAction: MOCK_CURRENT_ACTIONS[status],
    };
  }, [selectedAgentId, statuses]);

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
          <Scene
            roomLabels={roomLabels}
            agentStatuses={statuses}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleSelectAgent}
            dataFlowAgents={dataFlowAgents}
          />
        </Canvas>

        {/* DOM overlays — siblings to Canvas, absolute positioned */}
        <HeaderOverlay />
        <NavControls />
        <FloorSelector />
        <TeamRoster
          agents={ALL_MOCK_AGENTS}
          statuses={statuses}
          currentActions={MOCK_CURRENT_ACTIONS}
          onSelectAgent={handleSelectAgent}
        />
      </Suspense>

      {/* Agent Inspection Panel — DOM overlay, outside Canvas */}
      <AgentInspectPanel
        agent={inspectedAgent}
        onClose={handleDeselectAgent}
      />
    </div>
  );
}
