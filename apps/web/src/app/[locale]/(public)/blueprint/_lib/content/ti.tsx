import { Monitor, Server, Shield, Lock, Code, GitBranch } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../../_components/process-card';
import { SimMapping } from '../../../_components/sim-mapping';

export const tiContent = (
  <section>
    {/* ── 1. Infraestrutura ─────────────────────────────────── */}
    <SectionHeading id="infraestrutura" icon={Server} title="Infraestrutura" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A infraestrutura de TI é a espinha dorsal de qualquer empresa digital. Envolve o
      provisionamento e manutenção de servidores (on-premise ou cloud), configuração de rede,
      políticas de backup e disaster recovery. Sem uma infraestrutura sólida, todos os demais
      processos de tecnologia ficam comprometidos.
    </p>
    <QuickStart steps={[
      'Definir a arquitetura de infraestrutura (on-premise, cloud ou híbrida)',
      'Provisionar servidores e configurar redes (VPN, firewall, DNS)',
      'Implementar rotina de backup automatizado com verificação diária',
      'Configurar monitoramento de uptime e alertas (CPU, memória, disco)',
      'Documentar runbooks para incidentes e disaster recovery',
      'Realizar testes periódicos de restore e failover',
    ]} />
    <FeatureList items={[
      'SysAdmin / Engenheiro de Infraestrutura — provisionamento e manutenção',
      'DevOps Engineer — automação de infraestrutura como código (IaC)',
      'CTO / Head de TI — decisões estratégicas de arquitetura',
      'NOC (Network Operations Center) — monitoramento 24/7',
    ]} />
    <ProcessCard
      periodicity="diario"
      tools={['AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Zabbix', 'Grafana']}
    />
    <SimMapping items={[
      'Agente de Infraestrutura monitora servidores e dispara alertas automáticos de capacidade',
      'Workflow de backup verifica execução diária e notifica falhas ao responsável',
      'Dashboard de infra consolida métricas de uptime, latência e uso de recursos em tempo real',
    ]} />

    {/* ── 2. Segurança da Informação ───────────────────────── */}
    <SectionHeading id="seguranca-ti" icon={Shield} title="Segurança da Informação" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Segurança da informação abrange todas as medidas para proteger dados e sistemas contra
      acessos não autorizados, ataques cibernéticos e vazamentos. Inclui firewall, antivírus
      corporativo, políticas de senhas, gestão de vulnerabilidades e resposta a incidentes.
      É um processo contínuo que exige vigilância diária.
    </p>
    <QuickStart steps={[
      'Implementar firewall de próxima geração e segmentar a rede',
      'Instalar e configurar antivírus/EDR em todos os endpoints',
      'Definir política de senhas (complexidade, rotação, MFA obrigatório)',
      'Realizar varreduras de vulnerabilidade semanais',
      'Criar plano de resposta a incidentes com papéis definidos',
    ]} />
    <FeatureList items={[
      'Analista de Segurança da Informação — monitoramento e resposta a incidentes',
      'CISO (Chief Information Security Officer) — estratégia e políticas',
      'Pentest / Red Team — testes de penetração periódicos',
      'Todos os colaboradores — conscientização e boas práticas',
    ]} />
    <ProcessCard
      periodicity="diario"
      tools={['CrowdStrike', 'Fortinet', 'Qualys', 'Splunk', 'Okta', 'Vault']}
    />
    <SimMapping items={[
      'Agente de Segurança analisa logs em tempo real e classifica ameaças automaticamente',
      'Workflow de incidentes escala automaticamente para o CISO quando severidade é alta',
      'Simulações de phishing são geradas e enviadas periodicamente para treinar colaboradores',
    ]} />

    {/* ── 3. LGPD ──────────────────────────────────────────── */}
    <SectionHeading id="lgpd" icon={Lock} title="LGPD — Lei Geral de Proteção de Dados" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A Lei 13.709/2018 (LGPD) regulamenta o tratamento de dados pessoais no Brasil. Toda
      empresa que coleta, armazena ou processa dados pessoais deve estar em conformidade.
      Isso inclui mapeamento de dados, nomeação de um DPO (Encarregado de Dados), gestão de
      consentimentos, relatórios de impacto e atendimento a direitos dos titulares.
    </p>
    <QuickStart steps={[
      'Nomear o DPO (Encarregado de Proteção de Dados) e registrar na ANPD',
      'Realizar inventário completo de dados pessoais (data mapping)',
      'Implementar mecanismo de coleta e gestão de consentimento',
      'Elaborar Relatório de Impacto à Proteção de Dados (RIPD)',
      'Criar canal para atendimento de direitos dos titulares (acesso, exclusão, portabilidade)',
      'Treinar equipes sobre boas práticas de proteção de dados',
    ]} />
    <FeatureList items={[
      'DPO (Encarregado de Dados) — ponto focal para ANPD e titulares',
      'Jurídico — análise de contratos e bases legais de tratamento',
      'TI / Segurança — controles técnicos e anonimização',
      'Todos os departamentos — coleta e tratamento adequado de dados',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['OneTrust', 'DataMap', 'Securiti', 'Planilhas de inventário']}
      legal="Lei 13.709/2018 (LGPD)"
    />
    <SimMapping items={[
      'Agente de Compliance LGPD rastreia automaticamente novos pontos de coleta de dados',
      'Workflow de direitos do titular processa solicitações com SLA automático e notificações',
    ]} />

    {/* ── 4. Dev Lifecycle ─────────────────────────────────── */}
    <SectionHeading id="dev-lifecycle" icon={Code} title="Dev Lifecycle" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O ciclo de vida de desenvolvimento de software abrange desde o levantamento de requisitos
      até o deploy em produção. Inclui análise de requisitos, design, desenvolvimento, code
      review, testes de QA, homologação e deploy. Uma metodologia bem definida (Scrum, Kanban)
      garante entregas consistentes e com qualidade.
    </p>
    <QuickStart steps={[
      'Levantar e documentar requisitos com stakeholders (user stories, critérios de aceite)',
      'Planejar sprints/iterações e distribuir tarefas no board',
      'Desenvolver seguindo padrões de código e arquitetura definidos',
      'Realizar code review obrigatório antes do merge (mínimo 1 aprovação)',
      'Executar testes automatizados (unitários, integração, e2e) no pipeline',
      'Fazer deploy em staging para homologação e depois para produção',
    ]} />
    <FeatureList items={[
      'Product Owner / Product Manager — requisitos e priorização',
      'Desenvolvedores — implementação e code review',
      'QA Engineer — testes e garantia de qualidade',
      'Tech Lead — decisões técnicas e arquitetura',
    ]} />
    <ProcessCard
      periodicity="semanal"
      tools={['Jira', 'Linear', 'GitHub', 'VS Code', 'Jest', 'Cypress', 'Playwright']}
    />
    <SimMapping items={[
      'Agentes de Dev simulam sprints completas com planning, daily e review automatizados',
      'Workflow de code review atribui revisores automaticamente com base em ownership de código',
      'Pipeline de QA roda testes e gera relatório de cobertura a cada pull request',
    ]} />

    {/* ── 5. DevOps / CI-CD ────────────────────────────────── */}
    <SectionHeading id="devops-cicd" icon={GitBranch} title="DevOps / CI-CD" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      DevOps une desenvolvimento e operações para entregar software de forma rápida e confiável.
      O pipeline de CI/CD (Integração Contínua / Deploy Contínuo) automatiza build, testes e
      deploy, reduzindo erros manuais. Inclui também monitoramento de aplicações em produção,
      gestão de ambientes e infraestrutura como código.
    </p>
    <QuickStart steps={[
      'Configurar pipeline de CI com build e testes automáticos a cada push',
      'Implementar CD com deploy automático para staging e manual para produção',
      'Definir estratégia de branching (trunk-based, GitFlow)',
      'Configurar monitoramento de aplicação (APM, logs, métricas)',
      'Automatizar provisionamento de ambientes com IaC (Terraform, Pulumi)',
    ]} />
    <FeatureList items={[
      'DevOps Engineer — pipelines, automação e infraestrutura',
      'SRE (Site Reliability Engineer) — confiabilidade e SLOs',
      'Desenvolvedores — manutenção de Dockerfiles e configs de CI',
      'CTO / Head de TI — definição de padrões e ferramentas',
    ]} />
    <ProcessCard
      periodicity="diario"
      tools={['GitHub Actions', 'GitLab CI', 'Docker', 'Kubernetes', 'ArgoCD', 'Datadog', 'Sentry']}
    />
    <SimMapping items={[
      'Agente de DevOps monitora pipelines e notifica automaticamente sobre falhas de build',
      'Workflow de deploy gera checklist de pré-produção e exige aprovação antes do release',
      'Dashboard de SRE exibe SLOs, error budget e tempo médio de recuperação (MTTR)',
    ]} />
  </section>
);
