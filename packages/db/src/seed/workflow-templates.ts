/**
 * Seed data for 88 workflow templates (global — no projectId).
 * Templates 1–12: universal/generic. Templates 13–88: Brazilian department-specific.
 */
import { db } from '../client.js';
import { workflowTemplates } from '../schema/workflow-templates.js';

/* -------------------------------------------------------------------------- */
/*  Helper: generate positioned nodes & edges                                 */
/* -------------------------------------------------------------------------- */

let _nodeId = 0;
function nid() {
  return `node_${++_nodeId}`;
}

interface NodeSpec {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  data?: Record<string, unknown>;
}

function node(spec: NodeSpec) {
  return {
    id: spec.id,
    type: spec.type,
    position: { x: spec.x, y: spec.y },
    data: { label: spec.label, nodeType: spec.type, ...spec.data },
  };
}

function edge(source: string, target: string, label?: string) {
  return {
    id: `e_${source}_${target}`,
    source,
    target,
    ...(label ? { label } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*  Compact flow pattern helpers                                              */
/* -------------------------------------------------------------------------- */

type TD = Record<string, unknown>;

/** trigger → agent → output */
function f3(tt: string, tl: string, aa: string, al: string, ot: string, ol: string, td?: TD) {
  const [a, b, c] = [nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:al,x:0,y:120,data:{archetype:aa}}),node({id:c,type:'output',label:ol,x:0,y:240,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c)] };
}

/** trigger → agent → approval → output */
function f4a(tt: string, tl: string, aa: string, al: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d] = [nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:al,x:0,y:120,data:{archetype:aa}}),node({id:c,type:'approval',label:'Approval',x:0,y:240}),node({id:d,type:'output',label:ol,x:0,y:360,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d)] };
}

/** trigger → agent → condition(yes→output) [monitoring] */
function f4m(tt: string, tl: string, aa: string, al: string, cl: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d] = [nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:al,x:0,y:120,data:{archetype:aa}}),node({id:c,type:'condition',label:cl,x:0,y:240}),node({id:d,type:'output',label:ol,x:0,y:360,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d,'Yes')] };
}

/** trigger → agent1 → agent2 → output */
function f4p(tt: string, tl: string, a1: string, l1: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d] = [nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'agent',label:l2,x:0,y:240,data:{archetype:a2}}),node({id:d,type:'output',label:ol,x:0,y:360,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d)] };
}

/** trigger → agent → condition → approval → output */
function f5ca(tt: string, tl: string, aa: string, al: string, cl: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e] = [nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:al,x:0,y:120,data:{archetype:aa}}),node({id:c,type:'condition',label:cl,x:0,y:240}),node({id:d,type:'approval',label:'Approval',x:0,y:360}),node({id:e,type:'output',label:ol,x:0,y:480,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d,'Yes'),edge(d,e)] };
}

/** trigger → agent1 → approval → agent2 → output */
function f5aao(tt: string, tl: string, a1: string, l1: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e] = [nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'approval',label:'Approval',x:0,y:240}),node({id:d,type:'agent',label:l2,x:0,y:360,data:{archetype:a2}}),node({id:e,type:'output',label:ol,x:0,y:480,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e)] };
}

/** trigger → agent1 → agent2 → approval → output */
function f5pao(tt: string, tl: string, a1: string, l1: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e] = [nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'agent',label:l2,x:0,y:240,data:{archetype:a2}}),node({id:d,type:'approval',label:'Approval',x:0,y:360}),node({id:e,type:'output',label:ol,x:0,y:480,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e)] };
}

/** trigger → agent → delay → agent → output */
function f5ado(tt: string, tl: string, a1: string, l1: string, dl: string, dms: number, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e] = [nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'delay',label:dl,x:0,y:240,data:{delayMs:dms}}),node({id:d,type:'agent',label:l2,x:0,y:360,data:{archetype:a2}}),node({id:e,type:'output',label:ol,x:0,y:480,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e)] };
}

/** trigger → delay → agent → condition(yes→output) */
function f5dmc(tt: string, tl: string, dl: string, dms: number, aa: string, al: string, cl: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e] = [nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'delay',label:dl,x:0,y:120,data:{delayMs:dms}}),node({id:c,type:'agent',label:al,x:0,y:240,data:{archetype:aa}}),node({id:d,type:'condition',label:cl,x:0,y:360}),node({id:e,type:'output',label:ol,x:0,y:480,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e,'Yes')] };
}

/** trigger → delay → agent → approval → output */
function f5dao(tt: string, tl: string, dl: string, dms: number, aa: string, al: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e] = [nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'delay',label:dl,x:0,y:120,data:{delayMs:dms}}),node({id:c,type:'agent',label:al,x:0,y:240,data:{archetype:aa}}),node({id:d,type:'approval',label:'Approval',x:0,y:360}),node({id:e,type:'output',label:ol,x:0,y:480,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e)] };
}

/** trigger → agent → condition → [yes: agent2 → output | no: log] */
function f5cb(tt: string, tl: string, a1: string, l1: string, cl: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e, f] = [nid(), nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'condition',label:cl,x:0,y:240}),node({id:d,type:'agent',label:l2,x:-150,y:360,data:{archetype:a2}}),node({id:e,type:'output',label:ol,x:-150,y:480,data:{outputType:ot}}),node({id:f,type:'output',label:'Log',x:150,y:360,data:{outputType:'log'}})], edges: [edge(a,b),edge(b,c),edge(c,d,'Yes'),edge(d,e),edge(c,f,'No')] };
}

/** trigger → delay → agent → condition → agent → output (6 nodes) */
function f6dca(tt: string, tl: string, dl: string, dms: number, a1: string, l1: string, cl: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e, f] = [nid(), nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'delay',label:dl,x:0,y:120,data:{delayMs:dms}}),node({id:c,type:'agent',label:l1,x:0,y:240,data:{archetype:a1}}),node({id:d,type:'condition',label:cl,x:0,y:360}),node({id:e,type:'agent',label:l2,x:0,y:480,data:{archetype:a2}}),node({id:f,type:'output',label:ol,x:0,y:600,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e,'Yes'),edge(e,f)] };
}

/** trigger → agent → condition → agent → approval → output (6 nodes) */
function f6caa(tt: string, tl: string, a1: string, l1: string, cl: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e, f] = [nid(), nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'condition',label:cl,x:0,y:240}),node({id:d,type:'agent',label:l2,x:0,y:360,data:{archetype:a2}}),node({id:e,type:'approval',label:'Approval',x:0,y:480}),node({id:f,type:'output',label:ol,x:0,y:600,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d,'Yes'),edge(d,e),edge(e,f)] };
}

/** trigger → agent → delay → condition → agent → output (6 nodes) */
function f6adc(tt: string, tl: string, a1: string, l1: string, dl: string, dms: number, cl: string, a2: string, l2: string, ot: string, ol: string, td?: TD) {
  const [a, b, c, d, e, f] = [nid(), nid(), nid(), nid(), nid(), nid()];
  return { nodes: [node({id:a,type:'trigger',label:tl,x:0,y:0,data:{triggerType:tt,...td}}),node({id:b,type:'agent',label:l1,x:0,y:120,data:{archetype:a1}}),node({id:c,type:'delay',label:dl,x:0,y:240,data:{delayMs:dms}}),node({id:d,type:'condition',label:cl,x:0,y:360}),node({id:e,type:'agent',label:l2,x:0,y:480,data:{archetype:a2}}),node({id:f,type:'output',label:ol,x:0,y:600,data:{outputType:ot}})], edges: [edge(a,b),edge(b,c),edge(c,d),edge(d,e,'Yes'),edge(e,f)] };
}

/* -------------------------------------------------------------------------- */
/*  Template definitions                                                      */
/* -------------------------------------------------------------------------- */

function buildTemplates() {
  // Reset node counter for each build
  _nodeId = 0;

  // ── 1. Customer Inquiry Response ──────────────────────────────────────────
  const t1n1 = nid(), t1n2 = nid(), t1n3 = nid(), t1n4 = nid(), t1n5 = nid();
  const tpl1 = {
    nodes: [
      node({ id: t1n1, type: 'trigger', label: 'New Inquiry', x: 0, y: 0, data: { triggerType: 'event' } }),
      node({ id: t1n2, type: 'agent', label: 'Support Agent', x: 0, y: 120, data: { archetype: 'support' } }),
      node({ id: t1n3, type: 'condition', label: 'Is Urgent?', x: 0, y: 240 }),
      node({ id: t1n4, type: 'approval', label: 'Manager Approval', x: -150, y: 360 }),
      node({ id: t1n5, type: 'output', label: 'Send Response', x: 150, y: 360, data: { outputType: 'email' } }),
    ],
    edges: [
      edge(t1n1, t1n2),
      edge(t1n2, t1n3),
      edge(t1n3, t1n4, 'Yes'),
      edge(t1n3, t1n5, 'No'),
    ],
  };

  // ── 2. Lead Qualification Pipeline ────────────────────────────────────────
  const t2n1 = nid(), t2n2 = nid(), t2n3 = nid(), t2n4 = nid(), t2n5 = nid();
  const tpl2 = {
    nodes: [
      node({ id: t2n1, type: 'trigger', label: 'New Lead', x: 0, y: 0, data: { triggerType: 'webhook' } }),
      node({ id: t2n2, type: 'agent', label: 'Sales Agent', x: 0, y: 120, data: { archetype: 'sales' } }),
      node({ id: t2n3, type: 'condition', label: 'Qualified?', x: 0, y: 240 }),
      node({ id: t2n4, type: 'agent', label: 'Create Deal', x: -150, y: 360, data: { archetype: 'sales' } }),
      node({ id: t2n5, type: 'output', label: 'Log Unqualified', x: 150, y: 360, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t2n1, t2n2),
      edge(t2n2, t2n3),
      edge(t2n3, t2n4, 'Yes'),
      edge(t2n3, t2n5, 'No'),
    ],
  };

  // ── 3. Daily Summary Report ───────────────────────────────────────────────
  const t3n1 = nid(), t3n2 = nid(), t3n3 = nid();
  const tpl3 = {
    nodes: [
      node({ id: t3n1, type: 'trigger', label: 'Daily Schedule', x: 0, y: 0, data: { triggerType: 'scheduled', cron: '0 9 * * 1-5' } }),
      node({ id: t3n2, type: 'agent', label: 'Data Analyst', x: 0, y: 120, data: { archetype: 'data_analyst' } }),
      node({ id: t3n3, type: 'output', label: 'Send Email Report', x: 0, y: 240, data: { outputType: 'email' } }),
    ],
    edges: [
      edge(t3n1, t3n2),
      edge(t3n2, t3n3),
    ],
  };

  // ── 4. Content Review & Approval ──────────────────────────────────────────
  const t4n1 = nid(), t4n2 = nid(), t4n3 = nid(), t4n4 = nid();
  const tpl4 = {
    nodes: [
      node({ id: t4n1, type: 'trigger', label: 'Manual Trigger', x: 0, y: 0, data: { triggerType: 'manual' } }),
      node({ id: t4n2, type: 'agent', label: 'Content Writer', x: 0, y: 120, data: { archetype: 'content_writer' } }),
      node({ id: t4n3, type: 'approval', label: 'Review & Approve', x: 0, y: 240 }),
      node({ id: t4n4, type: 'output', label: 'Publish Content', x: 0, y: 360, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t4n1, t4n2),
      edge(t4n2, t4n3),
      edge(t4n3, t4n4),
    ],
  };

  // ── 5. Task Escalation ────────────────────────────────────────────────────
  const t5n1 = nid(), t5n2 = nid(), t5n3 = nid(), t5n4 = nid();
  const tpl5 = {
    nodes: [
      node({ id: t5n1, type: 'trigger', label: 'Task Event', x: 0, y: 0, data: { triggerType: 'event' } }),
      node({ id: t5n2, type: 'condition', label: 'Is Critical?', x: 0, y: 120 }),
      node({ id: t5n3, type: 'agent', label: 'Project Manager', x: -150, y: 240, data: { archetype: 'project_manager' } }),
      node({ id: t5n4, type: 'output', label: 'Log & Notify', x: 150, y: 240, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t5n1, t5n2),
      edge(t5n2, t5n3, 'Yes'),
      edge(t5n2, t5n4, 'No'),
    ],
  };

  // ── 6. Campaign Launch Pipeline ───────────────────────────────────────────
  const t6n1 = nid(), t6n2 = nid(), t6n3 = nid(), t6n4 = nid(), t6n5 = nid(), t6n6 = nid();
  const tpl6 = {
    nodes: [
      node({ id: t6n1, type: 'trigger', label: 'Launch Campaign', x: 0, y: 0, data: { triggerType: 'manual' } }),
      node({ id: t6n2, type: 'agent', label: 'Marketing Agent', x: 0, y: 120, data: { archetype: 'marketing' } }),
      node({ id: t6n3, type: 'approval', label: 'Approve Brief', x: 0, y: 240 }),
      node({ id: t6n4, type: 'agent', label: 'Content Writer', x: 0, y: 360, data: { archetype: 'content_writer' } }),
      node({ id: t6n5, type: 'agent', label: 'Social Media Agent', x: 0, y: 480, data: { archetype: 'social_media' } }),
      node({ id: t6n6, type: 'output', label: 'Campaign Launched', x: 0, y: 600, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t6n1, t6n2),
      edge(t6n2, t6n3),
      edge(t6n3, t6n4),
      edge(t6n4, t6n5),
      edge(t6n5, t6n6),
    ],
  };

  // ── 7. Social Media Monitor ───────────────────────────────────────────────
  const t7n1 = nid(), t7n2 = nid(), t7n3 = nid(), t7n4 = nid(), t7n5 = nid();
  const tpl7 = {
    nodes: [
      node({ id: t7n1, type: 'trigger', label: 'Hourly Check', x: 0, y: 0, data: { triggerType: 'scheduled', cron: '0 * * * *' } }),
      node({ id: t7n2, type: 'agent', label: 'Social Media Agent', x: 0, y: 120, data: { archetype: 'social_media' } }),
      node({ id: t7n3, type: 'condition', label: 'Negative Sentiment?', x: 0, y: 240 }),
      node({ id: t7n4, type: 'agent', label: 'Support Agent', x: -150, y: 360, data: { archetype: 'support' } }),
      node({ id: t7n5, type: 'output', label: 'Log Report', x: 150, y: 360, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t7n1, t7n2),
      edge(t7n2, t7n3),
      edge(t7n3, t7n4, 'Yes'),
      edge(t7n3, t7n5, 'No'),
    ],
  };

  // ── 8. Order Follow-up ────────────────────────────────────────────────────
  const t8n1 = nid(), t8n2 = nid(), t8n3 = nid(), t8n4 = nid();
  const tpl8 = {
    nodes: [
      node({ id: t8n1, type: 'trigger', label: 'Order Completed', x: 0, y: 0, data: { triggerType: 'event' } }),
      node({ id: t8n2, type: 'delay', label: 'Wait 3 Days', x: 0, y: 120, data: { delayMs: 259200000 } }),
      node({ id: t8n3, type: 'agent', label: 'Support Agent', x: 0, y: 240, data: { archetype: 'support' } }),
      node({ id: t8n4, type: 'output', label: 'Send WhatsApp', x: 0, y: 360, data: { outputType: 'whatsapp' } }),
    ],
    edges: [
      edge(t8n1, t8n2),
      edge(t8n2, t8n3),
      edge(t8n3, t8n4),
    ],
  };

  // ── 9. Inventory Alert ────────────────────────────────────────────────────
  const t9n1 = nid(), t9n2 = nid(), t9n3 = nid(), t9n4 = nid();
  const tpl9 = {
    nodes: [
      node({ id: t9n1, type: 'trigger', label: 'Daily Stock Check', x: 0, y: 0, data: { triggerType: 'scheduled', cron: '0 8 * * *' } }),
      node({ id: t9n2, type: 'agent', label: 'Inventory Monitor', x: 0, y: 120, data: { archetype: 'data_analyst' } }),
      node({ id: t9n3, type: 'condition', label: 'Low Stock?', x: 0, y: 240 }),
      node({ id: t9n4, type: 'output', label: 'Alert Email', x: 0, y: 360, data: { outputType: 'email' } }),
    ],
    edges: [
      edge(t9n1, t9n2),
      edge(t9n2, t9n3),
      edge(t9n3, t9n4, 'Yes'),
    ],
  };

  // ── 10. User Onboarding Drip ──────────────────────────────────────────────
  const t10n1 = nid(), t10n2 = nid(), t10n3 = nid(), t10n4 = nid(), t10n5 = nid(), t10n6 = nid();
  const tpl10 = {
    nodes: [
      node({ id: t10n1, type: 'trigger', label: 'User Signed Up', x: 0, y: 0, data: { triggerType: 'webhook' } }),
      node({ id: t10n2, type: 'agent', label: 'Welcome Email', x: 0, y: 120, data: { archetype: 'marketing' } }),
      node({ id: t10n3, type: 'delay', label: 'Wait 1 Day', x: 0, y: 240, data: { delayMs: 86400000 } }),
      node({ id: t10n4, type: 'agent', label: 'Tips Email', x: 0, y: 360, data: { archetype: 'marketing' } }),
      node({ id: t10n5, type: 'delay', label: 'Wait 3 Days', x: 0, y: 480, data: { delayMs: 259200000 } }),
      node({ id: t10n6, type: 'agent', label: 'Account Manager', x: 0, y: 600, data: { archetype: 'account_manager' } }),
    ],
    edges: [
      edge(t10n1, t10n2),
      edge(t10n2, t10n3),
      edge(t10n3, t10n4),
      edge(t10n4, t10n5),
      edge(t10n5, t10n6),
    ],
  };

  // ── 11. Churn Prevention ──────────────────────────────────────────────────
  const t11n1 = nid(), t11n2 = nid(), t11n3 = nid(), t11n4 = nid(), t11n5 = nid();
  const tpl11 = {
    nodes: [
      node({ id: t11n1, type: 'trigger', label: 'Weekly Analysis', x: 0, y: 0, data: { triggerType: 'scheduled', cron: '0 9 * * 1' } }),
      node({ id: t11n2, type: 'agent', label: 'Data Analyst', x: 0, y: 120, data: { archetype: 'data_analyst' } }),
      node({ id: t11n3, type: 'condition', label: 'At Risk?', x: 0, y: 240 }),
      node({ id: t11n4, type: 'agent', label: 'Account Manager', x: -150, y: 360, data: { archetype: 'account_manager' } }),
      node({ id: t11n5, type: 'output', label: 'Log Healthy', x: 150, y: 360, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t11n1, t11n2),
      edge(t11n2, t11n3),
      edge(t11n3, t11n4, 'Yes'),
      edge(t11n3, t11n5, 'No'),
    ],
  };

  // ── 12. Invoice Processing ────────────────────────────────────────────────
  const t12n1 = nid(), t12n2 = nid(), t12n3 = nid(), t12n4 = nid();
  const tpl12 = {
    nodes: [
      node({ id: t12n1, type: 'trigger', label: 'Invoice Received', x: 0, y: 0, data: { triggerType: 'event' } }),
      node({ id: t12n2, type: 'agent', label: 'Finance Agent', x: 0, y: 120, data: { archetype: 'finance' } }),
      node({ id: t12n3, type: 'approval', label: 'CFO Approval', x: 0, y: 240 }),
      node({ id: t12n4, type: 'output', label: 'Log Payment', x: 0, y: 360, data: { outputType: 'log' } }),
    ],
    edges: [
      edge(t12n1, t12n2),
      edge(t12n2, t12n3),
      edge(t12n3, t12n4),
    ],
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Templates 13–88: Brazilian Department-Specific Workflows
  // ══════════════════════════════════════════════════════════════════════════

  // ── JURÍDICO (7) ──────────────────────────────────────────────────────────
  const tpl13 = f3('event', 'New Contract', 'legal_research', 'Legal Agent', 'document', 'Analysis Report');
  const tpl14 = f5ca('scheduled', 'Weekly Check', 'custom', 'Compliance Agent', 'Violation Found?', 'email', 'Compliance Alert', { cron: '0 9 * * 1' });
  const tpl15 = f4a('manual', 'New Request', 'legal_research', 'Legal Agent', 'document', 'Power of Attorney');
  const tpl16 = f5pao('manual', 'Start DD', 'legal_research', 'Legal Agent', 'finance', 'Financial Review', 'document', 'DD Report');
  const tpl17 = f5ca('event', 'New Case', 'legal_research', 'Legal Agent', 'Settlement?', 'log', 'Case Log');
  const tpl18 = f4m('scheduled', 'Monthly IP Check', 'legal_research', 'IP Monitor', 'Expiring?', 'email', 'IP Alert', { cron: '0 9 1 * *' });
  const tpl19 = f5aao('event', 'Data Request', 'custom', 'LGPD Agent', 'legal_research', 'Legal Documentation', 'document', 'LGPD Report');

  // ── TRIBUTÁRIO (8) ────────────────────────────────────────────────────────
  const tpl20 = f3('scheduled', 'Monthly Calc', 'finance', 'Tax Agent', 'document', 'Tax Report', { cron: '0 9 1 * *' });
  const tpl21 = f4a('scheduled', 'Monthly Filing', 'finance', 'Tax Agent', 'log', 'Filing Log', { cron: '0 9 5 * *' });
  const tpl22 = f4p('scheduled', 'Quarterly Review', 'finance', 'Tax Planner', 'data_analyst', 'Tax Analyst', 'document', 'Tax Plan', { cron: '0 9 1 1,4,7,10 *' });
  const tpl23 = f4a('manual', 'Credit Request', 'finance', 'Tax Agent', 'document', 'Credit Report');
  const tpl24 = f3('event', 'New Invoice', 'finance', 'Invoicing Agent', 'document', 'NF-e');
  const tpl25 = f4m('scheduled', 'Daily Deadline Check', 'finance', 'Tax Calendar', 'Deadline Near?', 'email', 'Deadline Alert', { cron: '0 8 * * 1-5' });
  const tpl26 = f3('scheduled', 'Monthly ICMS', 'finance', 'ICMS Agent', 'document', 'ICMS Report', { cron: '0 9 1 * *' });
  const tpl27 = f4a('event', 'Payment Event', 'finance', 'Withholding Agent', 'document', 'Withholding Report');

  // ── CONTABILIDADE (7) ─────────────────────────────────────────────────────
  const tpl28 = f5aao('scheduled', 'Month End', 'finance', 'Accountant', 'finance', 'Reviewer', 'document', 'Closing Report', { cron: '0 9 28 * *' });
  const tpl29 = f4m('scheduled', 'Daily Reconciliation', 'finance', 'Reconciliation Agent', 'Discrepancy?', 'email', 'Discrepancy Alert', { cron: '0 7 * * 1-5' });
  const tpl30 = f3('scheduled', 'Monthly Close', 'finance', 'Accountant', 'document', 'Trial Balance', { cron: '0 9 5 * *' });
  const tpl31 = f4p('scheduled', 'Monthly DRE', 'finance', 'Accountant', 'data_analyst', 'Controller', 'document', 'Income Statement', { cron: '0 9 10 * *' });
  const tpl32 = f3('scheduled', 'Quarterly Balance', 'finance', 'Accountant', 'document', 'Balance Sheet', { cron: '0 9 1 1,4,7,10 *' });
  const tpl33 = f4a('event', 'Asset Event', 'finance', 'Asset Manager', 'document', 'Asset Record');
  const tpl34 = f4p('scheduled', 'Monthly Costs', 'finance', 'Cost Analyst', 'data_analyst', 'Controller', 'email', 'Cost Report', { cron: '0 9 10 * *' });

  // ── RH (9) ────────────────────────────────────────────────────────────────
  const tpl35 = f5ca('event', 'New Application', 'hr', 'Recruiter', 'Qualified?', 'email', 'Interview Invite');
  const tpl36 = f5ado('event', 'New Employee', 'hr', 'HR Agent', 'Wait 1 Day', 86400000, 'hr', 'Training Agent', 'email', 'Welcome Kit');
  const tpl37 = f4a('scheduled', 'Monthly Payroll', 'finance', 'Payroll Agent', 'document', 'Payroll Report', { cron: '0 9 20 * *' });
  const tpl38 = f4a('scheduled', 'Quarterly Review', 'hr', 'HR Agent', 'document', 'Performance Report', { cron: '0 9 1 1,4,7,10 *' });
  const tpl39 = f3('manual', 'Training Request', 'hr', 'Training Agent', 'document', 'Training Plan');
  const tpl40 = f4m('scheduled', 'Monthly Benefits', 'hr', 'Benefits Agent', 'Changes Needed?', 'email', 'Benefits Alert', { cron: '0 9 1 * *' });
  const tpl41 = f4a('event', 'Leave Request', 'hr', 'Leave Manager', 'log', 'Leave Approved');
  const tpl42 = f4m('scheduled', 'Daily Time Check', 'hr', 'Time Tracking', 'Anomaly?', 'email', 'Time Alert', { cron: '0 18 * * 1-5' });
  const tpl43 = f4p('scheduled', 'Quarterly Survey', 'hr', 'Survey Agent', 'data_analyst', 'Analyst', 'email', 'Engagement Report', { cron: '0 9 1 1,4,7,10 *' });

  // ── VENDAS (6) ────────────────────────────────────────────────────────────
  const tpl44 = f4p('manual', 'Start Prospecting', 'sales', 'Prospector', 'sales', 'Enrichment Agent', 'log', 'Lead List');
  const tpl45 = f5cb('event', 'New Lead', 'sales', 'Qualifier', 'Score > 70?', 'sales', 'CRM Agent', 'log', 'Deal Created');
  const tpl46 = f4a('manual', 'Proposal Request', 'sales', 'Proposal Writer', 'document', 'Sales Proposal');
  const tpl47 = f4a('event', 'Deal Won', 'sales', 'Contract Manager', 'document', 'Contract');
  const tpl48 = f5dmc('event', 'Deal Stalled', 'Wait 2 Days', 172800000, 'sales', 'Follow-up Agent', 'Response?', 'log', 'Follow-up Log');
  const tpl49 = f6dca('event', 'Sale Closed', 'Wait 7 Days', 604800000, 'support', 'CS Agent', 'Issue?', 'support', 'Resolver', 'log', 'Post-Sale Log');

  // ── MARKETING (8) ─────────────────────────────────────────────────────────
  const tpl50 = f4a('manual', 'Brand Request', 'marketing', 'Branding Agent', 'document', 'Brand Guidelines');
  const tpl51 = f4m('scheduled', 'Daily Analytics', 'data_analyst', 'Analytics Agent', 'Anomaly?', 'email', 'Analytics Alert', { cron: '0 9 * * 1-5' });
  const tpl52 = f5aao('scheduled', 'Daily Schedule', 'social_media', 'Content Creator', 'social_media', 'Publisher', 'log', 'Published', { cron: '0 8 * * 1-5' });
  const tpl53 = f5aao('scheduled', 'Weekly Plan', 'content_writer', 'Writer', 'content_writer', 'SEO Editor', 'log', 'Published', { cron: '0 9 * * 1' });
  const tpl54 = f4m('scheduled', 'Daily Ad Check', 'ad_analyst', 'Ads Agent', 'ROAS Low?', 'email', 'Ad Alert', { cron: '0 9 * * 1-5' });
  const tpl55 = f4p('scheduled', 'Weekly SEO', 'research', 'SEO Agent', 'content_writer', 'Implementer', 'log', 'SEO Updated', { cron: '0 9 * * 1' });
  const tpl56 = f5aao('manual', 'New Campaign', 'email_campaign_manager', 'Email Agent', 'email_campaign_manager', 'Automation', 'log', 'Campaign Sent');
  const tpl57 = f4m('scheduled', 'Weekly CRO', 'data_analyst', 'CRO Agent', 'Conversion Drop?', 'email', 'CRO Alert', { cron: '0 9 * * 1' });

  // ── OPERAÇÕES (6) ─────────────────────────────────────────────────────────
  const tpl58 = f4a('manual', 'Purchase Request', 'custom', 'Procurement Agent', 'document', 'Purchase Order');
  const tpl59 = f4m('scheduled', 'Daily Stock', 'inventory_monitor', 'Stock Agent', 'Reorder Point?', 'email', 'Reorder Alert', { cron: '0 8 * * 1-5' });
  const tpl60 = f4m('event', 'Shipment Created', 'custom', 'Logistics Agent', 'Delayed?', 'email', 'Delay Alert');
  const tpl61 = f5ca('scheduled', 'Weekly QA', 'custom', 'Quality Agent', 'Non-conformity?', 'document', 'QA Report', { cron: '0 9 * * 1' });
  const tpl62 = f4p('manual', 'Start Analysis', 'project_manager', 'Process Analyst', 'data_analyst', 'BI Agent', 'document', 'Process Report');
  const tpl63 = f4m('scheduled', 'Daily BI', 'data_analyst', 'BI Agent', 'KPI Alert?', 'email', 'KPI Report', { cron: '0 9 * * 1-5' });

  // ── ATENDIMENTO (5) ───────────────────────────────────────────────────────
  const tpl64 = f6caa('event', 'New Ticket', 'support', 'Classifier', 'Complex?', 'support', 'Resolver', 'email', 'Response Sent');
  const tpl65 = f4m('scheduled', 'Hourly SLA Check', 'support', 'SLA Engine', 'Breach Imminent?', 'email', 'SLA Alert', { cron: '0 * * * *' });
  const tpl66 = f5cb('event', 'Ticket Created', 'support', 'Support Agent', 'Resolved?', 'project_manager', 'Escalation', 'log', 'Ticket Closed');
  const tpl67 = f4m('event', 'Escalation Triggered', 'support', 'Escalation Agent', 'Tier 2+?', 'log', 'Escalation Log');
  const tpl68 = f5dao('event', 'Interaction Ended', 'Wait 24h', 86400000, 'support', 'CX Agent', 'email', 'Survey Sent');

  // ── TI (5) ────────────────────────────────────────────────────────────────
  const tpl69 = f4m('scheduled', '5-min Health Check', 'deployment_monitor', 'Infra Monitor', 'Unhealthy?', 'email', 'Infra Alert', { cron: '*/5 * * * *' });
  const tpl70 = f4m('scheduled', 'Daily Security Scan', 'custom', 'Security Agent', 'Critical Vuln?', 'email', 'Security Alert', { cron: '0 6 * * *' });
  const tpl71 = f4a('event', 'Data Subject Request', 'custom', 'LGPD Agent', 'document', 'LGPD Response');
  const tpl72 = f5aao('event', 'PR Created', 'developer', 'Code Reviewer', 'deployment_monitor', 'Release Agent', 'log', 'Released');
  const tpl73 = f5ca('event', 'Push Event', 'deployment_monitor', 'DevOps Agent', 'Tests Pass?', 'log', 'Deployed');

  // ── COMPLIANCE (5) ────────────────────────────────────────────────────────
  const tpl74 = f4m('scheduled', 'Daily Regulatory Check', 'custom', 'Compliance Agent', 'New Regulation?', 'email', 'Regulation Alert', { cron: '0 9 * * 1-5' });
  const tpl75 = f5aao('manual', 'Audit Start', 'custom', 'Audit Agent', 'project_manager', 'Audit Tracker', 'document', 'Audit Report');
  const tpl76 = f4p('scheduled', 'Quarterly Risk', 'custom', 'Risk Agent', 'data_analyst', 'Risk Dashboard', 'email', 'Risk Report', { cron: '0 9 1 1,4,7,10 *' });
  const tpl77 = f3('scheduled', 'Monthly Check', 'custom', 'Controls Agent', 'document', 'Controls Report', { cron: '0 9 1 * *' });
  const tpl78 = f5aao('manual', 'Investigation Start', 'custom', 'Compliance DD', 'project_manager', 'Investigation', 'log', 'Investigation Log');

  // ── TESOURARIA (5) ────────────────────────────────────────────────────────
  const tpl79 = f4m('scheduled', 'Daily Cash Position', 'finance', 'Treasury Agent', 'Below Minimum?', 'email', 'Cash Alert', { cron: '0 8 * * 1-5' });
  const tpl80 = f4a('event', 'Payment Due', 'finance', 'Collections Agent', 'log', 'Collection Sent');
  const tpl81 = f3('manual', 'Credit Request', 'finance', 'Credit Agent', 'document', 'Credit Report');
  const tpl82 = f4m('scheduled', 'Daily Investments', 'finance', 'Investment Agent', 'Maturity Near?', 'email', 'Investment Alert', { cron: '0 9 * * 1-5' });
  const tpl83 = f6adc('event', 'Invoice Overdue', 'finance', 'Collections Agent', 'Wait 7 Days', 604800000, 'Paid?', 'project_manager', 'Escalation', 'log', 'Collections Log');

  // ── PLANEJAMENTO (5) ──────────────────────────────────────────────────────
  const tpl84 = f3('scheduled', 'Weekly OKR Check', 'data_analyst', 'Planning Agent', 'document', 'OKR Report', { cron: '0 9 * * 1' });
  const tpl85 = f4p('scheduled', 'Monthly BSC', 'data_analyst', 'BSC Agent', 'data_analyst', 'Dashboard Agent', 'email', 'BSC Report', { cron: '0 9 1 * *' });
  const tpl86 = f3('manual', 'SWOT Request', 'data_analyst', 'Planning Agent', 'document', 'SWOT Report');
  const tpl87 = f5aao('manual', 'Annual Planning', 'data_analyst', 'Planning Agent', 'project_manager', 'Plan Reviewer', 'document', 'Annual Plan');
  const tpl88 = f3('scheduled', 'Monthly Board Prep', 'data_analyst', 'Planning Agent', 'document', 'Board Package', { cron: '0 9 25 * *' });

  return [
    { slug: 'customer-inquiry-response', nameEn: 'Customer Inquiry Response', namePtBr: 'Resposta a Consulta do Cliente', descriptionEn: 'Automatically route and respond to incoming customer inquiries with urgency detection.', descriptionPtBr: 'Roteie e responda automaticamente a consultas de clientes com detecção de urgência.', category: 'universal', icon: 'headphones', nodeCount: tpl1.nodes.length, definition: tpl1, sortOrder: 1 },
    { slug: 'lead-qualification-pipeline', nameEn: 'Lead Qualification Pipeline', namePtBr: 'Pipeline de Qualificação de Leads', descriptionEn: 'Score incoming leads and automatically create deals for qualified prospects.', descriptionPtBr: 'Pontue leads recebidos e crie negócios automaticamente para prospects qualificados.', category: 'universal', icon: 'filter', nodeCount: tpl2.nodes.length, definition: tpl2, sortOrder: 2 },
    { slug: 'daily-summary-report', nameEn: 'Daily Summary Report', namePtBr: 'Relatório Diário Resumido', descriptionEn: 'Generate and email a daily business metrics summary every morning.', descriptionPtBr: 'Gere e envie por e-mail um resumo diário de métricas de negócio toda manhã.', category: 'universal', icon: 'bar-chart-2', nodeCount: tpl3.nodes.length, definition: tpl3, sortOrder: 3 },
    { slug: 'content-review-approval', nameEn: 'Content Review & Approval', namePtBr: 'Revisão e Aprovação de Conteúdo', descriptionEn: 'Draft content with AI and route it through human approval before publishing.', descriptionPtBr: 'Crie conteúdo com IA e envie para aprovação humana antes de publicar.', category: 'universal', icon: 'file-check', nodeCount: tpl4.nodes.length, definition: tpl4, sortOrder: 4 },
    { slug: 'task-escalation', nameEn: 'Task Escalation', namePtBr: 'Escalonamento de Tarefas', descriptionEn: 'Detect critical tasks and automatically escalate to a project manager.', descriptionPtBr: 'Detecte tarefas críticas e escalone automaticamente para o gerente de projeto.', category: 'universal', icon: 'alert-triangle', nodeCount: tpl5.nodes.length, definition: tpl5, sortOrder: 5 },
    { slug: 'campaign-launch-pipeline', nameEn: 'Campaign Launch Pipeline', namePtBr: 'Pipeline de Lançamento de Campanha', descriptionEn: 'Coordinate marketing brief, content creation, and social media distribution.', descriptionPtBr: 'Coordene briefing de marketing, criação de conteúdo e distribuição em redes sociais.', category: 'marketing', icon: 'megaphone', nodeCount: tpl6.nodes.length, definition: tpl6, sortOrder: 6 },
    { slug: 'social-media-monitor', nameEn: 'Social Media Monitor', namePtBr: 'Monitor de Redes Sociais', descriptionEn: 'Monitor social media sentiment and alert support on negative mentions.', descriptionPtBr: 'Monitore sentimento em redes sociais e alerte o suporte sobre menções negativas.', category: 'marketing', icon: 'eye', nodeCount: tpl7.nodes.length, definition: tpl7, sortOrder: 7 },
    { slug: 'order-follow-up', nameEn: 'Order Follow-up', namePtBr: 'Follow-up de Pedido', descriptionEn: 'Send a satisfaction check via WhatsApp 3 days after order completion.', descriptionPtBr: 'Envie uma verificação de satisfação via WhatsApp 3 dias após a conclusão do pedido.', category: 'ecommerce', icon: 'package', nodeCount: tpl8.nodes.length, definition: tpl8, sortOrder: 8 },
    { slug: 'inventory-alert', nameEn: 'Inventory Alert', namePtBr: 'Alerta de Estoque', descriptionEn: 'Daily stock check with automated email alerts when inventory runs low.', descriptionPtBr: 'Verificação diária de estoque com alertas por e-mail quando o inventário estiver baixo.', category: 'ecommerce', icon: 'archive', nodeCount: tpl9.nodes.length, definition: tpl9, sortOrder: 9 },
    { slug: 'user-onboarding-drip', nameEn: 'User Onboarding Drip', namePtBr: 'Drip de Onboarding de Usuário', descriptionEn: 'Welcome new users with a timed email sequence and personal outreach.', descriptionPtBr: 'Receba novos usuários com uma sequência de e-mails programada e contato pessoal.', category: 'saas', icon: 'user-plus', nodeCount: tpl10.nodes.length, definition: tpl10, sortOrder: 10 },
    { slug: 'churn-prevention', nameEn: 'Churn Prevention', namePtBr: 'Prevenção de Churn', descriptionEn: 'Analyze usage data weekly and proactively engage at-risk customers.', descriptionPtBr: 'Analise dados de uso semanalmente e engaje proativamente clientes em risco.', category: 'saas', icon: 'shield', nodeCount: tpl11.nodes.length, definition: tpl11, sortOrder: 11 },
    { slug: 'invoice-processing', nameEn: 'Invoice Processing', namePtBr: 'Processamento de Faturas', descriptionEn: 'Extract invoice data, validate with AI, and route for financial approval.', descriptionPtBr: 'Extraia dados de faturas, valide com IA e envie para aprovação financeira.', category: 'finance', icon: 'receipt', nodeCount: tpl12.nodes.length, definition: tpl12, sortOrder: 12 },
    // ── JURÍDICO ──
    { slug: 'analise-contratos', nameEn: 'Contract Analysis', namePtBr: 'Análise de Contratos', descriptionEn: 'AI-powered legal review of new contracts.', descriptionPtBr: 'Revisão jurídica de novos contratos com IA.', category: 'juridico', icon: 'file-text', nodeCount: tpl13.nodes.length, definition: tpl13, sortOrder: 13 },
    { slug: 'compliance-regulatorio', nameEn: 'Regulatory Compliance', namePtBr: 'Compliance Regulatório', descriptionEn: 'Weekly regulatory compliance checks with violation alerts.', descriptionPtBr: 'Verificações semanais de compliance regulatório com alertas de violação.', category: 'juridico', icon: 'shield-check', nodeCount: tpl14.nodes.length, definition: tpl14, sortOrder: 14 },
    { slug: 'gestao-procuracao', nameEn: 'Power of Attorney Mgmt', namePtBr: 'Gestão de Procurações', descriptionEn: 'Draft and approve powers of attorney with legal review.', descriptionPtBr: 'Elabore e aprove procurações com revisão jurídica.', category: 'juridico', icon: 'stamp', nodeCount: tpl15.nodes.length, definition: tpl15, sortOrder: 15 },
    { slug: 'due-diligence', nameEn: 'Legal Due Diligence', namePtBr: 'Due Diligence Jurídica', descriptionEn: 'Combined legal and financial due diligence with approval.', descriptionPtBr: 'Due diligence jurídica e financeira combinada com aprovação.', category: 'juridico', icon: 'search', nodeCount: tpl16.nodes.length, definition: tpl16, sortOrder: 16 },
    { slug: 'contencioso', nameEn: 'Litigation Management', namePtBr: 'Gestão de Contencioso', descriptionEn: 'Track litigation cases with settlement analysis.', descriptionPtBr: 'Acompanhe processos judiciais com análise de acordos.', category: 'juridico', icon: 'gavel', nodeCount: tpl17.nodes.length, definition: tpl17, sortOrder: 17 },
    { slug: 'propriedade-intelectual', nameEn: 'IP Management', namePtBr: 'Gestão de Propriedade Intelectual', descriptionEn: 'Monthly monitoring of IP assets with expiration alerts.', descriptionPtBr: 'Monitoramento mensal de ativos de PI com alertas de expiração.', category: 'juridico', icon: 'award', nodeCount: tpl18.nodes.length, definition: tpl18, sortOrder: 18 },
    { slug: 'lgpd-juridico', nameEn: 'LGPD Legal Compliance', namePtBr: 'Compliance LGPD Jurídico', descriptionEn: 'Handle data subject requests with LGPD compliance review.', descriptionPtBr: 'Trate solicitações de titulares com revisão de conformidade LGPD.', category: 'juridico', icon: 'lock', nodeCount: tpl19.nodes.length, definition: tpl19, sortOrder: 19 },
    // ── TRIBUTÁRIO ──
    { slug: 'apuracao-impostos', nameEn: 'Tax Calculation', namePtBr: 'Apuração de Impostos', descriptionEn: 'Monthly automated tax calculation and reporting.', descriptionPtBr: 'Apuração e relatório mensal automatizado de impostos.', category: 'tributario', icon: 'calculator', nodeCount: tpl20.nodes.length, definition: tpl20, sortOrder: 20 },
    { slug: 'obrigacoes-acessorias', nameEn: 'Tax Filing', namePtBr: 'Obrigações Acessórias', descriptionEn: 'Monthly tax filing preparation with approval workflow.', descriptionPtBr: 'Preparação mensal de obrigações acessórias com fluxo de aprovação.', category: 'tributario', icon: 'file-check', nodeCount: tpl21.nodes.length, definition: tpl21, sortOrder: 21 },
    { slug: 'planejamento-tributario', nameEn: 'Tax Planning', namePtBr: 'Planejamento Tributário', descriptionEn: 'Quarterly tax planning with analysis and optimization.', descriptionPtBr: 'Planejamento tributário trimestral com análise e otimização.', category: 'tributario', icon: 'compass', nodeCount: tpl22.nodes.length, definition: tpl22, sortOrder: 22 },
    { slug: 'recuperacao-creditos', nameEn: 'Tax Credit Recovery', namePtBr: 'Recuperação de Créditos', descriptionEn: 'Identify and recover tax credits with approval.', descriptionPtBr: 'Identifique e recupere créditos tributários com aprovação.', category: 'tributario', icon: 'refresh-cw', nodeCount: tpl23.nodes.length, definition: tpl23, sortOrder: 23 },
    { slug: 'nfe-management', nameEn: 'NF-e Management', namePtBr: 'Gestão de NF-e', descriptionEn: 'Automated electronic invoice generation and management.', descriptionPtBr: 'Geração e gestão automatizada de notas fiscais eletrônicas.', category: 'tributario', icon: 'file-text', nodeCount: tpl24.nodes.length, definition: tpl24, sortOrder: 24 },
    { slug: 'calendario-fiscal', nameEn: 'Tax Calendar', namePtBr: 'Calendário Fiscal', descriptionEn: 'Daily tax deadline monitoring with proactive alerts.', descriptionPtBr: 'Monitoramento diário de prazos fiscais com alertas proativos.', category: 'tributario', icon: 'calendar', nodeCount: tpl25.nodes.length, definition: tpl25, sortOrder: 25 },
    { slug: 'icms-management', nameEn: 'ICMS Management', namePtBr: 'Gestão de ICMS', descriptionEn: 'Monthly ICMS calculation and state tax reporting.', descriptionPtBr: 'Apuração mensal de ICMS e relatórios de impostos estaduais.', category: 'tributario', icon: 'map', nodeCount: tpl26.nodes.length, definition: tpl26, sortOrder: 26 },
    { slug: 'retencoes-fonte', nameEn: 'Withholding Tax', namePtBr: 'Retenções na Fonte', descriptionEn: 'Automated withholding tax calculation on payments.', descriptionPtBr: 'Cálculo automatizado de retenções na fonte sobre pagamentos.', category: 'tributario', icon: 'scissors', nodeCount: tpl27.nodes.length, definition: tpl27, sortOrder: 27 },
    // ── CONTABILIDADE ──
    { slug: 'fechamento-mensal', nameEn: 'Monthly Close', namePtBr: 'Fechamento Mensal', descriptionEn: 'End-of-month accounting close with review and approval.', descriptionPtBr: 'Fechamento contábil mensal com revisão e aprovação.', category: 'contabilidade', icon: 'calendar', nodeCount: tpl28.nodes.length, definition: tpl28, sortOrder: 28 },
    { slug: 'conciliacao-bancaria', nameEn: 'Bank Reconciliation', namePtBr: 'Conciliação Bancária', descriptionEn: 'Daily bank reconciliation with discrepancy detection.', descriptionPtBr: 'Conciliação bancária diária com detecção de discrepâncias.', category: 'contabilidade', icon: 'git-merge', nodeCount: tpl29.nodes.length, definition: tpl29, sortOrder: 29 },
    { slug: 'balancete', nameEn: 'Trial Balance', namePtBr: 'Balancete', descriptionEn: 'Monthly trial balance generation.', descriptionPtBr: 'Geração mensal de balancete.', category: 'contabilidade', icon: 'book', nodeCount: tpl30.nodes.length, definition: tpl30, sortOrder: 30 },
    { slug: 'dre', nameEn: 'Income Statement', namePtBr: 'DRE', descriptionEn: 'Monthly income statement with controller analysis.', descriptionPtBr: 'DRE mensal com análise do controller.', category: 'contabilidade', icon: 'trending-up', nodeCount: tpl31.nodes.length, definition: tpl31, sortOrder: 31 },
    { slug: 'balanco-patrimonial', nameEn: 'Balance Sheet', namePtBr: 'Balanço Patrimonial', descriptionEn: 'Quarterly balance sheet preparation.', descriptionPtBr: 'Elaboração trimestral do balanço patrimonial.', category: 'contabilidade', icon: 'layers', nodeCount: tpl32.nodes.length, definition: tpl32, sortOrder: 32 },
    { slug: 'ativo-imobilizado', nameEn: 'Fixed Assets', namePtBr: 'Ativo Imobilizado', descriptionEn: 'Fixed asset registration and depreciation with approval.', descriptionPtBr: 'Registro e depreciação de ativos imobilizados com aprovação.', category: 'contabilidade', icon: 'box', nodeCount: tpl33.nodes.length, definition: tpl33, sortOrder: 33 },
    { slug: 'custos', nameEn: 'Cost Accounting', namePtBr: 'Contabilidade de Custos', descriptionEn: 'Monthly cost analysis with controller review.', descriptionPtBr: 'Análise mensal de custos com revisão do controller.', category: 'contabilidade', icon: 'dollar-sign', nodeCount: tpl34.nodes.length, definition: tpl34, sortOrder: 34 },
    // ── RH ──
    { slug: 'recrutamento', nameEn: 'Recruitment', namePtBr: 'Recrutamento e Seleção', descriptionEn: 'Candidate screening with qualification check and approval.', descriptionPtBr: 'Triagem de candidatos com verificação de qualificação e aprovação.', category: 'rh', icon: 'user-plus', nodeCount: tpl35.nodes.length, definition: tpl35, sortOrder: 35 },
    { slug: 'onboarding-rh', nameEn: 'Employee Onboarding', namePtBr: 'Onboarding de Colaboradores', descriptionEn: 'New employee onboarding with HR setup and training assignment.', descriptionPtBr: 'Onboarding de novos colaboradores com setup de RH e atribuição de treinamento.', category: 'rh', icon: 'clipboard', nodeCount: tpl36.nodes.length, definition: tpl36, sortOrder: 36 },
    { slug: 'folha-pagamento', nameEn: 'Payroll', namePtBr: 'Folha de Pagamento', descriptionEn: 'Monthly payroll processing with management approval.', descriptionPtBr: 'Processamento mensal de folha de pagamento com aprovação da gestão.', category: 'rh', icon: 'credit-card', nodeCount: tpl37.nodes.length, definition: tpl37, sortOrder: 37 },
    { slug: 'avaliacao-desempenho', nameEn: 'Performance Review', namePtBr: 'Avaliação de Desempenho', descriptionEn: 'Quarterly performance evaluations with approval workflow.', descriptionPtBr: 'Avaliações trimestrais de desempenho com fluxo de aprovação.', category: 'rh', icon: 'star', nodeCount: tpl38.nodes.length, definition: tpl38, sortOrder: 38 },
    { slug: 'treinamento', nameEn: 'Training Management', namePtBr: 'Gestão de Treinamentos', descriptionEn: 'Create and manage training plans on demand.', descriptionPtBr: 'Crie e gerencie planos de treinamento sob demanda.', category: 'rh', icon: 'book-open', nodeCount: tpl39.nodes.length, definition: tpl39, sortOrder: 39 },
    { slug: 'beneficios', nameEn: 'Benefits Management', namePtBr: 'Gestão de Benefícios', descriptionEn: 'Monthly benefits review with change detection.', descriptionPtBr: 'Revisão mensal de benefícios com detecção de mudanças.', category: 'rh', icon: 'gift', nodeCount: tpl40.nodes.length, definition: tpl40, sortOrder: 40 },
    { slug: 'ferias-afastamentos', nameEn: 'Leave Management', namePtBr: 'Férias e Afastamentos', descriptionEn: 'Employee leave requests with manager approval.', descriptionPtBr: 'Solicitações de férias e afastamentos com aprovação do gestor.', category: 'rh', icon: 'sun', nodeCount: tpl41.nodes.length, definition: tpl41, sortOrder: 41 },
    { slug: 'ponto-jornada', nameEn: 'Time Tracking', namePtBr: 'Controle de Ponto', descriptionEn: 'Daily time tracking anomaly detection.', descriptionPtBr: 'Detecção diária de anomalias no controle de ponto.', category: 'rh', icon: 'clock', nodeCount: tpl42.nodes.length, definition: tpl42, sortOrder: 42 },
    { slug: 'clima-organizacional', nameEn: 'Employee Engagement', namePtBr: 'Clima Organizacional', descriptionEn: 'Quarterly engagement survey with data analysis.', descriptionPtBr: 'Pesquisa trimestral de engajamento com análise de dados.', category: 'rh', icon: 'smile', nodeCount: tpl43.nodes.length, definition: tpl43, sortOrder: 43 },
    // ── VENDAS ──
    { slug: 'prospeccao', nameEn: 'Lead Prospecting', namePtBr: 'Prospecção de Leads', descriptionEn: 'Prospect and enrich leads for the sales pipeline.', descriptionPtBr: 'Prospecte e enriqueça leads para o pipeline de vendas.', category: 'vendas', icon: 'search', nodeCount: tpl44.nodes.length, definition: tpl44, sortOrder: 44 },
    { slug: 'qualificacao-leads', nameEn: 'Lead Scoring', namePtBr: 'Qualificação de Leads', descriptionEn: 'Score leads and route qualified ones to CRM.', descriptionPtBr: 'Pontue leads e direcione os qualificados para o CRM.', category: 'vendas', icon: 'filter', nodeCount: tpl45.nodes.length, definition: tpl45, sortOrder: 45 },
    { slug: 'propostas-comerciais', nameEn: 'Sales Proposals', namePtBr: 'Propostas Comerciais', descriptionEn: 'Generate and approve sales proposals.', descriptionPtBr: 'Gere e aprove propostas comerciais.', category: 'vendas', icon: 'file-text', nodeCount: tpl46.nodes.length, definition: tpl46, sortOrder: 46 },
    { slug: 'contratos-vendas', nameEn: 'Sales Contracts', namePtBr: 'Contratos de Vendas', descriptionEn: 'Auto-generate contracts upon deal closure with approval.', descriptionPtBr: 'Gere contratos automaticamente no fechamento do negócio com aprovação.', category: 'vendas', icon: 'file-check', nodeCount: tpl47.nodes.length, definition: tpl47, sortOrder: 47 },
    { slug: 'follow-up-vendas', nameEn: 'Sales Follow-up', namePtBr: 'Follow-up de Vendas', descriptionEn: 'Automated follow-up on stalled deals with response tracking.', descriptionPtBr: 'Follow-up automatizado em negócios parados com rastreamento de resposta.', category: 'vendas', icon: 'repeat', nodeCount: tpl48.nodes.length, definition: tpl48, sortOrder: 48 },
    { slug: 'pos-venda', nameEn: 'Post-Sale', namePtBr: 'Pós-Venda', descriptionEn: 'Post-sale satisfaction check with issue resolution.', descriptionPtBr: 'Verificação pós-venda de satisfação com resolução de problemas.', category: 'vendas', icon: 'heart', nodeCount: tpl49.nodes.length, definition: tpl49, sortOrder: 49 },
    // ── MARKETING ──
    { slug: 'branding', nameEn: 'Brand Management', namePtBr: 'Gestão de Marca', descriptionEn: 'Brand asset creation with approval workflow.', descriptionPtBr: 'Criação de ativos de marca com fluxo de aprovação.', category: 'marketing', icon: 'award', nodeCount: tpl50.nodes.length, definition: tpl50, sortOrder: 50 },
    { slug: 'analytics-marketing', nameEn: 'Marketing Analytics', namePtBr: 'Analytics de Marketing', descriptionEn: 'Daily marketing metrics monitoring with anomaly alerts.', descriptionPtBr: 'Monitoramento diário de métricas de marketing com alertas de anomalia.', category: 'marketing', icon: 'bar-chart', nodeCount: tpl51.nodes.length, definition: tpl51, sortOrder: 51 },
    { slug: 'social-media-mgmt', nameEn: 'Social Media', namePtBr: 'Gestão de Mídias Sociais', descriptionEn: 'Daily social media content creation, approval, and publishing.', descriptionPtBr: 'Criação, aprovação e publicação diária de conteúdo em mídias sociais.', category: 'marketing', icon: 'share-2', nodeCount: tpl52.nodes.length, definition: tpl52, sortOrder: 52 },
    { slug: 'conteudo-blog', nameEn: 'Blog Content', namePtBr: 'Conteúdo de Blog', descriptionEn: 'Weekly blog content creation with SEO optimization.', descriptionPtBr: 'Criação semanal de conteúdo de blog com otimização SEO.', category: 'marketing', icon: 'edit-3', nodeCount: tpl53.nodes.length, definition: tpl53, sortOrder: 53 },
    { slug: 'gestao-ads', nameEn: 'Ad Management', namePtBr: 'Gestão de Anúncios', descriptionEn: 'Daily ad performance monitoring with ROAS alerts.', descriptionPtBr: 'Monitoramento diário de performance de anúncios com alertas de ROAS.', category: 'marketing', icon: 'dollar-sign', nodeCount: tpl54.nodes.length, definition: tpl54, sortOrder: 54 },
    { slug: 'seo-otimizacao', nameEn: 'SEO Optimization', namePtBr: 'Otimização SEO', descriptionEn: 'Weekly SEO audit with content implementation.', descriptionPtBr: 'Auditoria semanal de SEO com implementação de conteúdo.', category: 'marketing', icon: 'search', nodeCount: tpl55.nodes.length, definition: tpl55, sortOrder: 55 },
    { slug: 'email-marketing', nameEn: 'Email Marketing', namePtBr: 'Email Marketing', descriptionEn: 'Email campaign creation with approval and automation.', descriptionPtBr: 'Criação de campanhas de email com aprovação e automação.', category: 'marketing', icon: 'mail', nodeCount: tpl56.nodes.length, definition: tpl56, sortOrder: 56 },
    { slug: 'cro-otimizacao', nameEn: 'CRO Optimization', namePtBr: 'Otimização CRO', descriptionEn: 'Weekly conversion rate monitoring with drop alerts.', descriptionPtBr: 'Monitoramento semanal de taxa de conversão com alertas de queda.', category: 'marketing', icon: 'trending-up', nodeCount: tpl57.nodes.length, definition: tpl57, sortOrder: 57 },
    // ── OPERAÇÕES ──
    { slug: 'gestao-compras', nameEn: 'Procurement', namePtBr: 'Gestão de Compras', descriptionEn: 'Purchase request processing with approval workflow.', descriptionPtBr: 'Processamento de requisições de compra com fluxo de aprovação.', category: 'operacoes', icon: 'shopping-cart', nodeCount: tpl58.nodes.length, definition: tpl58, sortOrder: 58 },
    { slug: 'controle-estoque', nameEn: 'Inventory Control', namePtBr: 'Controle de Estoque', descriptionEn: 'Daily stock monitoring with reorder point alerts.', descriptionPtBr: 'Monitoramento diário de estoque com alertas de ponto de reposição.', category: 'operacoes', icon: 'package', nodeCount: tpl59.nodes.length, definition: tpl59, sortOrder: 59 },
    { slug: 'gestao-logistica', nameEn: 'Logistics', namePtBr: 'Gestão Logística', descriptionEn: 'Shipment tracking with delay detection and alerts.', descriptionPtBr: 'Rastreamento de entregas com detecção de atrasos e alertas.', category: 'operacoes', icon: 'truck', nodeCount: tpl60.nodes.length, definition: tpl60, sortOrder: 60 },
    { slug: 'qualidade-processos', nameEn: 'Quality Management', namePtBr: 'Gestão de Qualidade', descriptionEn: 'Weekly quality checks with non-conformity approval.', descriptionPtBr: 'Verificações semanais de qualidade com aprovação de não-conformidades.', category: 'operacoes', icon: 'check-circle', nodeCount: tpl61.nodes.length, definition: tpl61, sortOrder: 61 },
    { slug: 'melhoria-processos', nameEn: 'Process Improvement', namePtBr: 'Melhoria de Processos', descriptionEn: 'Process analysis with BI-driven improvement recommendations.', descriptionPtBr: 'Análise de processos com recomendações de melhoria baseadas em BI.', category: 'operacoes', icon: 'settings', nodeCount: tpl62.nodes.length, definition: tpl62, sortOrder: 62 },
    { slug: 'bi-operacional', nameEn: 'Operational BI', namePtBr: 'BI Operacional', descriptionEn: 'Daily operational KPI monitoring with alerts.', descriptionPtBr: 'Monitoramento diário de KPIs operacionais com alertas.', category: 'operacoes', icon: 'activity', nodeCount: tpl63.nodes.length, definition: tpl63, sortOrder: 63 },
    // ── ATENDIMENTO ──
    { slug: 'atendimento-multicanal', nameEn: 'Multi-channel Support', namePtBr: 'Atendimento Multicanal', descriptionEn: 'Classify and route tickets with specialist resolution.', descriptionPtBr: 'Classifique e direcione tickets com resolução especializada.', category: 'atendimento', icon: 'headphones', nodeCount: tpl64.nodes.length, definition: tpl64, sortOrder: 64 },
    { slug: 'sla-monitoring', nameEn: 'SLA Monitoring', namePtBr: 'Monitoramento de SLA', descriptionEn: 'Hourly SLA breach detection with proactive alerts.', descriptionPtBr: 'Detecção horária de violação de SLA com alertas proativos.', category: 'atendimento', icon: 'clock', nodeCount: tpl65.nodes.length, definition: tpl65, sortOrder: 65 },
    { slug: 'tickets', nameEn: 'Ticket Management', namePtBr: 'Gestão de Tickets', descriptionEn: 'Ticket resolution with automatic escalation for complex issues.', descriptionPtBr: 'Resolução de tickets com escalação automática para problemas complexos.', category: 'atendimento', icon: 'tag', nodeCount: tpl66.nodes.length, definition: tpl66, sortOrder: 66 },
    { slug: 'escalacao', nameEn: 'Escalation Workflow', namePtBr: 'Workflow de Escalação', descriptionEn: 'Tier-based escalation routing for support tickets.', descriptionPtBr: 'Roteamento de escalação baseado em níveis para tickets de suporte.', category: 'atendimento', icon: 'arrow-up', nodeCount: tpl67.nodes.length, definition: tpl67, sortOrder: 67 },
    { slug: 'nps-csat', nameEn: 'NPS/CSAT Surveys', namePtBr: 'Pesquisas NPS/CSAT', descriptionEn: 'Post-interaction satisfaction surveys with 24h delay.', descriptionPtBr: 'Pesquisas de satisfação pós-interação com atraso de 24h.', category: 'atendimento', icon: 'smile', nodeCount: tpl68.nodes.length, definition: tpl68, sortOrder: 68 },
    // ── TI ──
    { slug: 'infraestrutura', nameEn: 'Infrastructure Monitor', namePtBr: 'Monitor de Infraestrutura', descriptionEn: 'High-frequency infrastructure health checks with alerts.', descriptionPtBr: 'Verificações de saúde de infraestrutura em alta frequência com alertas.', category: 'ti', icon: 'server', nodeCount: tpl69.nodes.length, definition: tpl69, sortOrder: 69 },
    { slug: 'seguranca-ti', nameEn: 'IT Security', namePtBr: 'Segurança de TI', descriptionEn: 'Daily security vulnerability scanning with critical alerts.', descriptionPtBr: 'Varredura diária de vulnerabilidades de segurança com alertas críticos.', category: 'ti', icon: 'shield', nodeCount: tpl70.nodes.length, definition: tpl70, sortOrder: 70 },
    { slug: 'lgpd', nameEn: 'LGPD Compliance', namePtBr: 'Conformidade LGPD', descriptionEn: 'Data subject request handling with compliance approval.', descriptionPtBr: 'Tratamento de solicitações de titulares com aprovação de conformidade.', category: 'ti', icon: 'lock', nodeCount: tpl71.nodes.length, definition: tpl71, sortOrder: 71 },
    { slug: 'dev-lifecycle', nameEn: 'Dev Lifecycle', namePtBr: 'Ciclo de Desenvolvimento', descriptionEn: 'Code review with approval and automated release.', descriptionPtBr: 'Revisão de código com aprovação e release automatizado.', category: 'ti', icon: 'code', nodeCount: tpl72.nodes.length, definition: tpl72, sortOrder: 72 },
    { slug: 'devops-cicd', nameEn: 'DevOps CI/CD', namePtBr: 'DevOps CI/CD', descriptionEn: 'CI/CD pipeline with test validation and deployment approval.', descriptionPtBr: 'Pipeline CI/CD com validação de testes e aprovação de deploy.', category: 'ti', icon: 'terminal', nodeCount: tpl73.nodes.length, definition: tpl73, sortOrder: 73 },
    // ── COMPLIANCE ──
    { slug: 'regulatorio', nameEn: 'Regulatory Monitor', namePtBr: 'Monitor Regulatório', descriptionEn: 'Daily regulatory change monitoring with alerts.', descriptionPtBr: 'Monitoramento diário de mudanças regulatórias com alertas.', category: 'compliance', icon: 'shield-check', nodeCount: tpl74.nodes.length, definition: tpl74, sortOrder: 74 },
    { slug: 'auditoria-interna', nameEn: 'Internal Audit', namePtBr: 'Auditoria Interna', descriptionEn: 'Internal audit with approval and progress tracking.', descriptionPtBr: 'Auditoria interna com aprovação e acompanhamento de progresso.', category: 'compliance', icon: 'clipboard', nodeCount: tpl75.nodes.length, definition: tpl75, sortOrder: 75 },
    { slug: 'gestao-riscos', nameEn: 'Risk Management', namePtBr: 'Gestão de Riscos', descriptionEn: 'Quarterly risk assessment with dashboard reporting.', descriptionPtBr: 'Avaliação trimestral de riscos com relatório em dashboard.', category: 'compliance', icon: 'alert-triangle', nodeCount: tpl76.nodes.length, definition: tpl76, sortOrder: 76 },
    { slug: 'controles-internos', nameEn: 'Internal Controls', namePtBr: 'Controles Internos', descriptionEn: 'Monthly internal controls review and reporting.', descriptionPtBr: 'Revisão e relatório mensal de controles internos.', category: 'compliance', icon: 'check-square', nodeCount: tpl77.nodes.length, definition: tpl77, sortOrder: 77 },
    { slug: 'anticorrupcao', nameEn: 'Anti-Corruption', namePtBr: 'Anticorrupção', descriptionEn: 'Anti-corruption due diligence with investigation workflow.', descriptionPtBr: 'Due diligence anticorrupção com fluxo de investigação.', category: 'compliance', icon: 'eye', nodeCount: tpl78.nodes.length, definition: tpl78, sortOrder: 78 },
    // ── TESOURARIA ──
    { slug: 'gestao-caixa', nameEn: 'Cash Management', namePtBr: 'Gestão de Caixa', descriptionEn: 'Daily cash position monitoring with minimum balance alerts.', descriptionPtBr: 'Monitoramento diário de posição de caixa com alertas de saldo mínimo.', category: 'tesouraria', icon: 'landmark', nodeCount: tpl79.nodes.length, definition: tpl79, sortOrder: 79 },
    { slug: 'pix-boleto', nameEn: 'PIX & Boleto Collection', namePtBr: 'Cobrança PIX/Boleto', descriptionEn: 'Payment collection via PIX/Boleto with approval.', descriptionPtBr: 'Cobrança via PIX/Boleto com aprovação.', category: 'tesouraria', icon: 'qr-code', nodeCount: tpl80.nodes.length, definition: tpl80, sortOrder: 80 },
    { slug: 'credito', nameEn: 'Credit Analysis', namePtBr: 'Análise de Crédito', descriptionEn: 'On-demand credit analysis and risk assessment.', descriptionPtBr: 'Análise de crédito e avaliação de risco sob demanda.', category: 'tesouraria', icon: 'user-check', nodeCount: tpl81.nodes.length, definition: tpl81, sortOrder: 81 },
    { slug: 'investimentos', nameEn: 'Investment Management', namePtBr: 'Gestão de Investimentos', descriptionEn: 'Daily investment monitoring with maturity alerts.', descriptionPtBr: 'Monitoramento diário de investimentos com alertas de vencimento.', category: 'tesouraria', icon: 'trending-up', nodeCount: tpl82.nodes.length, definition: tpl82, sortOrder: 82 },
    { slug: 'cobranca', nameEn: 'Collections Workflow', namePtBr: 'Workflow de Cobrança', descriptionEn: 'Overdue invoice collection with escalation after grace period.', descriptionPtBr: 'Cobrança de faturas vencidas com escalação após período de carência.', category: 'tesouraria', icon: 'credit-card', nodeCount: tpl83.nodes.length, definition: tpl83, sortOrder: 83 },
    // ── PLANEJAMENTO ──
    { slug: 'okrs', nameEn: 'OKR Management', namePtBr: 'Gestão de OKRs', descriptionEn: 'Weekly OKR progress tracking and reporting.', descriptionPtBr: 'Acompanhamento semanal de progresso de OKRs e relatórios.', category: 'planejamento', icon: 'target', nodeCount: tpl84.nodes.length, definition: tpl84, sortOrder: 84 },
    { slug: 'bsc', nameEn: 'Balanced Scorecard', namePtBr: 'Balanced Scorecard', descriptionEn: 'Monthly BSC analysis with dashboard generation.', descriptionPtBr: 'Análise mensal de BSC com geração de dashboard.', category: 'planejamento', icon: 'layout', nodeCount: tpl85.nodes.length, definition: tpl85, sortOrder: 85 },
    { slug: 'swot', nameEn: 'SWOT Analysis', namePtBr: 'Análise SWOT', descriptionEn: 'On-demand SWOT analysis generation.', descriptionPtBr: 'Geração de análise SWOT sob demanda.', category: 'planejamento', icon: 'compass', nodeCount: tpl86.nodes.length, definition: tpl86, sortOrder: 86 },
    { slug: 'planejamento-anual', nameEn: 'Annual Planning', namePtBr: 'Planejamento Anual', descriptionEn: 'Annual strategic planning with review and approval.', descriptionPtBr: 'Planejamento estratégico anual com revisão e aprovação.', category: 'planejamento', icon: 'calendar', nodeCount: tpl87.nodes.length, definition: tpl87, sortOrder: 87 },
    { slug: 'reunioes-diretoria', nameEn: 'Board Meeting Prep', namePtBr: 'Reuniões de Diretoria', descriptionEn: 'Monthly board meeting preparation package.', descriptionPtBr: 'Pacote mensal de preparação para reuniões de diretoria.', category: 'planejamento', icon: 'users', nodeCount: tpl88.nodes.length, definition: tpl88, sortOrder: 88 },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Seed function                                                             */
/* -------------------------------------------------------------------------- */

export async function seedWorkflowTemplates() {
  const templates = buildTemplates();

  for (const tpl of templates) {
    await db
      .insert(workflowTemplates)
      .values(tpl)
      .onConflictDoUpdate({
        target: workflowTemplates.slug,
        set: {
          nameEn: tpl.nameEn,
          namePtBr: tpl.namePtBr,
          descriptionEn: tpl.descriptionEn,
          descriptionPtBr: tpl.descriptionPtBr,
          category: tpl.category,
          icon: tpl.icon,
          nodeCount: tpl.nodeCount,
          definition: tpl.definition,
          sortOrder: tpl.sortOrder,
        },
      });
  }

  console.log(`  Workflow templates: ${templates.length} seeded`);
}
