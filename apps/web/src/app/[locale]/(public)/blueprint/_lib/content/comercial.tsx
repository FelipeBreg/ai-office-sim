import { TrendingUp, Users, Search, FileText, FileSignature, RefreshCw, ThumbsUp } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const comercialContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  CRM e Pipeline                                                     */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="crm-pipeline" icon={TrendingUp} title="CRM e Pipeline" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O CRM (Customer Relationship Management) é o sistema central do departamento comercial.
      Ele organiza o funil de vendas em etapas claras — desde o primeiro contato até o fechamento —
      permitindo acompanhar métricas como taxa de conversão, ticket médio e ciclo de venda.
      Um pipeline bem estruturado garante visibilidade sobre cada oportunidade e evita que leads
      se percam no processo.
    </p>
    <QuickStart steps={[
      'Escolha um CRM (HubSpot, Pipedrive, RD Station CRM) e configure as etapas do funil',
      'Defina os campos obrigatórios para cada lead: empresa, contato, valor estimado e origem',
      'Crie regras de movimentação automática entre etapas (ex: proposta enviada → negociação)',
      'Configure dashboards com métricas-chave: leads por etapa, taxa de conversão e tempo médio',
      'Treine a equipe para registrar todas as interações no CRM diariamente',
    ]} />
    <FeatureList items={[
      'Gerente Comercial — define etapas do funil e metas de conversão',
      'SDR (Sales Development Representative) — qualifica e move leads no pipeline',
      'Account Executive — gerencia oportunidades nas etapas finais',
      'Analista de Revenue Ops — mantém dashboards e relatórios atualizados',
    ]} />
    <ProcessCard periodicity="diario" tools={['CRM (HubSpot, Pipedrive)', 'Planilhas de controle', 'BI (Metabase, Power BI)']} />
    <SimMapping items={[
      'Agente de CRM automatiza a movimentação de leads entre etapas com base em gatilhos definidos',
      'Workflow de pipeline gera relatórios diários de funil e alerta sobre oportunidades paradas',
      'Integração com canais de entrada (site, WhatsApp) cria leads automaticamente no sistema',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Prospecção                                                         */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="prospeccao" icon={Search} title="Prospecção" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Prospecção é o processo ativo de identificar e abordar potenciais clientes. Inclui tanto
      estratégias outbound (cold call, cold email, LinkedIn) quanto inbound (leads gerados por
      marketing). A chave está na definição clara do ICP (Ideal Customer Profile) e na qualificação
      rigorosa para garantir que o time comercial foque nos leads com maior potencial de conversão.
    </p>
    <QuickStart steps={[
      'Defina o ICP (Ideal Customer Profile) com critérios claros: setor, porte, localização e dor principal',
      'Monte listas de prospecção usando ferramentas como LinkedIn Sales Navigator ou Apollo.io',
      'Crie cadências de abordagem com sequências de email, ligação e mensagem em redes sociais',
      'Aplique frameworks de qualificação (BANT, SPIN, GPCTBA/C&I) em cada lead',
      'Registre todas as interações e classifique leads como MQL, SQL ou descartado',
      'Revise semanalmente as taxas de resposta e ajuste abordagens conforme necessário',
    ]} />
    <FeatureList items={[
      'SDR — executa prospecção outbound e qualifica leads inbound',
      'Gerente Comercial — define ICP e aprova listas de prospecção',
      'Marketing — fornece leads inbound e materiais de apoio',
    ]} />
    <ProcessCard periodicity="diario" tools={['LinkedIn Sales Navigator', 'Apollo.io', 'CRM', 'Ferramentas de cold email (Lemlist, Woodpecker)']} />
    <SimMapping items={[
      'Agente de prospecção pesquisa e enriquece dados de leads automaticamente usando APIs públicas',
      'Workflow de qualificação aplica score automático baseado nos critérios do ICP',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Propostas Comerciais                                               */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="propostas" icon={FileText} title="Propostas Comerciais" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A proposta comercial é o documento que formaliza a oferta de valor para o cliente. Deve
      incluir escopo, prazos, precificação detalhada, condições de pagamento e diferenciais.
      Templates padronizados aceleram a criação, enquanto o follow-up estruturado aumenta a taxa
      de fechamento. Cada proposta deve ser personalizada para o contexto e as dores específicas
      do prospect.
    </p>
    <QuickStart steps={[
      'Crie templates de proposta com seções padrão: sumário executivo, escopo, investimento e próximos passos',
      'Defina regras de precificação (tabela de preços, descontos por volume, condições especiais)',
      'Personalize cada proposta com dados específicos do prospect obtidos na fase de qualificação',
      'Envie a proposta pelo CRM para rastrear abertura e interações do prospect',
      'Agende follow-up automático 48h após o envio e escalone se não houver resposta em 5 dias',
    ]} />
    <FeatureList items={[
      'Account Executive — elabora e apresenta a proposta ao prospect',
      'Gerente Comercial — aprova descontos acima do limite padrão',
      'Pré-vendas / Consultor Técnico — apoia na definição de escopo técnico',
    ]} />
    <ProcessCard periodicity="por-demanda" tools={['Google Docs / Notion', 'CRM', 'PandaDoc / Proposify', 'Planilha de precificação']} />
    <SimMapping items={[
      'Agente de propostas gera rascunho automaticamente a partir dos dados do lead no CRM',
      'Workflow de precificação calcula valores com base em regras de negócio configuradas',
      'Notificações automáticas alertam o vendedor quando o prospect abre a proposta',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Contratos Comerciais                                               */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="contratos-comerciais" icon={FileSignature} title="Contratos Comerciais" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Após a aprovação da proposta, o contrato formaliza juridicamente a relação comercial.
      O processo inclui negociação de cláusulas, revisão jurídica, assinatura digital e
      arquivamento. A adoção de assinatura eletrônica (DocuSign, Clicksign) acelera o ciclo e
      garante validade legal conforme a MP 2.200-2/2001 e a Lei 14.063/2020.
    </p>
    <QuickStart steps={[
      'Utilize templates de contrato revisados pelo jurídico para cada tipo de serviço/produto',
      'Negocie cláusulas com o cliente e registre todas as alterações em versões controladas',
      'Envie para assinatura digital via plataforma homologada (DocuSign, Clicksign, D4Sign)',
      'Armazene contratos assinados em repositório organizado com metadados (cliente, vigência, valor)',
      'Configure alertas de vencimento para renovação ou renegociação antecipada',
    ]} />
    <FeatureList items={[
      'Account Executive — conduz a negociação e coleta assinaturas',
      'Jurídico — revisa cláusulas e valida conformidade legal',
      'Gerente Comercial — aprova condições especiais fora do padrão',
    ]} />
    <ProcessCard periodicity="por-demanda" tools={['DocuSign / Clicksign / D4Sign', 'CRM', 'Google Drive / SharePoint']} legal="MP 2.200-2/2001, Lei 14.063/2020, Código Civil Art. 421-480" />
    <SimMapping items={[
      'Agente de contratos gera minutas automaticamente a partir da proposta aprovada',
      'Workflow de assinatura dispara envio via API de assinatura digital e rastreia status',
      'Alertas automáticos notificam sobre contratos próximos do vencimento para renovação',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Follow-up                                                          */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="follow-up" icon={RefreshCw} title="Follow-up" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Follow-up é o acompanhamento sistemático dos leads e oportunidades em cada etapa do funil.
      Uma cadência bem definida — combinando email, ligação e mensagens — aumenta significativamente
      a taxa de resposta e conversão. A automação é essencial para escalar o processo sem perder
      a personalização.
    </p>
    <QuickStart steps={[
      'Defina cadências de follow-up para cada etapa do funil (ex: 3 tentativas em 7 dias)',
      'Crie templates de mensagem para cada touchpoint, personalizando com dados do lead',
      'Configure automações no CRM para disparar follow-ups nos horários ideais',
      'Monitore métricas de engajamento: taxa de abertura, resposta e reuniões agendadas',
      'Escalone leads sem resposta após a cadência completa: reclassifique ou arquive',
    ]} />
    <FeatureList items={[
      'SDR — executa cadências de follow-up para leads em prospecção',
      'Account Executive — faz follow-up pós-proposta e durante negociação',
      'Analista de Revenue Ops — configura automações e monitora métricas',
    ]} />
    <ProcessCard periodicity="diario" tools={['CRM (HubSpot, Pipedrive)', 'Ferramentas de automação (Outreach, Salesloft)', 'Email / WhatsApp Business']} />
    <SimMapping items={[
      'Agente de follow-up executa cadências automatizadas com personalização baseada em contexto',
      'Workflow de engajamento analisa respostas e reclassifica leads automaticamente',
      'Alertas inteligentes priorizam leads com maior probabilidade de conversão',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Pós-Venda                                                          */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="pos-venda" icon={ThumbsUp} title="Pós-Venda" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O pós-venda garante a satisfação e retenção do cliente após o fechamento. Inclui o
      onboarding estruturado, acompanhamento do health score, identificação de oportunidades
      de upsell/cross-sell e gestão proativa de churn. Um cliente bem atendido no pós-venda
      gera indicações e aumenta o LTV (Lifetime Value) da base.
    </p>
    <QuickStart steps={[
      'Crie um processo de onboarding com checklist de ativação para cada novo cliente',
      'Defina métricas de health score: uso do produto, NPS, tickets abertos e engajamento',
      'Agende check-ins periódicos (semanal no primeiro mês, quinzenal depois, mensal após estabilização)',
      'Identifique sinais de churn (queda de uso, reclamações) e acione plano de retenção',
      'Mapeie oportunidades de upsell/cross-sell com base no perfil e uso do cliente',
      'Solicite indicações e depoimentos de clientes com health score alto',
    ]} />
    <FeatureList items={[
      'Customer Success Manager — acompanha health score e conduz check-ins',
      'Gerente Comercial — apoia em negociações de upsell e renovação',
      'Suporte / Atendimento — resolve demandas operacionais do cliente',
      'Marketing — coleta depoimentos e cases de sucesso',
    ]} />
    <ProcessCard periodicity="semanal" tools={['CRM', 'Plataforma de CS (Gainsight, Totango, ChurnZero)', 'NPS (Typeform, Delighted)']} />
    <SimMapping items={[
      'Agente de CS monitora health score e dispara alertas automáticos quando há sinais de churn',
      'Workflow de onboarding guia o cliente passo a passo com tarefas e prazos definidos',
      'Relatórios automáticos de base de clientes identificam oportunidades de expansão',
    ]} />
  </section>
);
