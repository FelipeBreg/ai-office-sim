import { Landmark, Wallet, CreditCard, TrendingUp, PiggyBank, Receipt } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const tesourariaContent = (
  <section>
    {/* ---------- Gestão de Caixa ---------- */}
    <SectionHeading id="gestao-caixa" icon={Wallet} title="Gestão de Caixa" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão de caixa é o coração financeiro da empresa. Envolve o controle diário do saldo
      disponível, a projeção de entradas e saídas para os próximos dias e a manutenção de uma
      reserva de segurança para imprevistos. Um fluxo de caixa bem gerido evita surpresas,
      permite negociar melhores prazos e garante que a operação nunca pare por falta de recursos.
    </p>
    <QuickStart steps={[
      'Consolide todos os saldos bancários no início do dia',
      'Lance as entradas previstas (recebíveis, vendas, transferências)',
      'Lance as saídas previstas (fornecedores, folha, impostos, aluguel)',
      'Calcule o saldo projetado para os próximos 7, 15 e 30 dias',
      'Defina a reserva mínima de segurança (ex.: 2 meses de custo fixo)',
      'Atualize a planilha ou sistema ERP ao final do expediente',
    ]} />
    <FeatureList items={[
      'Tesoureiro — execução e atualização diária do caixa',
      'Controller / CFO — aprovação de pagamentos acima do limite',
      'Analista Financeiro — projeção e análise de tendência',
    ]} />
    <ProcessCard periodicity="diario" tools={['ERP financeiro', 'Planilha de fluxo de caixa', 'Internet banking']} legal="Lei 6.404/76 (contabilidade societária)" />
    <SimMapping items={[
      'Agente Financeiro atualiza saldos automaticamente via integração bancária',
      'Workflow diário de conciliação gera alertas quando saldo fica abaixo da reserva',
      'Dashboard de caixa em tempo real com projeção de 30 dias',
    ]} />

    {/* ---------- Pix e Boleto ---------- */}
    <SectionHeading id="pix-boleto" icon={Receipt} title="Pix e Boleto" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Pix e boleto bancário são os principais meios de recebimento no Brasil. A gestão eficiente
      envolve emissão automatizada de cobranças, conciliação diária dos pagamentos recebidos
      com o contas a receber e integração direta com a API do banco para eliminar processos
      manuais e reduzir erros de lançamento.
    </p>
    <QuickStart steps={[
      'Configure a integração com a API bancária (Pix e registro de boletos)',
      'Automatize a emissão de boleto/Pix no momento da venda ou faturamento',
      'Realize a conciliação bancária diária (baixa automática dos recebimentos)',
      'Trate divergências: pagamentos parciais, duplicados ou não identificados',
      'Gere relatório diário de recebimentos vs. previsão',
    ]} />
    <FeatureList items={[
      'Analista de Contas a Receber — conciliação e baixa',
      'Tesoureiro — supervisão de saldos e transferências',
      'TI / Integração — manutenção da API bancária',
    ]} />
    <ProcessCard periodicity="diario" tools={['API bancária', 'ERP', 'Gateway de pagamento', 'Planilha de conciliação']} legal="Lei 12.865/2013 (arranjos de pagamento), Regulamentação Bacen Pix" />
    <SimMapping items={[
      'Agente de Cobrança emite Pix/boleto automaticamente ao criar fatura',
      'Workflow de conciliação cruza extrato bancário com contas a receber',
      'Notificações automáticas para o time financeiro em caso de divergência',
    ]} />

    {/* ---------- Gestão de Crédito ---------- */}
    <SectionHeading id="credito" icon={CreditCard} title="Gestão de Crédito" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão de crédito abrange a análise e contratação de linhas de financiamento, capital
      de giro e antecipação de recebíveis. Inclui a avaliação das melhores taxas, o controle
      das garantias exigidas e o acompanhamento do custo efetivo total (CET) para garantir que
      o endividamento esteja sempre dentro de limites saudáveis.
    </p>
    <QuickStart steps={[
      'Mapeie as necessidades de crédito (capital de giro, investimento, antecipação)',
      'Compare propostas de pelo menos 3 instituições financeiras',
      'Analise o CET (Custo Efetivo Total) de cada proposta',
      'Formalize a contratação com revisão jurídica do contrato',
      'Registre as garantias oferecidas e prazos de vencimento',
      'Acompanhe mensalmente o saldo devedor e o custo financeiro',
    ]} />
    <FeatureList items={[
      'CFO / Diretor Financeiro — aprovação e estratégia de crédito',
      'Tesoureiro — operacionalização e relacionamento bancário',
      'Jurídico — revisão de contratos e garantias',
    ]} />
    <ProcessCard periodicity="mensal" tools={['ERP financeiro', 'Planilha de endividamento', 'Internet banking', 'CND / Serasa']} legal="Lei 4.595/64 (sistema financeiro), Resolução CMN 4.557/2017" />
    <SimMapping items={[
      'Agente Financeiro monitora vencimentos e sugere renegociação automática',
      'Dashboard de endividamento mostra CET, saldo devedor e limites disponíveis',
    ]} />

    {/* ---------- Investimentos ---------- */}
    <SectionHeading id="investimentos" icon={TrendingUp} title="Investimentos" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A política de investimentos da tesouraria define onde alocar o caixa excedente para
      maximizar a rentabilidade sem comprometer a liquidez. Inclui aplicações em CDB, fundos
      de renda fixa, títulos públicos e operações compromissadas, sempre respeitando o perfil
      de risco da empresa e a necessidade de resgate rápido.
    </p>
    <QuickStart steps={[
      'Defina a política de investimentos (perfil de risco, prazo, liquidez mínima)',
      'Identifique o caixa excedente disponível para aplicação',
      'Compare rentabilidade líquida (descontando IR e IOF) entre opções',
      'Realize a aplicação via internet banking ou plataforma de investimentos',
      'Acompanhe mensalmente a rentabilidade e o saldo das aplicações',
    ]} />
    <FeatureList items={[
      'CFO — definição da política e aprovação de aplicações',
      'Tesoureiro — execução e monitoramento das aplicações',
      'Controller — controle contábil e reporte',
    ]} />
    <ProcessCard periodicity="mensal" tools={['Plataforma de investimentos', 'Internet banking', 'ERP financeiro', 'Planilha de rendimentos']} legal="Instrução CVM aplicável, Lei 6.404/76 (demonstrações financeiras)" />
    <SimMapping items={[
      'Agente Financeiro calcula caixa excedente e sugere aplicação ideal',
      'Workflow mensal de revisão de carteira com comparativo de rentabilidade',
      'Alertas automáticos para vencimentos e oportunidades de resgate',
    ]} />

    {/* ---------- Cobrança ---------- */}
    <SectionHeading id="cobranca" icon={PiggyBank} title="Cobrança" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O processo de cobrança estruturado — a chamada régua de cobrança — define ações
      automáticas e manuais em cada etapa do atraso: lembrete antes do vencimento, notificação
      no dia, contato amigável após poucos dias, negativação em bureaus de crédito e, em último
      caso, protesto cartorário ou cobrança judicial. O objetivo é recuperar valores com o menor
      desgaste possível no relacionamento com o cliente.
    </p>
    <QuickStart steps={[
      'Defina a régua de cobrança (D-3, D+0, D+5, D+15, D+30, D+60, D+90)',
      'Configure envio automático de lembretes e notificações por e-mail/SMS',
      'Realize contato amigável (telefone/WhatsApp) após D+5',
      'Envie carta de cobrança formal após D+15',
      'Negativação em Serasa/SPC após D+30 de atraso',
      'Encaminhe para protesto cartorário ou jurídico após D+60',
    ]} />
    <FeatureList items={[
      'Analista de Cobrança — execução da régua e contato com clientes',
      'Supervisor Financeiro — acompanhamento da inadimplência e escalação',
      'Jurídico — protesto, cobrança judicial e acordos',
    ]} />
    <ProcessCard periodicity="diario" tools={['ERP / CRM', 'Plataforma de cobrança', 'Serasa/SPC', 'Sistema de protesto eletrônico']} legal="Código Civil art. 394-401, CDC art. 42, Lei 9.492/97 (protesto)" />
    <SimMapping items={[
      'Agente de Cobrança executa a régua automaticamente com base na data de vencimento',
      'Workflow de escalação envia alertas ao jurídico quando atinge D+60',
      'Dashboard de inadimplência com aging report e taxa de recuperação',
    ]} />
  </section>
);
