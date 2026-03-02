import { Calculator, BarChart3, TrendingDown, ArrowDownCircle, ArrowUpCircle, RefreshCw, PiggyBank } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const contabilidadeContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  DRE                                                                */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="dre" icon={Calculator} title="DRE — Demonstração do Resultado do Exercício" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A DRE é o relatório contábil que apresenta o resultado econômico da empresa em um
      determinado período, detalhando receitas, custos, despesas e o lucro ou prejuízo
      líquido. É obrigatória para todas as empresas tributadas pelo Lucro Real e Lucro
      Presumido, e essencial para a tomada de decisão gerencial.
    </p>

    <QuickStart steps={[
      'Configurar o plano de contas no ERP/sistema contábil com a estrutura da DRE',
      'Classificar corretamente todas as receitas e deduções (impostos sobre vendas)',
      'Apurar o custo das mercadorias vendidas (CMV) ou custo dos serviços prestados (CSP)',
      'Lançar despesas operacionais e administrativas por centro de custo',
      'Calcular o resultado antes e depois do IR/CSLL',
      'Gerar o relatório final e comparar com períodos anteriores',
    ]} />

    <FeatureList items={[
      'Contador — elaboração e validação técnica da DRE',
      'Controller / CFO — análise de margens e indicadores',
      'Diretor Financeiro — tomada de decisão baseada em resultado',
      'Auditor — verificação de conformidade e consistência',
    ]} />

    <ProcessCard
      periodicity="mensal"
      tools={['ERP / sistema contábil', 'Planilhas de controle', 'Sistema de notas fiscais']}
      legal="Lei 6.404/76 (Lei das S/A), NBC TG 26 (CPC 26) — Apresentação das Demonstrações Contábeis"
    />

    <SimMapping items={[
      'Agente Contador gera a DRE automaticamente a partir dos lançamentos do período',
      'Dashboard financeiro exibe margens bruta, operacional e líquida em tempo real',
      'Alertas automáticos quando a margem cai abaixo do limite definido',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Balanço Patrimonial                                                */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="balanco" icon={BarChart3} title="Balanço Patrimonial" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O Balanço Patrimonial é a demonstração contábil que retrata a posição financeira
      da empresa em uma data específica, dividindo-se em Ativo (bens e direitos),
      Passivo (obrigações) e Patrimônio Líquido (capital dos sócios). Funciona como
      uma fotografia do patrimônio empresarial.
    </p>

    <QuickStart steps={[
      'Classificar todos os bens e direitos no Ativo (circulante e não circulante)',
      'Registrar todas as obrigações no Passivo (circulante e não circulante)',
      'Apurar o Patrimônio Líquido (capital social, reservas, lucros/prejuízos acumulados)',
      'Verificar a equação fundamental: Ativo = Passivo + Patrimônio Líquido',
      'Elaborar notas explicativas para itens relevantes',
    ]} />

    <FeatureList items={[
      'Contador — elaboração e fechamento do balanço',
      'Controller — análise de indicadores patrimoniais (liquidez, endividamento)',
      'Auditor — auditoria e validação dos saldos',
      'Sócios / Investidores — acompanhamento da evolução patrimonial',
    ]} />

    <ProcessCard
      periodicity="anual"
      tools={['ERP / sistema contábil', 'Conciliação de contas', 'Inventário físico']}
      legal="Lei 6.404/76, NBC TG 26 (CPC 26), Código Civil art. 1.179"
    />

    <SimMapping items={[
      'Agente Contador consolida automaticamente os saldos de todas as contas patrimoniais',
      'Comparativo automático entre períodos com destaque para variações significativas',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Fluxo de Caixa                                                     */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="fluxo-caixa" icon={TrendingDown} title="Fluxo de Caixa" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O Fluxo de Caixa registra todas as entradas e saídas de dinheiro da empresa,
      podendo ser elaborado pelo método direto (movimentações reais) ou indireto
      (ajustes a partir do lucro líquido). A projeção de fluxo de caixa é vital para
      garantir que a empresa tenha liquidez para honrar seus compromissos.
    </p>

    <QuickStart steps={[
      'Definir o método de apuração (direto ou indireto) conforme necessidade',
      'Registrar todas as entradas (vendas, recebimentos, empréstimos)',
      'Registrar todas as saídas (fornecedores, salários, impostos, investimentos)',
      'Classificar movimentações em operacionais, de investimento e de financiamento',
      'Elaborar projeção de caixa para os próximos 30, 60 e 90 dias',
      'Monitorar o saldo diário e acionar alertas de caixa mínimo',
    ]} />

    <FeatureList items={[
      'Tesoureiro — controle diário de entradas e saídas',
      'CFO / Diretor Financeiro — análise de liquidez e projeções',
      'Analista Financeiro — elaboração e acompanhamento do fluxo',
      'Contador — conciliação com a DRE e balanço',
    ]} />

    <ProcessCard
      periodicity="diario"
      tools={['ERP / sistema financeiro', 'Internet banking', 'Planilha de projeção de caixa']}
      legal="NBC TG 03 (CPC 03) — Demonstração dos Fluxos de Caixa"
    />

    <SimMapping items={[
      'Agente Tesoureiro atualiza o fluxo de caixa automaticamente a cada transação',
      'Projeção automática de caixa com base em contas a receber e a pagar agendadas',
      'Alerta proativo quando a projeção indica saldo negativo nos próximos dias',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Contas a Receber                                                   */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="contas-receber" icon={ArrowDownCircle} title="Contas a Receber" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O controle de Contas a Receber abrange todo o ciclo de recebimento, desde a
      emissão da fatura até a baixa do pagamento. Inclui a gestão de aging
      (envelhecimento de títulos), cobrança de inadimplentes e análise de crédito
      para minimizar o risco de inadimplência.
    </p>

    <QuickStart steps={[
      'Emitir fatura/boleto vinculado à nota fiscal de venda',
      'Registrar o título a receber no sistema financeiro com vencimento e condições',
      'Acompanhar diariamente os recebimentos e efetuar as baixas',
      'Gerar relatório de aging (vencidos e a vencer por faixa de dias)',
      'Acionar cobrança para títulos vencidos (e-mail, telefone, carta)',
      'Provisionar perdas esperadas com créditos de liquidação duvidosa (PCLD)',
    ]} />

    <FeatureList items={[
      'Analista Financeiro — controle diário e baixas de recebimentos',
      'Gerente de Cobrança — negociação e recuperação de crédito',
      'Comercial — suporte na resolução de pendências com clientes',
      'Contador — provisão de PCLD e conciliação contábil',
    ]} />

    <ProcessCard
      periodicity="diario"
      tools={['ERP / módulo financeiro', 'Gateway de pagamentos', 'Régua de cobrança automatizada']}
      legal="Código Civil art. 394-401 (mora), Lei 9.492/97 (protesto de títulos)"
    />

    <SimMapping items={[
      'Agente Financeiro monitora vencimentos e dispara cobrança automática por régua configurável',
      'Dashboard de aging com visão por cliente, faixa de atraso e valor total em aberto',
      'Integração com gateway de pagamentos para baixa automática de boletos e Pix',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Contas a Pagar                                                     */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="contas-pagar" icon={ArrowUpCircle} title="Contas a Pagar" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O processo de Contas a Pagar gerencia todas as obrigações financeiras da empresa
      com fornecedores, prestadores de serviço, tributos e encargos. Inclui o fluxo
      de aprovação de pagamentos, agendamento bancário e controle de vencimentos para
      evitar multas e juros.
    </p>

    <QuickStart steps={[
      'Receber e conferir a nota fiscal / documento de cobrança do fornecedor',
      'Vincular ao pedido de compra ou contrato para validação',
      'Submeter para aprovação conforme alçada (gerente, diretor)',
      'Agendar o pagamento no internet banking respeitando a data de vencimento',
      'Efetuar a baixa no sistema financeiro após confirmação bancária',
    ]} />

    <FeatureList items={[
      'Analista Financeiro — conferência, cadastro e agendamento de pagamentos',
      'Gerente / Diretor — aprovação conforme alçada de valor',
      'Compras — validação do pedido de compra e recebimento',
      'Contador — classificação contábil e conciliação',
    ]} />

    <ProcessCard
      periodicity="diario"
      tools={['ERP / módulo financeiro', 'Internet banking', 'Sistema de aprovação (workflow)']}
      legal="Código Civil art. 394 (mora do devedor), Lei 10.406/02"
    />

    <SimMapping items={[
      'Agente Financeiro processa contas a pagar com workflow de aprovação automático por alçada',
      'Agendamento bancário automático com priorização por vencimento e desconto por antecipação',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Conciliação Bancária                                               */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="conciliacao" icon={RefreshCw} title="Conciliação Bancária" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A Conciliação Bancária é o processo de confrontar os registros financeiros internos
      da empresa com os extratos fornecidos pelo banco, identificando divergências como
      lançamentos não reconhecidos, valores incorretos ou transações pendentes. É
      fundamental para garantir a integridade dos dados financeiros.
    </p>

    <QuickStart steps={[
      'Importar o extrato bancário (OFX/CSV) no sistema financeiro ou ERP',
      'Confrontar automaticamente os lançamentos internos com o extrato',
      'Identificar e investigar as divergências (lançamentos sem par)',
      'Regularizar lançamentos faltantes ou duplicados',
      'Gerar relatório de conciliação com saldo conciliado',
    ]} />

    <FeatureList items={[
      'Analista Financeiro — execução diária da conciliação',
      'Controller — revisão e validação periódica',
      'Contador — ajustes contábeis necessários',
      'Auditor — verificação da efetividade do processo',
    ]} />

    <ProcessCard
      periodicity="diario"
      tools={['ERP / módulo conciliação', 'Internet banking (extrato OFX)', 'Planilha de apoio']}
      legal="NBC TG 1000 (contabilidade para PMEs), Resolução CFC 1.330/11"
    />

    <SimMapping items={[
      'Agente Financeiro importa extratos e executa conciliação automática por matching inteligente',
      'Divergências são sinalizadas automaticamente para revisão humana',
      'Histórico completo de conciliações com trilha de auditoria',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Orçamento Empresarial                                              */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="orcamento" icon={PiggyBank} title="Orçamento Empresarial" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O Orçamento Empresarial é a ferramenta de planejamento financeiro que projeta receitas,
      custos e despesas para o próximo exercício. Serve como guia para a execução financeira
      e permite o acompanhamento mensal do realizado versus orçado, facilitando ajustes de
      rota e controle de gastos.
    </p>

    <QuickStart steps={[
      'Definir premissas orçamentárias (crescimento, inflação, câmbio, headcount)',
      'Coletar projeções de cada departamento (bottom-up) e consolidar',
      'Submeter para aprovação da diretoria e conselho',
      'Distribuir o orçamento aprovado por centro de custo e mês',
      'Acompanhar mensalmente o realizado vs. orçado (análise de variação)',
      'Revisar o orçamento no meio do ano (forecast / re-forecast)',
    ]} />

    <FeatureList items={[
      'Controller / FP&A — consolidação e acompanhamento orçamentário',
      'Gerentes de área — elaboração do orçamento departamental',
      'CFO / Diretor Financeiro — validação e aprovação final',
      'CEO / Diretoria — aprovação estratégica e priorização de investimentos',
    ]} />

    <ProcessCard
      periodicity="anual"
      tools={['ERP / módulo orçamentário', 'Planilhas de planejamento', 'BI / dashboards']}
      legal="Governança corporativa (IBGC), práticas de controladoria"
    />

    <SimMapping items={[
      'Agente Controller consolida orçamentos departamentais e gera o orçamento unificado',
      'Análise automática de variação realizado vs. orçado com alertas por centro de custo',
      'Projeção de cenários (otimista, realista, pessimista) com base em premissas configuráveis',
    ]} />
  </section>
);
