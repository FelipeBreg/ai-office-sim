'use client';

import { OfficeFloor } from './OfficeFloor';
import { OfficeRooms } from './OfficeRooms';
import { OfficeLayout } from './OfficeLayout';
import { AgentLayer } from './AgentLayer';
import type { AgentData, AgentStatusMap } from './AgentLayer';
import { useLODLevel } from './LODWrapper';
import { FLOOR_CONFIGS } from './layouts/floors';

// ── Floor System ────────────────────────────────────────────────────────
interface FloorSystemProps {
  roomLabels: Record<string, string>;
  agentStatuses: AgentStatusMap;
  agents: AgentData[];
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
}

export function FloorSystem({ roomLabels, agentStatuses, agents, selectedAgentId, onSelectAgent }: FloorSystemProps) {
  const lodLevel = useLODLevel();
  const layout = FLOOR_CONFIGS[0]!.layout;

  return (
    <group>
      <OfficeFloor />
      <OfficeRooms roomLabels={roomLabels} layout={layout} />
      <OfficeLayout layout={layout} lodLevel={lodLevel} />
      {agents.length > 0 && (
        <AgentLayer
          agents={agents}
          statuses={agentStatuses}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
      )}
    </group>
  );
}
