import TriggerNode from './TriggerNode';
import AgentNode from './AgentNode';
import ConditionNode from './ConditionNode';
import ApprovalNode from './ApprovalNode';
import DelayNode from './DelayNode';
import OutputNode from './OutputNode';

export const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  condition: ConditionNode,
  approval: ApprovalNode,
  delay: DelayNode,
  output: OutputNode,
};

export { TriggerNode, AgentNode, ConditionNode, ApprovalNode, DelayNode, OutputNode };
