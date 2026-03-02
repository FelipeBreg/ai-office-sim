import { Target, Flag, BarChart3, Compass, Calendar, Users } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const planejamentoContent = (
  <section>
    {/* ---------- OKRs ---------- */}
    <SectionHeading id="okrs" icon={Target} title="OKRs" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      OKRs (Objectives and Key Results) são a principal ferramenta para alinhar a empresa em
      torno de objetivos ambiciosos e mensuráveis. Cada objetivo define o &quot;onde queremos
      chegar&quot; e os key results definem o &quot;como saberemos que chegamos&quot;. A cadência
      trimestral permite ajustes rápidos sem perder o foco estratégico de longo prazo.
    </p>
    <QuickStart steps={[
      'Defina de 3 a 5 objetivos estratégicos para o trimestre',
      'Para cada objetivo, crie de 2 a 4 key results mensuráveis',
      'Desdobre os OKRs da empresa para os times (cascateamento)',
      'Realize check-ins semanais para atualizar o progresso dos KRs',
      'Ao final do trimestre, pontue cada KR (0 a 1.0) e faça retrospectiva',
      'Use os aprendizados para calibrar os OKRs do próximo ciclo',
    ]} />
    <FeatureList items={[
      'CEO / Diretoria — definição dos OKRs corporativos',
      'Gestores de Área — desdobramento para os times',
      'Todos os colaboradores — execução e atualização dos KRs',
    ]} />
    <ProcessCard periodicity="trimestral" tools={['Planilha de OKRs', 'Software de gestão (Perdoo, Weekdone)', 'Apresentação executiva']} legal="Não há obrigatoriedade legal — prática de gestão" />
    <SimMapping items={[
      'Agente de Planejamento cria ciclos de OKRs e distribui para os agentes de cada departamento',
      'Workflow de check-in semanal coleta progresso e gera relatório consolidado',
      'Dashboard de OKRs com pontuação em tempo real e histórico de ciclos',
    ]} />

    {/* ---------- BSC ---------- */}
    <SectionHeading id="bsc" icon={BarChart3} title="Balanced Scorecard (BSC)" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O Balanced Scorecard traduz a estratégia em indicadores distribuídos em quatro
      perspectivas: financeira, clientes, processos internos e aprendizado &amp; crescimento.
      Essa visão equilibrada impede que a empresa otimize uma área em detrimento de outra,
      garantindo desenvolvimento sustentável e alinhado com a visão de longo prazo.
    </p>
    <QuickStart steps={[
      'Defina a visão e a estratégia de longo prazo da empresa',
      'Estabeleça objetivos para cada perspectiva (financeira, clientes, processos, aprendizado)',
      'Crie indicadores (KPIs) para cada objetivo com metas e prazos',
      'Monte o mapa estratégico mostrando relações de causa e efeito',
      'Colete dados e atualize o scorecard trimestralmente',
      'Revise e ajuste a estratégia com base nos resultados',
    ]} />
    <FeatureList items={[
      'Diretoria — definição da estratégia e mapa estratégico',
      'Controller / PMO — coleta de dados e atualização dos indicadores',
      'Gestores de Área — execução dos planos de ação de cada perspectiva',
    ]} />
    <ProcessCard periodicity="trimestral" tools={['Mapa estratégico (Miro, PowerPoint)', 'Planilha de indicadores', 'BI / dashboard']} legal="Não há obrigatoriedade legal — prática de gestão estratégica" />
    <SimMapping items={[
      'Agente de Planejamento mapeia KPIs de cada perspectiva e coleta dados dos demais agentes',
      'Dashboard BSC com semáforo (verde/amarelo/vermelho) por indicador',
    ]} />

    {/* ---------- Análise SWOT ---------- */}
    <SectionHeading id="swot" icon={Compass} title="Análise SWOT" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A análise SWOT (Forças, Fraquezas, Oportunidades e Ameaças) é uma ferramenta de
      diagnóstico estratégico que avalia o ambiente interno e externo da empresa. Forças e
      fraquezas são fatores internos controláveis; oportunidades e ameaças vêm do mercado,
      concorrência, regulação e macroeconomia. O resultado orienta onde investir, o que corrigir
      e como se posicionar.
    </p>
    <QuickStart steps={[
      'Reúna a liderança para sessão de brainstorming estruturado',
      'Liste as forças (vantagens competitivas, recursos, reputação)',
      'Liste as fraquezas (gaps de competência, processos falhos, custos altos)',
      'Mapeie as oportunidades (tendências de mercado, novos segmentos, tecnologia)',
      'Mapeie as ameaças (concorrentes, regulação, crise econômica)',
      'Priorize ações cruzando forças × oportunidades e fraquezas × ameaças',
    ]} />
    <FeatureList items={[
      'CEO / Diretoria — condução da análise e priorização',
      'Gestores de Área — insumos sobre forças e fraquezas internas',
      'Inteligência de Mercado — dados sobre oportunidades e ameaças externas',
    ]} />
    <ProcessCard periodicity="anual" tools={['Template SWOT (Miro, FigJam)', 'Pesquisa de mercado', 'Relatórios setoriais']} legal="Não há obrigatoriedade legal — prática de gestão estratégica" />
    <SimMapping items={[
      'Agente de Planejamento coleta dados internos (financeiros, operacionais) e externos (mercado)',
      'Workflow anual gera matriz SWOT automatizada com base nos KPIs e tendências detectadas',
      'Relatório executivo com plano de ação sugerido para cada quadrante',
    ]} />

    {/* ---------- Planejamento Anual ---------- */}
    <SectionHeading id="planejamento-anual" icon={Calendar} title="Planejamento Anual" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O planejamento anual consolida a estratégia em um plano operacional com orçamento
      detalhado, metas por área, cronograma de entregas e alocação de recursos. É o documento
      que transforma a visão de longo prazo em ações concretas para os próximos 12 meses,
      servindo de referência para aprovação de investimentos e avaliação de desempenho.
    </p>
    <QuickStart steps={[
      'Realize a análise SWOT e revisão do BSC do ano anterior',
      'Defina as metas macro (receita, margem, crescimento, satisfação)',
      'Elabore o orçamento anual (receitas, custos, investimentos - CAPEX/OPEX)',
      'Desdobre metas e orçamento por departamento',
      'Monte o cronograma de entregas e marcos (milestones) trimestrais',
      'Apresente e aprove em reunião de diretoria',
    ]} />
    <FeatureList items={[
      'CEO — visão estratégica e aprovação final',
      'CFO — orçamento e projeções financeiras',
      'Gestores de Área — metas departamentais e planos de ação',
      'Controller / PMO — consolidação e acompanhamento',
    ]} />
    <ProcessCard periodicity="anual" tools={['ERP / BI', 'Planilha orçamentária', 'Apresentação executiva', 'Software de planejamento']} legal="Lei 6.404/76 (orçamento e demonstrações), estatuto social" />
    <SimMapping items={[
      'Agente de Planejamento consolida dados de todos os departamentos e gera draft do plano',
      'Workflow de aprovação encaminha o plano para cada diretor com prazo de revisão',
      'Dashboard de execução acompanha realizado vs. planejado ao longo do ano',
    ]} />

    {/* ---------- Reuniões de Diretoria ---------- */}
    <SectionHeading id="reunioes-diretoria" icon={Users} title="Reuniões de Diretoria" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      As reuniões de diretoria são o principal fórum de governança da empresa. Nelas são
      avaliados os indicadores de desempenho, deliberadas decisões estratégicas, aprovados
      investimentos e alinhadas as prioridades entre áreas. Uma boa reunião exige pauta
      estruturada, dados atualizados, ata formal e acompanhamento rigoroso das deliberações.
    </p>
    <QuickStart steps={[
      'Defina a pauta com antecedência mínima de 48h e distribua aos participantes',
      'Prepare o material de apoio (dashboards, relatórios, propostas)',
      'Conduza a reunião com timeboxing para cada tema da pauta',
      'Registre as deliberações em ata formal com responsáveis e prazos',
      'Distribua a ata aprovada em até 24h após a reunião',
      'Acompanhe a execução das deliberações na reunião seguinte',
    ]} />
    <FeatureList items={[
      'CEO — condução e pauta estratégica',
      'Diretores — apresentação de resultados e propostas',
      'Secretária Executiva / PMO — elaboração da ata e acompanhamento',
    ]} />
    <ProcessCard periodicity="mensal" tools={['Agenda corporativa', 'BI / dashboards', 'Template de ata', 'Sistema de gestão de deliberações']} legal="Código Civil art. 1.060-1.065, Lei 6.404/76 (para S.A.), estatuto social" />
    <SimMapping items={[
      'Agente de Planejamento gera pauta automática com base nos KPIs que precisam de atenção',
      'Workflow pós-reunião distribui deliberações como tarefas para os agentes responsáveis',
      'Dashboard de deliberações mostra status de execução e pendências',
    ]} />
  </section>
);
