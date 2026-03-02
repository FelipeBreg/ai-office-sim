import { Globe, Scale, Receipt, Calculator, Users, TrendingUp, Megaphone, Cog, Headphones, Monitor, ShieldCheck, Landmark, Target } from 'lucide-react';
import { SectionHeading, FeatureList } from '../../../_components/reference-components';

const departments = [
  { icon: Scale, title: 'Jurídico & Constituição', desc: 'CNPJ, contrato social, alvarás, marcas e contratos.' },
  { icon: Receipt, title: 'Tributário & Fiscal', desc: 'Regimes tributários, notas fiscais, SPED e obrigações acessórias.' },
  { icon: Calculator, title: 'Contabilidade & Finanças', desc: 'DRE, balanço, fluxo de caixa, contas a pagar e receber.' },
  { icon: Users, title: 'RH & Dept. Pessoal', desc: 'Admissão CLT, folha, benefícios, eSocial e segurança do trabalho.' },
  { icon: TrendingUp, title: 'Vendas & Comercial', desc: 'CRM, prospecção, propostas, contratos e pós-venda.' },
  { icon: Megaphone, title: 'Marketing', desc: 'Branding, marketing digital, redes sociais, ads e SEO.' },
  { icon: Cog, title: 'Operações & Processos', desc: 'Supply chain, estoque, logística, qualidade e SOPs.' },
  { icon: Headphones, title: 'Atendimento ao Cliente', desc: 'Canais, SLA, tickets, escalação e pesquisas de satisfação.' },
  { icon: Monitor, title: 'TI & Tecnologia', desc: 'Infraestrutura, segurança, LGPD, DevOps e ciclo de desenvolvimento.' },
  { icon: ShieldCheck, title: 'Compliance & Governança', desc: 'Regulatório, auditoria, riscos e controles internos.' },
  { icon: Landmark, title: 'Tesouraria & Financeiro', desc: 'Gestão de caixa, Pix, boleto, crédito e cobrança.' },
  { icon: Target, title: 'Planejamento Estratégico', desc: 'OKRs, BSC, SWOT, planejamento anual e reuniões de diretoria.' },
];

export const visaoGeralContent = (
  <section>
    <SectionHeading id="visao-geral" icon={Globe} title="Blueprint Empresarial" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Este blueprint é um guia completo de todos os processos que uma empresa no Brasil precisa
      executar — do registro do CNPJ até o planejamento estratégico anual. Cada departamento
      inclui passo a passo, responsáveis, periodicidade, ferramentas e base legal.
    </p>
    <p className="mb-6 text-sm leading-relaxed text-text-secondary">
      Use como referência para estruturar sua empresa ou para entender como o AI Office Sim
      pode automatizar cada um desses processos com agentes de IA.
    </p>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((d) => (
        <div key={d.title} className="border border-border-default bg-bg-base p-4">
          <d.icon className="mb-2 h-5 w-5 text-accent-cyan" />
          <p className="mb-1 text-sm font-bold text-text-primary">{d.title}</p>
          <p className="text-xs text-text-muted">{d.desc}</p>
        </div>
      ))}
    </div>

    <div className="mt-8">
      <SectionHeading id="como-usar" icon={Globe} title="Como Usar Este Blueprint" />
      <FeatureList items={[
        'Navegue pelos departamentos na barra lateral',
        'Cada processo inclui passos detalhados, responsáveis e periodicidade',
        'Veja a base legal aplicável (CLT, Código Civil, legislação tributária)',
        'Confira como cada processo pode ser automatizado no AI Office Sim',
        'Use como checklist para garantir que sua empresa está em conformidade',
      ]} />
    </div>
  </section>
);
