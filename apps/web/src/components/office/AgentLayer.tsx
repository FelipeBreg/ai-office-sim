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
}

// ── Component ────────────────────────────────────────────────────────
export function AgentLayer({ agents }: AgentLayerProps) {
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
            name={agent.name}
            status={status}
            position={position}
            animationOffset={index * 1.3}
          />
        );
      })}
    </group>
  );
}
