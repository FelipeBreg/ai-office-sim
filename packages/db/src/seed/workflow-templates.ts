/**
 * Seed data for 12 workflow templates (global — no projectId).
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
