import {
  CheckSquare,
  Scale,
  Receipt,
  Calculator,
  Users,
  TrendingUp,
  Megaphone,
  Cog,
  Headphones,
  Monitor,
  ShieldCheck,
  Landmark,
  Target,
} from 'lucide-react';
import { SectionHeading } from '../../../_components/reference-components';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CoverageStatus = 'automatizavel' | 'parcial' | 'planejado';
type Complexity = 'tarefa' | 'workflow' | 'integracao';
type Frequency = 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual' | 'por-demanda';

interface CoverageRow {
  processo: string;
  status: CoverageStatus;
  complexidade: Complexity;
  frequencia: Frequency;
  recurso: string;
  observacao: string;
}

interface DepartmentCoverage {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  rows: CoverageRow[];
}

/* ------------------------------------------------------------------ */
/*  Badge configs                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<CoverageStatus, { label: string; color: string }> = {
  automatizavel: { label: 'AUTOMATIZÁVEL', color: 'border-status-success text-status-success' },
  parcial: { label: 'PARCIAL', color: 'border-status-warning text-status-warning' },
  planejado: { label: 'PLANEJADO', color: 'border-text-muted text-text-muted' },
};

const complexityConfig: Record<Complexity, { label: string; color: string }> = {
  tarefa: { label: 'TAREFA', color: 'border-status-success text-status-success' },
  workflow: { label: 'WORKFLOW', color: 'border-accent-cyan text-accent-cyan' },
  integracao: { label: 'INTEGRAÇÃO', color: 'border-status-warning text-status-warning' },
};

const frequencyConfig: Record<Frequency, { label: string; color: string }> = {
  diario: { label: 'DIÁRIO', color: 'border-status-success text-status-success' },
  semanal: { label: 'SEMANAL', color: 'border-blue-500 text-blue-400' },
  mensal: { label: 'MENSAL', color: 'border-accent-cyan text-accent-cyan' },
  trimestral: { label: 'TRIMESTRAL', color: 'border-yellow-500 text-yellow-400' },
  anual: { label: 'ANUAL', color: 'border-text-muted text-text-muted' },
  'por-demanda': { label: 'POR DEMANDA', color: 'border-text-secondary text-text-secondary' },
};

/* ------------------------------------------------------------------ */
/*  Coverage data — 12 departments, ~76 processes                      */
/* ------------------------------------------------------------------ */

const coverageData: DepartmentCoverage[] = [
  {
    icon: Scale,
    name: 'Jurídico & Constituição',
    rows: [
      { processo: 'Registro CNPJ', status: 'planejado', complexidade: 'integracao', frequencia: 'por-demanda', recurso: 'Workflow + Agente Compliance', observacao: 'Checklist automático; sem integração gov.br' },
      { processo: 'Escolha tipo societário', status: 'parcial', complexidade: 'tarefa', frequencia: 'por-demanda', recurso: 'Agente Financeiro', observacao: 'Simulação tributária disponível; decisão manual' },
      { processo: 'Contrato social', status: 'parcial', complexidade: 'workflow', frequencia: 'por-demanda', recurso: 'Agente Jurídico', observacao: 'Geração de minutas; sem registro eletrônico' },
      { processo: 'Registro Junta Comercial', status: 'planejado', complexidade: 'integracao', frequencia: 'por-demanda', recurso: 'Workflow + Dashboard', observacao: 'Acompanhamento de status; sem protocolo automático' },
      { processo: 'Alvarás e licenças', status: 'planejado', complexidade: 'integracao', frequencia: 'anual', recurso: 'Agente Compliance', observacao: 'Checklist por CNAE; renovação depende de prefeitura' },
      { processo: 'Marcas e patentes', status: 'planejado', complexidade: 'integracao', frequencia: 'por-demanda', recurso: 'Agente Jurídico', observacao: 'Monitoramento RPI; sem peticionamento INPI' },
      { processo: 'Contratos', status: 'parcial', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Jurídico + Workflow', observacao: 'Minutas automáticas + fluxo de aprovação' },
    ],
  },
  {
    icon: Receipt,
    name: 'Tributário & Fiscal',
    rows: [
      { processo: 'Escolha regime tributário', status: 'parcial', complexidade: 'tarefa', frequencia: 'anual', recurso: 'Agente Contador', observacao: 'Comparativo automático; opção via portal gov' },
      { processo: 'Apuração Simples Nacional', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Fiscal', observacao: 'Cálculo DAS; geração de guia manual' },
      { processo: 'Apuração Lucro Presumido', status: 'parcial', complexidade: 'workflow', frequencia: 'trimestral', recurso: 'Agente Contador', observacao: 'Cálculo automático; DARF gerado internamente' },
      { processo: 'Apuração Lucro Real', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Contador', observacao: 'LALUR + PIS/COFINS; sem transmissão oficial' },
      { processo: 'Emissão NF-e / NFS-e', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Faturamento', observacao: 'Emissão automática; monitoramento de rejeições SEFAZ' },
      { processo: 'Obrigações acessórias', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Calendário Fiscal', observacao: 'Alertas automáticos; geração de arquivos parcial' },
      { processo: 'SPED (ECD/ECF/EFD)', status: 'planejado', complexidade: 'integracao', frequencia: 'trimestral', recurso: 'Agente Contábil', observacao: 'Geração planejada; validação pré-transmissão' },
      { processo: 'DCTF / DARF', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Fiscal', observacao: 'Geração de DARF automática; conciliação DCTF' },
    ],
  },
  {
    icon: Calculator,
    name: 'Contabilidade & Finanças',
    rows: [
      { processo: 'DRE', status: 'parcial', complexidade: 'tarefa', frequencia: 'mensal', recurso: 'Agente Contador', observacao: 'Geração automática; margens em tempo real' },
      { processo: 'Balanço Patrimonial', status: 'planejado', complexidade: 'workflow', frequencia: 'trimestral', recurso: 'Agente Contador', observacao: 'Consolidação de saldos; comparativo entre períodos' },
      { processo: 'Fluxo de Caixa', status: 'automatizavel', complexidade: 'tarefa', frequencia: 'diario', recurso: 'Agente Tesoureiro', observacao: 'Atualização em tempo real + projeção automática' },
      { processo: 'Contas a Receber', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Financeiro', observacao: 'Cobrança automática + aging dashboard' },
      { processo: 'Contas a Pagar', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Financeiro', observacao: 'Workflow de aprovação por alçada + agendamento' },
      { processo: 'Conciliação bancária', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Financeiro', observacao: 'Matching automático; divergências para revisão humana' },
      { processo: 'Orçamento empresarial', status: 'parcial', complexidade: 'workflow', frequencia: 'anual', recurso: 'Agente Controller', observacao: 'Consolidação departamental + cenários simulados' },
    ],
  },
  {
    icon: Users,
    name: 'RH & Dept. Pessoal',
    rows: [
      { processo: 'Admissão CLT', status: 'parcial', complexidade: 'workflow', frequencia: 'por-demanda', recurso: 'Workflow + Agente RH', observacao: 'Checklist automático; registro CTPS manual' },
      { processo: 'Onboarding', status: 'automatizavel', complexidade: 'workflow', frequencia: 'por-demanda', recurso: 'Workflow + Agente RH', observacao: 'Plano 30/60/90 automático com acompanhamento' },
      { processo: 'Folha de pagamento', status: 'parcial', complexidade: 'integracao', frequencia: 'mensal', recurso: 'Agente Financeiro', observacao: 'Importação de dados; cálculo em sistema externo' },
      { processo: 'Benefícios', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Workflow mensal', observacao: 'Gestão de tarefas recorrentes por operadora' },
      { processo: 'FGTS / INSS', status: 'parcial', complexidade: 'integracao', frequencia: 'mensal', recurso: 'Agente Contábil', observacao: 'Alertas de prazo + conciliação; guias externas' },
      { processo: 'Férias e 13º', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Financeiro', observacao: 'Provisão automática + alertas de período concessivo' },
      { processo: 'Rescisão', status: 'parcial', complexidade: 'workflow', frequencia: 'por-demanda', recurso: 'Workflow + Agente RH', observacao: 'Checklist por modalidade + cálculo de verbas' },
      { processo: 'eSocial', status: 'planejado', complexidade: 'integracao', frequencia: 'mensal', recurso: 'Agente RH', observacao: 'Validação pré-envio; sem transmissão direta' },
      { processo: 'Segurança do Trabalho', status: 'parcial', complexidade: 'workflow', frequencia: 'anual', recurso: 'Workflow anual', observacao: 'Rastreamento de NRs e exames; laudos externos' },
    ],
  },
  {
    icon: TrendingUp,
    name: 'Vendas & Comercial',
    rows: [
      { processo: 'CRM / Pipeline', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente CRM + Workflow', observacao: 'Movimentação automática + relatórios diários' },
      { processo: 'Prospecção', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Prospecção', observacao: 'Enriquecimento de dados + score automático' },
      { processo: 'Propostas comerciais', status: 'automatizavel', complexidade: 'tarefa', frequencia: 'semanal', recurso: 'Agente Propostas', observacao: 'Geração automática a partir do CRM' },
      { processo: 'Contratos comerciais', status: 'automatizavel', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Contratos + Workflow', observacao: 'Minutas + assinatura digital + alertas' },
      { processo: 'Follow-up', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Follow-up', observacao: 'Cadências automatizadas + priorização inteligente' },
      { processo: 'Pós-venda', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente CS', observacao: 'Health score + onboarding + alertas de churn' },
    ],
  },
  {
    icon: Megaphone,
    name: 'Marketing',
    rows: [
      { processo: 'Branding', status: 'parcial', complexidade: 'tarefa', frequencia: 'por-demanda', recurso: 'Agente Branding', observacao: 'Validação de guidelines; criação parcial' },
      { processo: 'Marketing Digital', status: 'automatizavel', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Analytics + Workflow', observacao: 'Consolidação multicanal + alocação de budget' },
      { processo: 'Redes Sociais', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Social Media', observacao: 'Sugestão de pautas + publicação automática' },
      { processo: 'Conteúdo', status: 'automatizavel', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Conteúdo', observacao: 'Blog posts SEO + distribuição multicanal' },
      { processo: 'Anúncios pagos', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Ads', observacao: 'Monitoramento + sugestões; sem API de plataformas' },
      { processo: 'SEO', status: 'automatizavel', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente SEO', observacao: 'Auditoria técnica + monitoramento de keywords' },
      { processo: 'Email Marketing', status: 'automatizavel', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Email Marketing', observacao: 'Copies otimizadas + automações comportamentais' },
      { processo: 'Funil de conversão', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente CRO + Workflow', observacao: 'Análise de taxas + rastreamento de leads' },
    ],
  },
  {
    icon: Cog,
    name: 'Operações & Processos',
    rows: [
      { processo: 'Cadeia de suprimentos', status: 'parcial', complexidade: 'integracao', frequencia: 'semanal', recurso: 'Agente Compras', observacao: 'Avaliação de cotações; sem integração fornecedores' },
      { processo: 'Estoque', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Estoque', observacao: 'Saldo automático + alertas; sem WMS integrado' },
      { processo: 'Logística', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Logística', observacao: 'Atribuição de transportadora; sem tracking API' },
      { processo: 'Qualidade', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Qualidade + Workflow', observacao: 'Auditoria interna + gestão de NCs' },
      { processo: 'SOPs', status: 'automatizavel', complexidade: 'tarefa', frequencia: 'por-demanda', recurso: 'Agente Processos + Wiki', observacao: 'Geração de SOPs + workflow de revisão' },
      { processo: 'KPIs operacionais', status: 'automatizavel', complexidade: 'tarefa', frequencia: 'diario', recurso: 'Agente BI + Dashboard', observacao: 'OEE, lead time, OTIF em tempo real' },
    ],
  },
  {
    icon: Headphones,
    name: 'Atendimento ao Cliente',
    rows: [
      { processo: 'Canais de atendimento', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Atendimento', observacao: 'Resposta automática em canais integrados' },
      { processo: 'SLA', status: 'automatizavel', complexidade: 'tarefa', frequencia: 'diario', recurso: 'Motor de SLA', observacao: 'Cálculo automático + alertas em 80% do prazo' },
      { processo: 'Tickets', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Suporte + Workflow', observacao: 'Abertura, categorização e distribuição automáticas' },
      { processo: 'Escalação', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Workflow de escalação', observacao: 'N1→N2→N3 automático com contexto completo' },
      { processo: 'NPS / CSAT', status: 'automatizavel', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente CX', observacao: 'Pesquisas automáticas + análise de sentimento' },
    ],
  },
  {
    icon: Monitor,
    name: 'TI & Tecnologia',
    rows: [
      { processo: 'Infraestrutura', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Infraestrutura', observacao: 'Monitoramento + alertas; sem provisionamento' },
      { processo: 'Segurança de TI', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Segurança', observacao: 'Análise de logs + simulação phishing; sem WAF/IDS' },
      { processo: 'LGPD', status: 'planejado', complexidade: 'integracao', frequencia: 'por-demanda', recurso: 'Agente Compliance LGPD', observacao: 'Rastreamento de coleta; DSAR com SLA' },
      { processo: 'Dev Lifecycle', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agentes Dev + Workflow', observacao: 'Sprints simuladas + code review + QA' },
      { processo: 'DevOps / CI-CD', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente DevOps', observacao: 'Monitoramento de pipelines; sem infra provisioning' },
    ],
  },
  {
    icon: ShieldCheck,
    name: 'Compliance & Governança',
    rows: [
      { processo: 'Regulatório', status: 'parcial', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Compliance', observacao: 'Monitoramento de diários oficiais + renovações' },
      { processo: 'Auditoria interna', status: 'parcial', complexidade: 'workflow', frequencia: 'trimestral', recurso: 'Agente Auditoria', observacao: 'Papéis de trabalho automáticos; execução manual' },
      { processo: 'Gestão de riscos', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Riscos + Dashboard', observacao: 'Matriz consolidada + heat map; inputs manuais' },
      { processo: 'Controles internos', status: 'parcial', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Controles', observacao: 'Segregação de funções + alçadas automáticas' },
      { processo: 'Anticorrupção', status: 'parcial', complexidade: 'workflow', frequencia: 'por-demanda', recurso: 'Agente Compliance + Workflow', observacao: 'Canal de denúncias + due diligence de fornecedores' },
    ],
  },
  {
    icon: Landmark,
    name: 'Tesouraria & Financeiro',
    rows: [
      { processo: 'Gestão de caixa', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Financeiro', observacao: 'Saldos via integração; projeção 30 dias' },
      { processo: 'Pix / Boleto', status: 'parcial', complexidade: 'integracao', frequencia: 'diario', recurso: 'Agente Cobrança', observacao: 'Emissão automática; conciliação bancária parcial' },
      { processo: 'Crédito', status: 'parcial', complexidade: 'integracao', frequencia: 'mensal', recurso: 'Agente Financeiro', observacao: 'Monitoramento de vencimentos; sem API bancária' },
      { processo: 'Investimentos', status: 'parcial', complexidade: 'tarefa', frequencia: 'mensal', recurso: 'Agente Financeiro', observacao: 'Sugestão de aplicação; sem execução automática' },
      { processo: 'Cobrança', status: 'automatizavel', complexidade: 'workflow', frequencia: 'diario', recurso: 'Agente Cobrança + Workflow', observacao: 'Régua automática + escalação jurídica D+60' },
    ],
  },
  {
    icon: Target,
    name: 'Planejamento Estratégico',
    rows: [
      { processo: 'OKRs', status: 'parcial', complexidade: 'workflow', frequencia: 'semanal', recurso: 'Agente Planejamento', observacao: 'Criação de ciclos + check-in semanal; sem cascateamento' },
      { processo: 'BSC', status: 'parcial', complexidade: 'workflow', frequencia: 'mensal', recurso: 'Agente Planejamento + Dashboard', observacao: 'KPIs mapeados + semáforo; atualização manual' },
      { processo: 'SWOT', status: 'parcial', complexidade: 'tarefa', frequencia: 'anual', recurso: 'Agente Planejamento', observacao: 'Coleta de dados + matriz automática; análise anual' },
      { processo: 'Planejamento anual', status: 'parcial', complexidade: 'workflow', frequencia: 'anual', recurso: 'Agente Planejamento + Workflow', observacao: 'Draft automático + fluxo de aprovação' },
      { processo: 'Reuniões de diretoria', status: 'automatizavel', complexidade: 'tarefa', frequencia: 'semanal', recurso: 'Agente Planejamento', observacao: 'Pauta automática + distribuição de deliberações' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Derived stats                                                      */
/* ------------------------------------------------------------------ */

const allRows = coverageData.flatMap((d) => d.rows);
const countByStatus = (s: CoverageStatus) => allRows.filter((r) => r.status === s).length;
const countByComplexity = (c: Complexity) => allRows.filter((r) => r.complexidade === c).length;
const countByFrequency = (f: Frequency) => allRows.filter((r) => r.frequencia === f).length;

const statusStats = [
  { label: 'Automatizável', count: countByStatus('automatizavel'), color: 'border-status-success text-status-success' },
  { label: 'Parcial', count: countByStatus('parcial'), color: 'border-status-warning text-status-warning' },
  { label: 'Planejado', count: countByStatus('planejado'), color: 'border-text-muted text-text-muted' },
] as const;

const complexityStats = [
  { label: 'Tarefa', count: countByComplexity('tarefa'), color: 'border-status-success text-status-success' },
  { label: 'Workflow', count: countByComplexity('workflow'), color: 'border-accent-cyan text-accent-cyan' },
  { label: 'Integração', count: countByComplexity('integracao'), color: 'border-status-warning text-status-warning' },
] as const;

const frequencyStats = [
  { label: 'Diário', count: countByFrequency('diario') },
  { label: 'Semanal', count: countByFrequency('semanal') },
  { label: 'Mensal', count: countByFrequency('mensal') },
  { label: 'Trimestral', count: countByFrequency('trimestral') },
  { label: 'Anual', count: countByFrequency('anual') },
  { label: 'Por Demanda', count: countByFrequency('por-demanda') },
] as const;

/* ------------------------------------------------------------------ */
/*  Exported content                                                   */
/* ------------------------------------------------------------------ */

export const coberturaContent = (
  <section>
    <SectionHeading id="cobertura" icon={CheckSquare} title="Cobertura do AI Office Sim" />

    <p className="mb-6 text-sm leading-relaxed text-text-secondary">
      Esta matriz compara cada processo descrito no Blueprint com as capacidades reais do AI Office Sim.
      Para cada um dos {allRows.length} processos mapeados nos 12 departamentos, indicamos o status de
      automação, a complexidade de implementação e a frequência de uso — dados essenciais para
      priorizar o que construir primeiro.
    </p>

    {/* Status cards */}
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Status de Automação</p>
    <div className="mb-4 grid gap-4 sm:grid-cols-3">
      {statusStats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-4 text-center">
          <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.count}</p>
          <p className={`mt-1 border-t pt-2 text-xs font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Complexity cards */}
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Complexidade</p>
    <div className="mb-4 grid gap-4 sm:grid-cols-3">
      {complexityStats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-4 text-center">
          <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.count}</p>
          <p className={`mt-1 border-t pt-2 text-xs font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Frequency cards */}
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Frequência de Uso</p>
    <div className="mb-6 grid gap-4 grid-cols-3 sm:grid-cols-6">
      {frequencyStats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-3 text-center">
          <p className="text-2xl font-bold text-text-primary">{s.count}</p>
          <p className="mt-1 border-t pt-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Legend */}
    <div className="mb-8 space-y-3 text-xs">
      <div className="flex flex-wrap gap-4">
        <span className="text-text-muted font-bold">Status:</span>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`border px-2 py-0.5 font-bold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-text-muted">
              {key === 'automatizavel' && '— Executa o processo'}
              {key === 'parcial' && '— Parte manual'}
              {key === 'planejado' && '— Futuro'}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <span className="text-text-muted font-bold">Complexidade:</span>
        {Object.entries(complexityConfig).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`border px-2 py-0.5 font-bold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-text-muted">
              {key === 'tarefa' && '— Ação única do agente'}
              {key === 'workflow' && '— Múltiplas etapas'}
              {key === 'integracao' && '— API/sistema externo'}
            </span>
          </span>
        ))}
      </div>
    </div>

    {/* Department tables */}
    {coverageData.map((dept) => (
      <div key={dept.name} className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-text-primary">
          <dept.icon className="h-4 w-4 text-accent-cyan" />
          {dept.name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-4">Processo</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Complexidade</th>
                <th className="py-2 pr-4">Frequência</th>
                <th className="py-2 pr-4">Recurso</th>
                <th className="py-2">Observação</th>
              </tr>
            </thead>
            <tbody>
              {dept.rows.map((row) => {
                const sc = statusConfig[row.status];
                const cc = complexityConfig[row.complexidade];
                const fc = frequencyConfig[row.frequencia];
                return (
                  <tr key={row.processo} className="border-b border-border-default/50">
                    <td className="py-2 pr-4 text-text-primary">{row.processo}</td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${cc.color}`}>
                        {cc.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${fc.color}`}>
                        {fc.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">{row.recurso}</td>
                    <td className="py-2 text-text-muted">{row.observacao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </section>
);
