import { ShieldCheck, Scale, ClipboardCheck, AlertTriangle, Lock, Ban } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../../_components/process-card';
import { SimMapping } from '../../../_components/sim-mapping';

export const complianceContent = (
  <section>
    {/* ── 1. Compliance Regulatório ────────────────────────── */}
    <SectionHeading id="regulatorio" icon={ShieldCheck} title="Compliance Regulatório" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Compliance regulatório garante que a empresa opera em conformidade com todas as normas
      setoriais, regulamentações governamentais e requisitos de licenciamento. Cada setor
      possui suas próprias agências reguladoras (ANVISA, BACEN, CVM, ANATEL, etc.) e o
      descumprimento pode resultar em multas, suspensão de atividades ou perda de licenças.
    </p>
    <QuickStart steps={[
      'Identificar todas as normas e regulamentações aplicáveis ao setor da empresa',
      'Mapear licenças, alvarás e autorizações necessárias com prazos de renovação',
      'Designar responsáveis por cada obrigação regulatória',
      'Criar calendário de vencimentos e renovações com alertas antecipados',
      'Monitorar mudanças regulatórias e avaliar impacto na operação',
    ]} />
    <FeatureList items={[
      'Compliance Officer — monitoramento de obrigações e relatórios',
      'Jurídico — interpretação de normas e pareceres',
      'Diretoria — aprovação de políticas e alocação de recursos',
      'Gestores de área — implementação das exigências no dia a dia',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['Compliance.ai', 'Thomson Reuters', 'Planilhas de controle', 'Diário Oficial']}
    />
    <SimMapping items={[
      'Agente de Compliance monitora diários oficiais e alerta sobre novas regulamentações do setor',
      'Workflow de licenças dispara renovações automáticas 60 dias antes do vencimento',
      'Dashboard regulatório exibe status de todas as obrigações com semáforo de criticidade',
    ]} />

    {/* ── 2. Auditoria Interna ─────────────────────────────── */}
    <SectionHeading id="auditoria" icon={ClipboardCheck} title="Auditoria Interna" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A auditoria interna avalia a eficácia dos controles internos, processos e governança
      da empresa. Envolve a elaboração de um plano anual de auditoria, execução dos trabalhos
      de campo, documentação de achados, emissão de relatórios com recomendações e
      acompanhamento da implementação de planos de ação corretivos.
    </p>
    <QuickStart steps={[
      'Elaborar plano anual de auditoria baseado na matriz de riscos',
      'Definir escopo, cronograma e equipe para cada auditoria',
      'Executar trabalhos de campo (entrevistas, testes, amostragem)',
      'Documentar achados com evidências e classificação de severidade',
      'Emitir relatório com recomendações e prazos para correção',
      'Acompanhar implementação dos planos de ação (follow-up)',
    ]} />
    <FeatureList items={[
      'Auditor Interno — execução dos trabalhos e relatórios',
      'Gerente de Auditoria — planejamento e supervisão',
      'Comitê de Auditoria — aprovação do plano e acompanhamento',
      'Gestores auditados — implementação das recomendações',
    ]} />
    <ProcessCard
      periodicity="trimestral"
      tools={['TeamMate', 'AuditBoard', 'Excel', 'Power BI', 'SharePoint']}
    />
    <SimMapping items={[
      'Agente de Auditoria gera automaticamente papéis de trabalho e checklists por processo',
      'Workflow de follow-up rastreia planos de ação e escala itens vencidos para o comitê',
    ]} />

    {/* ── 3. Gestão de Riscos ──────────────────────────────── */}
    <SectionHeading id="riscos" icon={AlertTriangle} title="Gestão de Riscos" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão de riscos identifica, avalia e trata ameaças que podem impactar os objetivos
      da empresa. Utiliza a matriz de riscos (probabilidade x impacto) para priorizar ações
      de mitigação. Inclui riscos operacionais, financeiros, estratégicos, legais e
      reputacionais. O processo deve ser contínuo e integrado à tomada de decisão.
    </p>
    <QuickStart steps={[
      'Realizar workshop de identificação de riscos com todas as áreas',
      'Classificar cada risco por probabilidade e impacto na matriz de riscos',
      'Definir apetite e tolerância a riscos aprovados pela diretoria',
      'Elaborar planos de mitigação com responsáveis e prazos',
      'Monitorar indicadores-chave de risco (KRIs) trimestralmente',
      'Reportar status da gestão de riscos ao conselho/diretoria',
    ]} />
    <FeatureList items={[
      'Gestor de Riscos — coordenação do programa e relatórios',
      'Donos de risco (gestores de área) — identificação e mitigação',
      'Diretoria / Conselho — definição de apetite a risco',
      'Compliance — integração com controles internos',
    ]} />
    <ProcessCard
      periodicity="trimestral"
      tools={['Archer', 'RiskWatch', 'Excel', 'Power BI', 'Matriz de Riscos']}
    />
    <SimMapping items={[
      'Agente de Riscos consolida a matriz automaticamente a partir de inputs das áreas',
      'Dashboard de riscos exibe heat map com probabilidade x impacto em tempo real',
      'Workflow de mitigação notifica donos de risco quando KRIs ultrapassam o limite',
    ]} />

    {/* ── 4. Controles Internos ────────────────────────────── */}
    <SectionHeading id="controles-internos" icon={Lock} title="Controles Internos" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Controles internos são mecanismos que garantem a integridade dos processos, prevenção
      de fraudes e conformidade com políticas. Incluem segregação de funções (nenhum
      colaborador controla um processo inteiro sozinho), definição de alçadas de aprovação,
      conciliações periódicas e revisões de acesso a sistemas.
    </p>
    <QuickStart steps={[
      'Mapear processos críticos e identificar pontos de controle',
      'Implementar segregação de funções (quem solicita não aprova)',
      'Definir matriz de alçadas de aprovação por valor e tipo de operação',
      'Automatizar conciliações (bancária, contábil, estoque)',
      'Revisar acessos a sistemas periodicamente (user access review)',
    ]} />
    <FeatureList items={[
      'Controller / Gerente de Controles Internos — desenho e monitoramento',
      'Gestores de área — execução dos controles no dia a dia',
      'TI — controles de acesso e segregação em sistemas',
      'Auditoria Interna — teste de efetividade dos controles',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['SAP GRC', 'Protiviti', 'Excel', 'ERP (módulo de aprovações)', 'Active Directory']}
    />
    <SimMapping items={[
      'Agente de Controles Internos detecta violações de segregação de funções automaticamente',
      'Workflow de aprovações aplica alçadas configuradas e bloqueia operações fora do limite',
      'Relatório mensal de controles é gerado automaticamente com exceções destacadas',
    ]} />

    {/* ── 5. Anticorrupção ─────────────────────────────────── */}
    <SectionHeading id="anticorrupcao" icon={Ban} title="Anticorrupção" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A Lei 12.846/2013 (Lei Anticorrupção) responsabiliza empresas por atos de corrupção
      contra a administração pública. Um programa de integridade eficaz inclui canal de
      denúncias, due diligence de terceiros, políticas de brindes e hospitalidade, treinamento
      periódico e investigações internas. A existência do programa pode atenuar penalidades.
    </p>
    <QuickStart steps={[
      'Elaborar e publicar o Código de Conduta e Política Anticorrupção',
      'Implementar canal de denúncias anônimo e independente',
      'Realizar due diligence de integridade em terceiros, fornecedores e parceiros',
      'Treinar colaboradores anualmente sobre a Lei Anticorrupção e o código de conduta',
      'Investigar denúncias recebidas e aplicar medidas disciplinares quando necessário',
      'Manter registros e evidências do programa de integridade',
    ]} />
    <FeatureList items={[
      'Compliance Officer — gestão do programa de integridade',
      'Comitê de Ética — análise de denúncias e deliberações',
      'Jurídico — investigações internas e pareceres',
      'RH — treinamentos e medidas disciplinares',
    ]} />
    <ProcessCard
      periodicity="anual"
      tools={['Canal de Denúncias (ICTS, Contato Seguro)', 'Refinitiv World-Check', 'LEC Compliance', 'Planilhas de due diligence']}
      legal="Lei 12.846/2013 (Lei Anticorrupção)"
    />
    <SimMapping items={[
      'Agente de Compliance processa denúncias recebidas e classifica por tipo e severidade',
      'Workflow de due diligence executa checklist automático antes de cadastrar novo fornecedor',
      'Dashboard de integridade exibe métricas do programa (denúncias, treinamentos, DD realizados)',
    ]} />
  </section>
);
