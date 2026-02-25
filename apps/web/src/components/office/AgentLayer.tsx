'use client';

import { useMemo } from 'react';
import { AgentAvatar } from './AgentAvatar';
import type { AgentStatus } from './AgentAvatar';
import { getAgentPosition } from './AgentPositions';
import { useAgentStatuses } from './useAgentStatuses';

// ── Types ────────────────────────────────────────────────────────────
export interface AgentData {
  id: string;
  name: string;
  roomKey: string;
  slotIndex: number;
}

export interface AgentLayerProps {
  agents: AgentData[];
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
}

// ── Component ────────────────────────────────────────────────────────
export function AgentLayer({
  agents,
  selectedAgentId,
  onSelectAgent,
}: AgentLayerProps) {
  const agentIds = useMemo(() => agents.map((a) => a.id), [agents]);
  const statuses = useAgentStatuses(agentIds);

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
}
