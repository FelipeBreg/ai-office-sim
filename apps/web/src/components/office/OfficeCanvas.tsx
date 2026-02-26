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
import type { AgentData } from './AgentLayer';
import type { AgentStatusMap } from './AgentLayer';
import { trpc } from '@/lib/trpc/client';

// ── Team → room mapping ──────────────────────────────────────────────
const TEAM_ROOM_MAP: Record<string, string> = {
  support: 'openWorkspace',
  operations: 'openWorkspace',
  finance: 'openWorkspace',
  sales: 'sales',
  marketing: 'marketing',
  development: 'dataLab',
  research: 'analysisRoom',
};

const DEFAULT_ROOM = 'openWorkspace';

// ── Archetype display names ──────────────────────────────────────────
const ARCHETYPE_LABELS: Record<string, string> = {
  support: 'Support',
  sales: 'Sales',
  marketing: 'Marketing',
  data_analyst: 'Data Analyst',
  content_writer: 'Content Writer',
  developer: 'Developer',
  project_manager: 'Project Manager',
  hr: 'HR',
  finance: 'Finance',
  email_campaign_manager: 'Email Campaign',
  research: 'Research',
  recruiter: 'Recruiter',
  social_media: 'Social Media',
  mercado_livre: 'Mercado Livre',
  inventory_monitor: 'Inventory',
  legal_research: 'Legal Research',
  ad_analyst: 'Ad Analyst',
  account_manager: 'Account Manager',
  deployment_monitor: 'Deployment',
  custom: 'Custom',
};

// ── Stable constants for R3F props (avoid new references per render) ──
const ORBIT_TARGET: [number, number, number] = [10, 0, 16];

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
  agentStatuses: AgentStatusMap;
  agents: AgentData[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  dataFlowAgents: DataFlowAgent[];
}

const Scene = memo(function Scene({
  roomLabels,
  agentStatuses,
  agents,
  selectedAgentId,
  onSelectAgent,
  dataFlowAgents,
}: SceneProps) {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={35}
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
        target={ORBIT_TARGET}
        enablePan
        panSpeed={0.8}
        screenSpacePanning={false}
      />

      <FloorCameraController />
      <OfficeLighting />
      <FloorSystem
        roomLabels={roomLabels}
        agentStatuses={agentStatuses}
        agents={agents}
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

  // Fetch real agents from DB
  const { data: rawAgents } = trpc.agents.list.useQuery();

  // Map agents to 3D scene data with team-based room assignments
  const { agents, rosterAgents, statusMap } = useMemo(() => {
    if (!rawAgents || rawAgents.length === 0) {
      return {
        agents: [] as AgentData[],
        rosterAgents: [] as { id: string; name: string; archetype: string }[],
        statusMap: new Map<string, AgentStatus>(),
      };
    }

    // Count agents per room to assign slot indices
    const roomSlotCounters: Record<string, number> = {};
    const agentDataList: AgentData[] = [];
    const rosterList: { id: string; name: string; archetype: string }[] = [];
    const sMap = new Map<string, AgentStatus>();

    for (const agent of rawAgents) {
      const roomKey = (agent.team ? TEAM_ROOM_MAP[agent.team] : null) ?? DEFAULT_ROOM;
      const slotIndex = roomSlotCounters[roomKey] ?? 0;
      roomSlotCounters[roomKey] = slotIndex + 1;

      agentDataList.push({
        id: agent.id,
        name: agent.name,
        roomKey,
        slotIndex,
      });

      rosterList.push({
        id: agent.id,
        name: agent.name,
        archetype: ARCHETYPE_LABELS[agent.archetype] ?? agent.archetype,
      });

      sMap.set(agent.id, (agent.status as AgentStatus) ?? 'idle');
    }

    return { agents: agentDataList, rosterAgents: rosterList, statusMap: sMap };
  }, [rawAgents]);

  const roomLabels = useMemo<Record<string, string>>(() => ({
    openWorkspace: t('openWorkspace'),
    meetingPod: t('meetingPod'),
    breakroom: t('breakroom'),
    serverRack: t('serverRack'),
    analysisRoom: t('analysisRoom'),
    dataLab: t('dataLab'),
    marketing: t('marketing'),
    sales: t('sales'),
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
      agents.map((agent) => ({
        id: agent.id,
        roomKey: agent.roomKey,
        slotIndex: agent.slotIndex,
        status: statusMap.get(agent.id) ?? 'idle',
      })),
    [agents, statusMap],
  );

  // Build inspected agent data for the panel
  const inspectedAgent: InspectedAgent | null = useMemo(() => {
    if (!selectedAgentId) return null;
    const roster = rosterAgents.find((a) => a.id === selectedAgentId);
    if (!roster) return null;

    const status: AgentStatus = statusMap.get(roster.id) ?? 'idle';
    return {
      id: roster.id,
      name: roster.name,
      archetype: roster.archetype,
      status,
    };
  }, [selectedAgentId, rosterAgents, statusMap]);

  // Current action labels per status
  const currentActions = useMemo<Partial<Record<AgentStatus, string>>>(() => ({
    working: 'Processing...',
    awaiting_approval: 'Awaiting approval',
    error: 'Connection error',
  }), []);

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
            agentStatuses={statusMap}
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleSelectAgent}
            dataFlowAgents={dataFlowAgents}
          />
        </Canvas>

        {/* DOM overlays — siblings to Canvas, absolute positioned */}
        <HeaderOverlay />
        <NavControls />
        <TeamRoster
          agents={rosterAgents}
          statuses={statusMap}
          currentActions={currentActions}
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
