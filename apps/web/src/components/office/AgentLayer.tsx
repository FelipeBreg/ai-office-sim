'use client';

import { memo } from 'react';
import { AgentAvatar } from './AgentAvatar';
import type { AgentStatus } from './AgentAvatar';
import { getAgentPosition } from './AgentPositions';

// ── Types ────────────────────────────────────────────────────────────
export interface AgentData {
  id: string;
  name: string;
  roomKey: string;
  slotIndex: number;
}

export type AgentStatusMap = Map<string, AgentStatus>;

export interface AgentLayerProps {
  agents: AgentData[];
  statuses: AgentStatusMap;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
}

// ── Component ────────────────────────────────────────────────────────
export const AgentLayer = memo(function AgentLayer({
  agents,
  statuses,
  selectedAgentId,
  onSelectAgent,
}: AgentLayerProps) {
  return (
    <group>
      {agents.map((agent, index) => {
        const position = getAgentPosition(agent.roomKey, agent.slotIndex);
        const status: AgentStatus = statuses.get(agent.id) ?? 'idle';

        return (
          <AgentAvatar
            key={agent.id}
            agentId={agent.id}
            name={agent.name}
            status={status}
            position={position}
            animationOffset={index * 1.3}
            selected={selectedAgentId === agent.id}
            onSelect={onSelectAgent}
          />
        );
      })}
    </group>
  );
});
AgentLayer.displayName = 'AgentLayer';
