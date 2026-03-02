import { Cog, Truck, Package, MapPin, CheckCircle, ClipboardList, BarChart3 } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const operacoesContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  1. Cadeia de Suprimentos                                          */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="cadeia-suprimentos" icon={Truck} title="Cadeia de Suprimentos" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão da cadeia de suprimentos envolve o planejamento, seleção e homologação de
      fornecedores, negociação de compras, acompanhamento de lead time e garantia de que
      insumos cheguem no prazo e custo corretos. Um supply chain bem estruturado reduz
      rupturas de estoque e melhora a margem operacional.
    </p>

    <QuickStart steps={[
      'Mapeie todos os fornecedores ativos e classifique por criticidade (A/B/C)',
      'Defina critérios de homologação: preço, prazo, qualidade e capacidade',
      'Negocie contratos com SLA de entrega e penalidades por atraso',
      'Crie um calendário semanal de pedidos de compra recorrentes',
      'Monitore lead time real vs. prometido e atualize a base de fornecedores',
      'Revise a base de fornecedores trimestralmente e busque alternativas',
    ]} />

    <FeatureList items={[
      'Gerente de Compras — negociação e contratos com fornecedores',
      'Analista de Supply Chain — monitoramento de lead time e reposição',
      'Diretor de Operações — aprovação de fornecedores estratégicos',
    ]} />

    <ProcessCard periodicity="semanal" tools={['ERP', 'Planilha de fornecedores', 'Portal de compras']} />

    <SimMapping items={[
      'Agente de Compras avalia cotações e seleciona automaticamente o melhor fornecedor',
      'Workflow de reposição dispara pedidos quando estoque atinge ponto mínimo',
      'Dashboard de Supply Chain exibe lead time médio e taxa de entrega no prazo',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  2. Gestão de Estoque                                              */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="estoque" icon={Package} title="Gestão de Estoque" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Controlar entradas, saídas e saldo de estoque é essencial para evitar rupturas ou
      excesso de capital imobilizado. A curva ABC prioriza itens de maior impacto financeiro,
      enquanto inventários periódicos garantem a acuracidade dos dados no sistema.
    </p>

    <QuickStart steps={[
      'Cadastre todos os SKUs no ERP/WMS com unidade de medida e lote mínimo',
      'Classifique itens pela curva ABC (A = 80% do valor, B = 15%, C = 5%)',
      'Defina estoque mínimo e ponto de reposição para cada SKU',
      'Registre todas as entradas (NF de compra) e saídas (NF de venda/consumo) diariamente',
      'Realize inventário cíclico semanal nos itens classe A',
    ]} />

    <FeatureList items={[
      'Almoxarife — registro de entradas e saídas físicas',
      'Analista de Estoque — conciliação sistêmica e inventários',
      'Gerente de Operações — decisões de compra baseadas em giro de estoque',
    ]} />

    <ProcessCard periodicity="diario" tools={['ERP', 'WMS', 'Leitor de código de barras']} />

    <SimMapping items={[
      'Agente de Estoque atualiza saldo automaticamente a cada movimentação',
      'Alerta automático quando estoque de item classe A atinge ponto crítico',
      'Relatório semanal de curva ABC gerado pelo módulo de BI do simulador',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  3. Logística                                                      */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="logistica" icon={MapPin} title="Logística" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A logística cuida da expedição, contratação de frete, roteirização e rastreamento de
      entregas. Uma operação logística eficiente reduz custos de transporte e melhora a
      experiência do cliente com entregas pontuais e rastreáveis.
    </p>

    <QuickStart steps={[
      'Defina o processo de picking e packing no centro de distribuição',
      'Negocie tabelas de frete com transportadoras (CIF/FOB)',
      'Implemente rastreamento de entregas em tempo real',
      'Crie roteiros otimizados para entregas na mesma região',
      'Monitore taxa de entrega no prazo (OTIF) diariamente',
    ]} />

    <FeatureList items={[
      'Coordenador de Logística — planejamento de rotas e expedição',
      'Operador de Expedição — separação, embalagem e despacho',
      'Analista de Transportes — negociação de frete e rastreamento',
    ]} />

    <ProcessCard periodicity="diario" tools={['TMS', 'Rastreamento GPS', 'ERP']} />

    <SimMapping items={[
      'Agente de Logística atribui transportadora automaticamente com base em custo e prazo',
      'Workflow de expedição notifica o cliente com código de rastreamento',
      'Dashboard logístico mostra OTIF, custo médio por entrega e ocorrências',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  4. Gestão de Qualidade                                            */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="qualidade" icon={CheckCircle} title="Gestão de Qualidade" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão de qualidade assegura que produtos e processos atendam padrões definidos.
      Baseada na ISO 9001, utiliza ciclos PDCA para melhoria contínua, auditorias internas
      para verificar conformidade e ações corretivas para eliminar não-conformidades.
    </p>

    <QuickStart steps={[
      'Defina a Política de Qualidade da empresa e comunique a todos',
      'Mapeie processos críticos e documente procedimentos operacionais',
      'Implemente ciclo PDCA para cada processo: Plan, Do, Check, Act',
      'Agende auditorias internas trimestrais com checklist padronizado',
      'Registre não-conformidades e acompanhe ações corretivas até conclusão',
      'Revise indicadores de qualidade no comitê trimestral',
    ]} />

    <FeatureList items={[
      'Analista de Qualidade — auditorias, registros de NC e PDCA',
      'Gerente de Qualidade — política, certificações e comitê de qualidade',
      'Todos os colaboradores — execução conforme procedimentos documentados',
    ]} />

    <ProcessCard
      periodicity="trimestral"
      tools={['Sistema de Gestão da Qualidade', 'Checklist digital', 'ISO 9001']}
      legal="ISO 9001:2015, NBR ISO 19011 (auditorias)"
    />

    <SimMapping items={[
      'Agente de Qualidade agenda e conduz auditorias internas automaticamente',
      'Workflow de não-conformidade registra NC, atribui responsável e cobra prazo',
      'Painel de qualidade exibe índice de conformidade e status de ações corretivas',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  5. SOPs                                                           */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="sops" icon={ClipboardList} title="SOPs — Procedimentos Operacionais Padrão" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      SOPs (Standard Operating Procedures) documentam o passo a passo de cada atividade
      operacional. Padronizam a execução, reduzem erros, facilitam o treinamento de novos
      colaboradores e são requisito para certificações como ISO 9001.
    </p>

    <QuickStart steps={[
      'Liste todos os processos operacionais que precisam de documentação',
      'Defina template padrão de SOP: objetivo, escopo, responsáveis, passos, registros',
      'Redija cada SOP com linguagem clara e objetiva, incluindo fluxogramas',
      'Valide com os executores do processo e o gestor da área',
      'Publique no repositório central e treine a equipe',
      'Agende revisão trimestral e controle versões de cada SOP',
    ]} />

    <FeatureList items={[
      'Analista de Processos — redação e atualização de SOPs',
      'Gestor da Área — validação e aprovação dos procedimentos',
      'RH/Treinamento — garantir que novos colaboradores conheçam os SOPs',
    ]} />

    <ProcessCard
      periodicity="trimestral"
      tools={['Wiki/Confluence', 'Google Docs', 'Sistema de gestão documental']}
    />

    <SimMapping items={[
      'Agente de Processos gera rascunho de SOP a partir da descrição da atividade',
      'Workflow de revisão notifica o gestor quando SOP atinge data de revisão',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  6. KPIs Operacionais                                              */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="kpis-operacionais" icon={BarChart3} title="KPIs Operacionais" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      KPIs operacionais medem a eficiência e eficácia dos processos. OEE (Overall Equipment
      Effectiveness) avalia produtividade de máquinas, lead time mede velocidade de entrega,
      e OTIF (On Time In Full) mede a pontualidade e completude das entregas ao cliente.
    </p>

    <QuickStart steps={[
      'Defina os KPIs prioritários para cada área operacional',
      'Estabeleça metas (target) e limites de alerta para cada indicador',
      'Configure coleta automática de dados via ERP/WMS/TMS',
      'Monte dashboard semanal com evolução dos indicadores',
      'Realize reunião semanal de acompanhamento com planos de ação para desvios',
    ]} />

    <FeatureList items={[
      'Analista de Operações — coleta, cálculo e reporte dos KPIs',
      'Gerente de Operações — análise de tendências e definição de metas',
      'Diretoria — acompanhamento estratégico dos indicadores-chave',
    ]} />

    <ProcessCard periodicity="semanal" tools={['ERP', 'BI (Power BI/Metabase)', 'Planilha de KPIs']} />

    <SimMapping items={[
      'Dashboard operacional calcula OEE, lead time e OTIF em tempo real',
      'Agente de BI gera relatório semanal com análise de desvios e recomendações',
      'Alerta automático quando KPI ultrapassa limite crítico definido',
    ]} />
  </section>
);
