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

interface CoverageRow {
  processo: string;
  status: CoverageStatus;
  recurso: string;
  observacao: string;
}

interface DepartmentCoverage {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  rows: CoverageRow[];
}

/* ------------------------------------------------------------------ */
/*  Status badge config                                                */
/* ------------------------------------------------------------------ */

const statusConfig: Record<CoverageStatus, { label: string; color: string }> = {
  automatizavel: { label: 'AUTOMATIZÁVEL', color: 'border-status-success text-status-success' },
  parcial: { label: 'PARCIAL', color: 'border-status-warning text-status-warning' },
  planejado: { label: 'PLANEJADO', color: 'border-text-muted text-text-muted' },
};

/* ------------------------------------------------------------------ */
/*  Coverage data — 12 departments, ~76 processes                      */
/* ------------------------------------------------------------------ */

const coverageData: DepartmentCoverage[] = [
  {
    icon: Scale,
    name: 'Jurídico & Constituição',
    rows: [
      { processo: 'Registro CNPJ', status: 'planejado', recurso: 'Workflow + Agente Compliance', observacao: 'Checklist automático; sem integração gov.br' },
      { processo: 'Escolha tipo societário', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Simulação tributária disponível; decisão manual' },
      { processo: 'Contrato social', status: 'parcial', recurso: 'Agente Jurídico', observacao: 'Geração de minutas; sem registro eletrônico' },
      { processo: 'Registro Junta Comercial', status: 'planejado', recurso: 'Workflow + Dashboard', observacao: 'Acompanhamento de status; sem protocolo automático' },
      { processo: 'Alvarás e licenças', status: 'planejado', recurso: 'Agente Compliance', observacao: 'Checklist por CNAE; renovação depende de prefeitura' },
      { processo: 'Marcas e patentes', status: 'planejado', recurso: 'Agente Jurídico', observacao: 'Monitoramento RPI; sem peticionamento INPI' },
      { processo: 'Contratos', status: 'parcial', recurso: 'Agente Jurídico + Workflow', observacao: 'Minutas automáticas + fluxo de aprovação' },
    ],
  },
  {
    icon: Receipt,
    name: 'Tributário & Fiscal',
    rows: [
      { processo: 'Escolha regime tributário', status: 'parcial', recurso: 'Agente Contador', observacao: 'Comparativo automático; opção via portal gov' },
      { processo: 'Apuração Simples Nacional', status: 'parcial', recurso: 'Agente Fiscal', observacao: 'Cálculo DAS; geração de guia manual' },
      { processo: 'Apuração Lucro Presumido', status: 'parcial', recurso: 'Agente Contador', observacao: 'Cálculo automático; DARF gerado internamente' },
      { processo: 'Apuração Lucro Real', status: 'parcial', recurso: 'Agente Contador', observacao: 'LALUR + PIS/COFINS; sem transmissão oficial' },
      { processo: 'Emissão NF-e / NFS-e', status: 'parcial', recurso: 'Agente Faturamento', observacao: 'Emissão automática; monitoramento de rejeições SEFAZ' },
      { processo: 'Obrigações acessórias', status: 'parcial', recurso: 'Calendário Fiscal', observacao: 'Alertas automáticos; geração de arquivos parcial' },
      { processo: 'SPED (ECD/ECF/EFD)', status: 'planejado', recurso: 'Agente Contábil', observacao: 'Geração planejada; validação pré-transmissão' },
      { processo: 'DCTF / DARF', status: 'parcial', recurso: 'Agente Fiscal', observacao: 'Geração de DARF automática; conciliação DCTF' },
    ],
  },
  {
    icon: Calculator,
    name: 'Contabilidade & Finanças',
    rows: [
      { processo: 'DRE', status: 'parcial', recurso: 'Agente Contador', observacao: 'Geração automática; margens em tempo real' },
      { processo: 'Balanço Patrimonial', status: 'planejado', recurso: 'Agente Contador', observacao: 'Consolidação de saldos; comparativo entre períodos' },
      { processo: 'Fluxo de Caixa', status: 'automatizavel', recurso: 'Agente Tesoureiro', observacao: 'Atualização em tempo real + projeção automática' },
      { processo: 'Contas a Receber', status: 'automatizavel', recurso: 'Agente Financeiro', observacao: 'Cobrança automática + aging dashboard' },
      { processo: 'Contas a Pagar', status: 'automatizavel', recurso: 'Agente Financeiro', observacao: 'Workflow de aprovação por alçada + agendamento' },
      { processo: 'Conciliação bancária', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Matching automático; divergências para revisão humana' },
      { processo: 'Orçamento empresarial', status: 'parcial', recurso: 'Agente Controller', observacao: 'Consolidação departamental + cenários simulados' },
    ],
  },
  {
    icon: Users,
    name: 'RH & Dept. Pessoal',
    rows: [
      { processo: 'Admissão CLT', status: 'parcial', recurso: 'Workflow + Agente RH', observacao: 'Checklist automático; registro CTPS manual' },
      { processo: 'Onboarding', status: 'automatizavel', recurso: 'Workflow + Agente RH', observacao: 'Plano 30/60/90 automático com acompanhamento' },
      { processo: 'Folha de pagamento', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Importação de dados; cálculo em sistema externo' },
      { processo: 'Benefícios', status: 'parcial', recurso: 'Workflow mensal', observacao: 'Gestão de tarefas recorrentes por operadora' },
      { processo: 'FGTS / INSS', status: 'parcial', recurso: 'Agente Contábil', observacao: 'Alertas de prazo + conciliação; guias externas' },
      { processo: 'Férias e 13º', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Provisão automática + alertas de período concessivo' },
      { processo: 'Rescisão', status: 'parcial', recurso: 'Workflow + Agente RH', observacao: 'Checklist por modalidade + cálculo de verbas' },
      { processo: 'eSocial', status: 'planejado', recurso: 'Agente RH', observacao: 'Validação pré-envio; sem transmissão direta' },
      { processo: 'Segurança do Trabalho', status: 'parcial', recurso: 'Workflow anual', observacao: 'Rastreamento de NRs e exames; laudos externos' },
    ],
  },
  {
    icon: TrendingUp,
    name: 'Vendas & Comercial',
    rows: [
      { processo: 'CRM / Pipeline', status: 'automatizavel', recurso: 'Agente CRM + Workflow', observacao: 'Movimentação automática + relatórios diários' },
      { processo: 'Prospecção', status: 'automatizavel', recurso: 'Agente Prospecção', observacao: 'Enriquecimento de dados + score automático' },
      { processo: 'Propostas comerciais', status: 'automatizavel', recurso: 'Agente Propostas', observacao: 'Geração automática a partir do CRM' },
      { processo: 'Contratos comerciais', status: 'automatizavel', recurso: 'Agente Contratos + Workflow', observacao: 'Minutas + assinatura digital + alertas' },
      { processo: 'Follow-up', status: 'automatizavel', recurso: 'Agente Follow-up', observacao: 'Cadências automatizadas + priorização inteligente' },
      { processo: 'Pós-venda', status: 'automatizavel', recurso: 'Agente CS', observacao: 'Health score + onboarding + alertas de churn' },
    ],
  },
  {
    icon: Megaphone,
    name: 'Marketing',
    rows: [
      { processo: 'Branding', status: 'parcial', recurso: 'Agente Branding', observacao: 'Validação de guidelines; criação parcial' },
      { processo: 'Marketing Digital', status: 'automatizavel', recurso: 'Agente Analytics + Workflow', observacao: 'Consolidação multicanal + alocação de budget' },
      { processo: 'Redes Sociais', status: 'automatizavel', recurso: 'Agente Social Media', observacao: 'Sugestão de pautas + publicação automática' },
      { processo: 'Conteúdo', status: 'automatizavel', recurso: 'Agente Conteúdo', observacao: 'Blog posts SEO + distribuição multicanal' },
      { processo: 'Anúncios pagos', status: 'parcial', recurso: 'Agente Ads', observacao: 'Monitoramento + sugestões; sem API de plataformas' },
      { processo: 'SEO', status: 'automatizavel', recurso: 'Agente SEO', observacao: 'Auditoria técnica + monitoramento de keywords' },
      { processo: 'Email Marketing', status: 'automatizavel', recurso: 'Agente Email Marketing', observacao: 'Copies otimizadas + automações comportamentais' },
      { processo: 'Funil de conversão', status: 'automatizavel', recurso: 'Agente CRO + Workflow', observacao: 'Análise de taxas + rastreamento de leads' },
    ],
  },
  {
    icon: Cog,
    name: 'Operações & Processos',
    rows: [
      { processo: 'Cadeia de suprimentos', status: 'parcial', recurso: 'Agente Compras', observacao: 'Avaliação de cotações; sem integração fornecedores' },
      { processo: 'Estoque', status: 'parcial', recurso: 'Agente Estoque', observacao: 'Saldo automático + alertas; sem WMS integrado' },
      { processo: 'Logística', status: 'parcial', recurso: 'Agente Logística', observacao: 'Atribuição de transportadora; sem tracking API' },
      { processo: 'Qualidade', status: 'parcial', recurso: 'Agente Qualidade + Workflow', observacao: 'Auditoria interna + gestão de NCs' },
      { processo: 'SOPs', status: 'automatizavel', recurso: 'Agente Processos + Wiki', observacao: 'Geração de SOPs + workflow de revisão' },
      { processo: 'KPIs operacionais', status: 'automatizavel', recurso: 'Agente BI + Dashboard', observacao: 'OEE, lead time, OTIF em tempo real' },
    ],
  },
  {
    icon: Headphones,
    name: 'Atendimento ao Cliente',
    rows: [
      { processo: 'Canais de atendimento', status: 'automatizavel', recurso: 'Agente Atendimento', observacao: 'Resposta automática em canais integrados' },
      { processo: 'SLA', status: 'automatizavel', recurso: 'Motor de SLA', observacao: 'Cálculo automático + alertas em 80% do prazo' },
      { processo: 'Tickets', status: 'automatizavel', recurso: 'Agente Suporte + Workflow', observacao: 'Abertura, categorização e distribuição automáticas' },
      { processo: 'Escalação', status: 'automatizavel', recurso: 'Workflow de escalação', observacao: 'N1→N2→N3 automático com contexto completo' },
      { processo: 'NPS / CSAT', status: 'automatizavel', recurso: 'Agente CX', observacao: 'Pesquisas automáticas + análise de sentimento' },
    ],
  },
  {
    icon: Monitor,
    name: 'TI & Tecnologia',
    rows: [
      { processo: 'Infraestrutura', status: 'parcial', recurso: 'Agente Infraestrutura', observacao: 'Monitoramento + alertas; sem provisionamento' },
      { processo: 'Segurança de TI', status: 'parcial', recurso: 'Agente Segurança', observacao: 'Análise de logs + simulação phishing; sem WAF/IDS' },
      { processo: 'LGPD', status: 'planejado', recurso: 'Agente Compliance LGPD', observacao: 'Rastreamento de coleta; DSAR com SLA' },
      { processo: 'Dev Lifecycle', status: 'automatizavel', recurso: 'Agentes Dev + Workflow', observacao: 'Sprints simuladas + code review + QA' },
      { processo: 'DevOps / CI-CD', status: 'parcial', recurso: 'Agente DevOps', observacao: 'Monitoramento de pipelines; sem infra provisioning' },
    ],
  },
  {
    icon: ShieldCheck,
    name: 'Compliance & Governança',
    rows: [
      { processo: 'Regulatório', status: 'parcial', recurso: 'Agente Compliance', observacao: 'Monitoramento de diários oficiais + renovações' },
      { processo: 'Auditoria interna', status: 'parcial', recurso: 'Agente Auditoria', observacao: 'Papéis de trabalho automáticos; execução manual' },
      { processo: 'Gestão de riscos', status: 'parcial', recurso: 'Agente Riscos + Dashboard', observacao: 'Matriz consolidada + heat map; inputs manuais' },
      { processo: 'Controles internos', status: 'parcial', recurso: 'Agente Controles', observacao: 'Segregação de funções + alçadas automáticas' },
      { processo: 'Anticorrupção', status: 'parcial', recurso: 'Agente Compliance + Workflow', observacao: 'Canal de denúncias + due diligence de fornecedores' },
    ],
  },
  {
    icon: Landmark,
    name: 'Tesouraria & Financeiro',
    rows: [
      { processo: 'Gestão de caixa', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Saldos via integração; projeção 30 dias' },
      { processo: 'Pix / Boleto', status: 'parcial', recurso: 'Agente Cobrança', observacao: 'Emissão automática; conciliação bancária parcial' },
      { processo: 'Crédito', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Monitoramento de vencimentos; sem API bancária' },
      { processo: 'Investimentos', status: 'parcial', recurso: 'Agente Financeiro', observacao: 'Sugestão de aplicação; sem execução automática' },
      { processo: 'Cobrança', status: 'automatizavel', recurso: 'Agente Cobrança + Workflow', observacao: 'Régua automática + escalação jurídica D+60' },
    ],
  },
  {
    icon: Target,
    name: 'Planejamento Estratégico',
    rows: [
      { processo: 'OKRs', status: 'parcial', recurso: 'Agente Planejamento', observacao: 'Criação de ciclos + check-in semanal; sem cascateamento' },
      { processo: 'BSC', status: 'parcial', recurso: 'Agente Planejamento + Dashboard', observacao: 'KPIs mapeados + semáforo; atualização manual' },
      { processo: 'SWOT', status: 'parcial', recurso: 'Agente Planejamento', observacao: 'Coleta de dados + matriz automática; análise anual' },
      { processo: 'Planejamento anual', status: 'parcial', recurso: 'Agente Planejamento + Workflow', observacao: 'Draft automático + fluxo de aprovação' },
      { processo: 'Reuniões de diretoria', status: 'automatizavel', recurso: 'Agente Planejamento', observacao: 'Pauta automática + distribuição de deliberações' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Derived stats                                                      */
/* ------------------------------------------------------------------ */

const allRows = coverageData.flatMap((d) => d.rows);
const countByStatus = (s: CoverageStatus) => allRows.filter((r) => r.status === s).length;

const stats = [
  { label: 'Automatizável', count: countByStatus('automatizavel'), color: 'border-status-success text-status-success' },
  { label: 'Parcial', count: countByStatus('parcial'), color: 'border-status-warning text-status-warning' },
  { label: 'Planejado', count: countByStatus('planejado'), color: 'border-text-muted text-text-muted' },
] as const;

/* ------------------------------------------------------------------ */
/*  Exported content                                                   */
/* ------------------------------------------------------------------ */

export const coberturaContent = (
  <section>
    <SectionHeading id="cobertura" icon={CheckSquare} title="Cobertura do AI Office Sim" />

    <p className="mb-6 text-sm leading-relaxed text-text-secondary">
      Esta matriz compara cada processo descrito no Blueprint com as capacidades reais do AI Office Sim.
      Para cada um dos ~{allRows.length} processos mapeados nos 12 departamentos, indicamos se o software
      já automatiza totalmente, cobre parcialmente ou está planejado para versões futuras.
    </p>

    {/* Summary cards */}
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-4 text-center">
          <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.count}</p>
          <p className={`mt-1 border-t pt-2 text-xs font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Legend */}
    <div className="mb-8 flex flex-wrap gap-4 text-xs">
      {Object.entries(statusConfig).map(([key, cfg]) => (
        <span key={key} className="flex items-center gap-2">
          <span className={`border px-2 py-0.5 font-bold uppercase tracking-wider ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-text-muted">
            {key === 'automatizavel' && '— Agente/Workflow executa o processo'}
            {key === 'parcial' && '— Parte automática, parte manual'}
            {key === 'planejado' && '— Previsto para implementação futura'}
          </span>
        </span>
      ))}
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
                <th className="py-2 pr-4">Recurso</th>
                <th className="py-2">Observação</th>
              </tr>
            </thead>
            <tbody>
              {dept.rows.map((row) => {
                const cfg = statusConfig[row.status];
                return (
                  <tr key={row.processo} className="border-b border-border-default/50">
                    <td className="py-2 pr-4 text-text-primary">{row.processo}</td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-text-secondary">{row.recurso}</td>
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
