import { Headphones, Radio, Clock, Ticket, ArrowUpRight, BarChart3 } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const atendimentoContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  1. Canais de Atendimento                                          */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="canais" icon={Radio} title="Canais de Atendimento" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Definir e gerenciar os canais de atendimento é o primeiro passo para uma operação de
      suporte eficiente. WhatsApp, telefone, email, chat no site e redes sociais devem ser
      integrados em uma plataforma unificada para garantir que nenhuma solicitação se perca
      e que o cliente tenha uma experiência consistente em qualquer canal.
    </p>

    <QuickStart steps={[
      'Mapeie todos os canais onde clientes entram em contato (WhatsApp, telefone, email, chat, redes sociais)',
      'Centralize todos os canais em uma plataforma omnichannel',
      'Defina horário de atendimento e mensagens automáticas fora do expediente',
      'Crie scripts de atendimento padrão para cada canal',
      'Treine a equipe no uso da plataforma e nos scripts',
      'Monitore volume de chamados por canal diariamente',
    ]} />

    <FeatureList items={[
      'Atendente N1 — primeiro contato e triagem em todos os canais',
      'Coordenador de Atendimento — gestão de filas e distribuição de demandas',
      'Gerente de CX — definição de estratégia omnichannel e novos canais',
    ]} />

    <ProcessCard periodicity="diario" tools={['Plataforma omnichannel', 'WhatsApp Business API', 'Chat widget']} />

    <SimMapping items={[
      'Agente de Atendimento responde automaticamente nos canais integrados',
      'Workflow de triagem classifica e encaminha chamados por canal e assunto',
      'Dashboard mostra volume e tempo médio de resposta por canal em tempo real',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  2. SLA de Atendimento                                             */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="sla" icon={Clock} title="SLA de Atendimento" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      SLAs (Service Level Agreements) definem os tempos máximos de primeira resposta e de
      resolução para cada tipo e prioridade de chamado. SLAs claros alinham expectativas com
      o cliente, permitem medir a performance da equipe e identificar gargalos no processo
      de atendimento.
    </p>

    <QuickStart steps={[
      'Defina categorias de chamado (dúvida, problema técnico, reclamação, solicitação)',
      'Estabeleça níveis de prioridade: crítica, alta, média, baixa',
      'Determine tempo de primeira resposta para cada prioridade (ex: crítica = 15min)',
      'Determine tempo de resolução para cada prioridade (ex: crítica = 2h)',
      'Configure alertas automáticos quando SLA estiver próximo de estourar',
      'Revise SLAs mensalmente com base nos resultados alcançados',
    ]} />

    <FeatureList items={[
      'Coordenador de Atendimento — definição e monitoramento de SLAs',
      'Atendentes — cumprimento dos prazos estabelecidos',
      'Gerente de CX — revisão mensal e ajuste de metas de SLA',
    ]} />

    <ProcessCard periodicity="mensal" tools={['Helpdesk (Zendesk/Freshdesk)', 'Dashboard de SLA', 'Alertas automáticos']} />

    <SimMapping items={[
      'Motor de SLA calcula prazos automaticamente com base na prioridade do ticket',
      'Alerta automático para atendente e gestor quando SLA atinge 80% do prazo',
      'Relatório mensal de cumprimento de SLA gerado automaticamente',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  3. Sistema de Tickets                                             */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="tickets" icon={Ticket} title="Sistema de Tickets" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O sistema de tickets é a espinha dorsal do atendimento. Cada solicitação do cliente
      vira um ticket com número único, categoria, prioridade e responsável. A categorização
      correta e a priorização adequada garantem que problemas críticos sejam tratados primeiro
      e que nenhum chamado fique sem resposta.
    </p>

    <QuickStart steps={[
      'Configure o helpdesk com categorias e subcategorias de chamados',
      'Defina regras de priorização automática (ex: palavras-chave, tipo de cliente)',
      'Crie filas de atendimento por equipe/especialidade',
      'Implemente atribuição automática de tickets com base em disponibilidade',
      'Registre todas as interações no histórico do ticket',
    ]} />

    <FeatureList items={[
      'Atendente N1 — abertura, categorização e primeiro atendimento',
      'Atendente N2 — resolução de casos mais complexos',
      'Analista de Atendimento — relatórios e otimização de filas',
    ]} />

    <ProcessCard periodicity="diario" tools={['Zendesk', 'Freshdesk', 'Jira Service Management']} />

    <SimMapping items={[
      'Agente de Suporte abre e categoriza tickets automaticamente a partir de mensagens',
      'Workflow de atribuição distribui tickets entre atendentes por especialidade e carga',
      'Painel de tickets mostra backlog, tempo médio de resolução e tickets em SLA',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  4. Escalação                                                      */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="escalacao" icon={ArrowUpRight} title="Escalação" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A escalação define como chamados avançam entre níveis de suporte quando o atendente
      atual não consegue resolver. N1 trata dúvidas simples, N2 resolve problemas técnicos
      e N3 lida com casos críticos ou que exigem engenharia. Regras claras de escalação
      evitam que o cliente fique preso em um nível sem solução.
    </p>

    <QuickStart steps={[
      'Defina os níveis de suporte: N1 (generalista), N2 (especialista), N3 (engenharia/produto)',
      'Documente critérios objetivos para escalar de um nível para outro',
      'Estabeleça tempo máximo em cada nível antes de escalação automática',
      'Crie canal de comunicação direta entre níveis (ex: Slack dedicado)',
      'Registre toda escalação no ticket com motivo e contexto',
    ]} />

    <FeatureList items={[
      'Atendente N1 — triagem e resolução de casos simples',
      'Especialista N2 — resolução técnica e investigação',
      'Engenheiro N3 — correção de bugs, análise de causa raiz',
      'Coordenador de Atendimento — monitoramento de escalações e gargalos',
    ]} />

    <ProcessCard periodicity="por-demanda" tools={['Helpdesk', 'Slack', 'Sistema de alertas']} />

    <SimMapping items={[
      'Workflow de escalação move ticket automaticamente para N2/N3 com base em regras',
      'Agente notifica o próximo nível com contexto completo do chamado',
      'Dashboard exibe taxa de escalação por categoria e tempo médio em cada nível',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  5. NPS / CSAT                                                     */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="nps-csat" icon={BarChart3} title="NPS / CSAT" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      NPS (Net Promoter Score) mede a lealdade do cliente com a pergunta &quot;De 0 a 10,
      quanto você recomendaria nossa empresa?&quot;. CSAT (Customer Satisfaction Score) mede a
      satisfação pontual após cada atendimento. Juntos, fornecem visão completa da
      experiência do cliente e direcionam melhorias no processo de atendimento.
    </p>

    <QuickStart steps={[
      'Configure envio automático de pesquisa CSAT após fechamento de cada ticket',
      'Envie pesquisa NPS para toda a base de clientes mensalmente',
      'Classifique respostas NPS: Promotores (9-10), Neutros (7-8), Detratores (0-6)',
      'Analise comentários abertos para identificar padrões de reclamação',
      'Apresente resultados na reunião mensal de CX com planos de ação',
      'Acompanhe evolução do NPS e CSAT mês a mês',
    ]} />

    <FeatureList items={[
      'Analista de CX — criação, envio e análise das pesquisas',
      'Gerente de CX — definição de metas e planos de ação',
      'Diretoria — acompanhamento estratégico da satisfação do cliente',
    ]} />

    <ProcessCard periodicity="mensal" tools={['Typeform/Google Forms', 'Helpdesk (CSAT integrado)', 'Planilha de análise']} />

    <SimMapping items={[
      'Agente de CX envia pesquisa CSAT automaticamente após resolução do ticket',
      'Workflow mensal dispara pesquisa NPS e consolida resultados',
      'Dashboard de satisfação exibe NPS, CSAT e análise de sentimento dos comentários',
    ]} />
  </section>
);
