'use client';

import { memo, useMemo } from 'react';
import { DataFlow } from './DataFlow';
import { getAgentPosition } from './AgentPositions';
import type { AgentStatus } from './AgentAvatar';

// ── Server room target (datacenter center on unified floor) ──────────
const SERVER_ROOM_POSITION: [number, number, number] = [6, 0, 29];

// ── Types ────────────────────────────────────────────────────────────
export interface DataFlowAgent {
  id: string;
  roomKey: string;
  slotIndex: number;
  status: AgentStatus;
}

export interface DataFlowLayerProps {
  agents: DataFlowAgent[];
}

// ── Statuses that trigger a data flow to the server room ─────────────
const ACTIVE_STATUSES: Set<AgentStatus> = new Set([
  'working',
  'awaiting_approval',
]);

// ── Component ────────────────────────────────────────────────────────
export const DataFlowLayer = memo(function DataFlowLayer({ agents }: DataFlowLayerProps) {
  // Compute flow sources and active states
  const flows = useMemo(
    () =>
      agents.map((agent) => ({
        id: agent.id,
        source: getAgentPosition(agent.roomKey, agent.slotIndex),
        active: ACTIVE_STATUSES.has(agent.status),
      })),
    [agents],
  );

  return (
    <group>
      {flows.map((flow) => (
        <DataFlow
          key={flow.id}
          source={flow.source}
          destination={SERVER_ROOM_POSITION}
          active={flow.active}
        />
      ))}
    </group>
  );
});
DataFlowLayer.displayName = 'DataFlowLayer';
