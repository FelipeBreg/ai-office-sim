export interface RagDocumentTemplate {
  slug: string;
  nameEn: string;
  namePtBr: string;
  department: string;
  description: string;
  fileTypes: string[];
  examples: string[];
}

export const RAG_DOCUMENT_TEMPLATES: RagDocumentTemplate[] = [
  // ─── JURIDICO ───────────────────────────────────────────────────────
  {
    slug: 'brazilian-corporate-law',
    nameEn: 'Brazilian Corporate Law References',
    namePtBr: 'Legislacao Societaria Brasileira',
    department: 'juridico',
    description:
      'Brazilian corporate law references including the Civil Code (Lei 10.406/2002), Company Act (Lei 6.404/76), and related statutes governing corporate formation, governance, and obligations.',
    fileTypes: ['pdf', 'docx'],
    examples: [
      'Lei_10406_2002_Codigo_Civil.pdf',
      'Lei_6404_76_Sociedades_Anonimas.pdf',
      'Resumo_Tipos_Societarios_Brasil.docx',
    ],
  },
  {
    slug: 'cnae-classification',
    nameEn: 'CNAE Classification Tables',
    namePtBr: 'Tabelas de Classificacao CNAE',
    department: 'juridico',
    description:
      'CNAE code tables, annex mapping for Simples Nacional, and license requirements per economic activity code used to classify businesses for tax and regulatory purposes.',
    fileTypes: ['xlsx', 'csv', 'pdf'],
    examples: [
      'Tabela_CNAE_2_3_Completa.xlsx',
      'Mapeamento_CNAE_Anexos_Simples.csv',
      'Requisitos_Licenca_Por_CNAE.pdf',
    ],
  },
  {
    slug: 'license-permit-requirements',
    nameEn: 'License & Permit Requirements',
    namePtBr: 'Requisitos de Licencas e Alvaras',
    department: 'juridico',
    description:
      'Municipal business licenses (alvara de funcionamento), sanitary permits (ANVISA), fire department approvals (AVCB), and environmental permits (IBAMA/CETESB) by activity type and location.',
    fileTypes: ['pdf', 'docx', 'xlsx'],
    examples: [
      'Checklist_Alvara_Funcionamento_SP.pdf',
      'Requisitos_AVCB_Bombeiros.docx',
      'Tabela_Licencas_Ambientais_Por_Estado.xlsx',
    ],
  },
  {
    slug: 'inpi-trademark-procedures',
    nameEn: 'INPI Trademark & Patent Procedures',
    namePtBr: 'Procedimentos de Marcas e Patentes INPI',
    department: 'juridico',
    description:
      'INPI trademark and patent registration procedures, Nice Classification (NCL) guide, fee schedules, opposition timelines, and renewal requirements.',
    fileTypes: ['pdf', 'docx'],
    examples: [
      'Manual_Registro_Marca_INPI_2024.pdf',
      'Classificacao_Nice_NCL12_Resumo.pdf',
      'Fluxo_Pedido_Patente_INPI.docx',
    ],
  },
  {
    slug: 'contract-clause-templates',
    nameEn: 'Contract Clause Library & Templates',
    namePtBr: 'Biblioteca de Clausulas e Modelos de Contrato',
    department: 'juridico',
    description:
      'Legal clause library organized by contract type (service, supply, NDA, partnership), with standard and alternative wording, risk annotations, and complete contract templates.',
    fileTypes: ['docx', 'pdf'],
    examples: [
      'Modelo_Contrato_Prestacao_Servicos.docx',
      'Biblioteca_Clausulas_NDA.docx',
      'Template_Contrato_Fornecimento.pdf',
    ],
  },

  // ─── COMPLIANCE ─────────────────────────────────────────────────────
  {
    slug: 'lgpd-compliance',
    nameEn: 'LGPD Compliance Documentation',
    namePtBr: 'Documentacao de Conformidade LGPD',
    department: 'compliance',
    description:
      'LGPD (Lei 13.709/2018) articles and interpretive guidance, Data Protection Impact Assessment (DPIA) templates, consent record forms, and data mapping inventories.',
    fileTypes: ['pdf', 'docx', 'xlsx'],
    examples: [
      'LGPD_Lei_13709_Texto_Completo.pdf',
      'Template_RIPD_DPIA.docx',
      'Inventario_Dados_Pessoais.xlsx',
    ],
  },
  {
    slug: 'regulatory-framework',
    nameEn: 'Regulatory Framework by Sector',
    namePtBr: 'Marco Regulatorio por Setor',
    department: 'compliance',
    description:
      'Regulatory framework documentation organized by industry sector, mapping applicable regulations to internal controls and compliance obligations.',
    fileTypes: ['pdf', 'docx', 'xlsx'],
    examples: [
      'Marco_Regulatorio_Fintech_BACEN.pdf',
      'Mapeamento_Normas_Saude_ANVISA.xlsx',
      'Controles_Internos_Por_Regulacao.docx',
    ],
  },
  {
    slug: 'internal-audit-procedures',
    nameEn: 'Internal Audit Procedures',
    namePtBr: 'Procedimentos de Auditoria Interna',
    department: 'compliance',
    description:
      'Audit program templates, control testing procedures, sampling methodologies, finding classification criteria, and corrective action tracking formats.',
    fileTypes: ['docx', 'xlsx', 'pdf'],
    examples: [
      'Programa_Auditoria_Anual_2024.docx',
      'Checklist_Teste_Controles.xlsx',
      'Modelo_Relatorio_Auditoria_Interna.pdf',
    ],
  },
  {
    slug: 'risk-management-framework',
    nameEn: 'Risk Management Framework',
    namePtBr: 'Framework de Gestao de Riscos',
    department: 'compliance',
    description:
      'Enterprise risk register, risk appetite statements, probability/impact matrices, industry risk benchmarks, and risk treatment plans.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Registro_Riscos_Corporativos.xlsx',
      'Matriz_Probabilidade_Impacto.pdf',
      'Politica_Apetite_Risco.docx',
    ],
  },
  {
    slug: 'internal-controls-coso',
    nameEn: 'Internal Controls (COSO Framework)',
    namePtBr: 'Controles Internos (Framework COSO)',
    department: 'compliance',
    description:
      'COSO internal control framework documentation, control matrices mapping controls to risks, test of design/operating effectiveness results, and remediation tracking.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Matriz_Controles_COSO_2024.xlsx',
      'Resultados_Teste_Efetividade.pdf',
      'Framework_COSO_Resumo_Executivo.docx',
    ],
  },
  {
    slug: 'anti-corruption-compliance',
    nameEn: 'Anti-Corruption Compliance',
    namePtBr: 'Compliance Anticorrupcao',
    department: 'compliance',
    description:
      'Anti-corruption policy aligned with Lei 12.846/2013, international sanctions lists, third-party due diligence questionnaires, and gifts/hospitality registers.',
    fileTypes: ['pdf', 'docx', 'xlsx'],
    examples: [
      'Politica_Anticorrupcao_v3.pdf',
      'Questionario_Due_Diligence_Terceiros.docx',
      'Registro_Brindes_Hospitalidade.xlsx',
    ],
  },

  // ─── TRIBUTARIO ─────────────────────────────────────────────────────
  {
    slug: 'tax-regime-comparison',
    nameEn: 'Tax Regime Comparison Tables',
    namePtBr: 'Tabelas Comparativas de Regimes Tributarios',
    department: 'tributario',
    description:
      'Side-by-side comparison tables for Simples Nacional, Lucro Presumido, and Lucro Real regimes including tax burden simulations, eligibility thresholds, and decision criteria.',
    fileTypes: ['xlsx', 'pdf'],
    examples: [
      'Comparativo_Simples_Presumido_Real.xlsx',
      'Simulacao_Carga_Tributaria_2024.xlsx',
      'Guia_Escolha_Regime_Tributario.pdf',
    ],
  },
  {
    slug: 'simples-nacional-tables',
    nameEn: 'Simples Nacional Rate Tables',
    namePtBr: 'Tabelas do Simples Nacional',
    department: 'tributario',
    description:
      'Simples Nacional Annexes I through V rate tables with revenue brackets, effective rates, deduction values, and Fator R calculation rules for service companies.',
    fileTypes: ['xlsx', 'csv', 'pdf'],
    examples: [
      'Anexos_I_V_Simples_Nacional_2024.xlsx',
      'Calculo_Fator_R_Exemplos.pdf',
      'Faixas_Receita_Aliquotas_Simples.csv',
    ],
  },
  {
    slug: 'presumido-real-rules',
    nameEn: 'Lucro Presumido & Real Rules',
    namePtBr: 'Regras Lucro Presumido e Real',
    department: 'tributario',
    description:
      'Presumption percentage rates by activity, LALUR (Livro de Apuracao do Lucro Real) rules, PIS/COFINS credit eligibility, and quarterly/annual calculation methodology.',
    fileTypes: ['pdf', 'xlsx', 'docx'],
    examples: [
      'Percentuais_Presuncao_Por_Atividade.xlsx',
      'Manual_LALUR_Lucro_Real.pdf',
      'Guia_Creditos_PIS_COFINS.docx',
    ],
  },
  {
    slug: 'cfop-ncm-fiscal',
    nameEn: 'CFOP, NCM & Fiscal Code Tables',
    namePtBr: 'Tabelas CFOP, NCM e Codigos Fiscais',
    department: 'tributario',
    description:
      'CFOP operation codes, NCM product classification codes, ICMS rates by state (internal and interstate), CST/CSOSN codes, and SEFAZ authorization endpoints.',
    fileTypes: ['xlsx', 'csv', 'pdf'],
    examples: [
      'Tabela_CFOP_Completa.xlsx',
      'NCM_Tipi_2024.csv',
      'Aliquotas_ICMS_Interestaduais.pdf',
    ],
  },
  {
    slug: 'tax-calendar-deadlines',
    nameEn: 'Tax Calendar & Filing Deadlines',
    namePtBr: 'Calendario Fiscal e Prazos de Entrega',
    department: 'tributario',
    description:
      'Tax filing deadlines organized by regime (Simples, Presumido, Real), obligation type, and month, including penalty amounts for late filing and payment.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Calendario_Obrigacoes_Fiscais_2024.xlsx',
      'Multas_Atraso_Por_Obrigacao.pdf',
      'Prazos_Entrega_SPED_EFD.csv',
    ],
  },
  {
    slug: 'sped-digital-bookkeeping',
    nameEn: 'SPED Digital Bookkeeping Specs',
    namePtBr: 'Leiautes SPED Digital',
    department: 'tributario',
    description:
      'SPED (Sistema Publico de Escrituracao Digital) layout specifications for ECD, ECF, EFD-ICMS/IPI, EFD-Contribuicoes, including block and record structures and validation rules.',
    fileTypes: ['pdf', 'xlsx', 'txt'],
    examples: [
      'Leiaute_EFD_ICMS_IPI_v3.1.pdf',
      'Estrutura_Blocos_Registros_ECD.xlsx',
      'Regras_Validacao_ECF_2024.txt',
    ],
  },
  {
    slug: 'dctf-darf-procedures',
    nameEn: 'DCTF & DARF Procedures',
    namePtBr: 'Procedimentos DCTF e DARF',
    department: 'tributario',
    description:
      'DARF revenue codes (codigos de receita), DCTF filing rules and correction procedures, DCTF-Web integration, and payment reconciliation guidelines.',
    fileTypes: ['pdf', 'xlsx', 'docx'],
    examples: [
      'Tabela_Codigos_Receita_DARF.xlsx',
      'Manual_Preenchimento_DCTF.pdf',
      'Procedimento_Retificacao_DCTF.docx',
    ],
  },

  // ─── CONTABILIDADE ──────────────────────────────────────────────────
  {
    slug: 'chart-of-accounts',
    nameEn: 'Chart of Accounts & Accounting Standards',
    namePtBr: 'Plano de Contas e Normas Contabeis',
    department: 'contabilidade',
    description:
      'Chart of accounts structure aligned with CPC (Comite de Pronunciamentos Contabeis) and IFRS standards, account classification rules, and standard journal entry templates.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Plano_Contas_Padrao_CPC.xlsx',
      'Resumo_Pronunciamentos_CPC_IFRS.pdf',
      'Classificacao_Contas_Nivel_4.csv',
    ],
  },
  {
    slug: 'financial-analysis-benchmarks',
    nameEn: 'Financial Analysis & Benchmarks',
    namePtBr: 'Analise Financeira e Benchmarks',
    department: 'contabilidade',
    description:
      'Financial ratio formulas and interpretation guides, budget benchmark data by industry, and macroeconomic indicators (IPCA, Selic, CDI, IGP-M) for financial modeling.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Indicadores_Financeiros_Formulas.xlsx',
      'Benchmarks_Setoriais_2024.pdf',
      'Serie_Historica_Selic_IPCA.csv',
    ],
  },
  {
    slug: 'bank-reconciliation-rules',
    nameEn: 'Bank Reconciliation Rules',
    namePtBr: 'Regras de Conciliacao Bancaria',
    department: 'contabilidade',
    description:
      'Automated matching rules for bank reconciliation, transaction categorization criteria, bank fee reference tables, and exception handling procedures.',
    fileTypes: ['xlsx', 'docx', 'csv'],
    examples: [
      'Regras_Conciliacao_Automatica.xlsx',
      'Categorias_Transacoes_Bancarias.csv',
      'Tabela_Tarifas_Bancarias_Referencia.docx',
    ],
  },

  // ─── RH ─────────────────────────────────────────────────────────────
  {
    slug: 'clt-labor-law',
    nameEn: 'CLT Labor Law Reference',
    namePtBr: 'Legislacao Trabalhista CLT',
    department: 'rh',
    description:
      'CLT (Consolidacao das Leis do Trabalho) articles covering hiring, termination, vacation accrual, 13th salary calculation, overtime rules, and notice period requirements.',
    fileTypes: ['pdf', 'docx'],
    examples: [
      'CLT_Artigos_Admissao_Demissao.pdf',
      'Guia_Calculo_Ferias_13o.docx',
      'Reforma_Trabalhista_Lei_13467.pdf',
    ],
  },
  {
    slug: 'esocial-event-schemas',
    nameEn: 'eSocial Event Schemas',
    namePtBr: 'Schemas de Eventos eSocial',
    department: 'rh',
    description:
      'eSocial event XML/XSD schemas, field validation rules, common rejection codes and their resolution, and event sequencing requirements.',
    fileTypes: ['pdf', 'xlsx', 'xml'],
    examples: [
      'Leiaute_eSocial_S1_0_v2.pdf',
      'Tabela_Erros_Rejeicao_eSocial.xlsx',
      'Schema_S2200_Admissao.xml',
    ],
  },
  {
    slug: 'payroll-tax-tables',
    nameEn: 'Payroll Tax Tables (INSS/IRRF)',
    namePtBr: 'Tabelas de Impostos sobre Folha (INSS/IRRF)',
    department: 'rh',
    description:
      'INSS progressive contribution tables, IRRF withholding tax brackets with deduction per dependent, and updated minimum wage and salary floor references.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Tabela_INSS_Progressiva_2024.xlsx',
      'Tabela_IRRF_Mensal_2024.pdf',
      'Salario_Minimo_Historico.csv',
    ],
  },
  {
    slug: 'benefits-onboarding',
    nameEn: 'Benefits & Onboarding Procedures',
    namePtBr: 'Beneficios e Procedimentos de Integracao',
    department: 'rh',
    description:
      'Benefits enrollment procedures (VT, VR/VA, health plan, dental), new hire onboarding checklists, training curriculum outlines, and probation period evaluation templates.',
    fileTypes: ['docx', 'pdf', 'xlsx'],
    examples: [
      'Checklist_Onboarding_Novo_Colaborador.docx',
      'Catalogo_Beneficios_2024.pdf',
      'Cronograma_Treinamento_Integracao.xlsx',
    ],
  },
  {
    slug: 'collective-agreements',
    nameEn: 'Collective Bargaining Agreements',
    namePtBr: 'Convencoes Coletivas de Trabalho',
    department: 'rh',
    description:
      'CCT (Convencao Coletiva de Trabalho) terms by union/category, minimum salary floors, mandatory benefit values, and annual negotiation calendars.',
    fileTypes: ['pdf', 'docx', 'xlsx'],
    examples: [
      'CCT_Sindicato_Comercio_SP_2024.pdf',
      'Pisos_Salariais_Por_Categoria.xlsx',
      'Resumo_Clausulas_CCT_TI.docx',
    ],
  },
  {
    slug: 'workplace-safety-nrs',
    nameEn: 'Workplace Safety (NR Compliance)',
    namePtBr: 'Seguranca do Trabalho (Normas Regulamentadoras)',
    department: 'rh',
    description:
      'NR (Norma Regulamentadora) compliance requirements, EPI (equipamento de protecao individual) inventory lists, ASO medical exam schedules, and PCMSO/PGR documentation.',
    fileTypes: ['pdf', 'xlsx', 'docx'],
    examples: [
      'Checklist_NRs_Aplicaveis.pdf',
      'Inventario_EPIs_Por_Funcao.xlsx',
      'Cronograma_Exames_ASO_2024.docx',
    ],
  },

  // ─── VENDAS ─────────────────────────────────────────────────────────
  {
    slug: 'crm-pipeline-definitions',
    nameEn: 'CRM Pipeline Definitions',
    namePtBr: 'Definicoes de Pipeline CRM',
    department: 'vendas',
    description:
      'Sales pipeline stage definitions, entry/exit criteria per stage, expected conversion rates, and average deal cycle time benchmarks.',
    fileTypes: ['docx', 'xlsx', 'pdf'],
    examples: [
      'Definicao_Estagios_Pipeline.docx',
      'Taxas_Conversao_Por_Estagio.xlsx',
      'Criterios_Qualificacao_Oportunidade.pdf',
    ],
  },
  {
    slug: 'lead-scoring-icp',
    nameEn: 'Lead Scoring & ICP Definition',
    namePtBr: 'Lead Scoring e Definicao de ICP',
    department: 'vendas',
    description:
      'Ideal Customer Profile (ICP) definition with firmographic and behavioral criteria, lead scoring model weights, and MQL/SQL qualification frameworks.',
    fileTypes: ['docx', 'xlsx', 'pdf'],
    examples: [
      'Perfil_Cliente_Ideal_ICP.docx',
      'Modelo_Lead_Scoring_Pesos.xlsx',
      'Framework_Qualificacao_BANT.pdf',
    ],
  },
  {
    slug: 'sales-proposal-templates',
    nameEn: 'Sales Proposal Templates',
    namePtBr: 'Modelos de Proposta Comercial',
    department: 'vendas',
    description:
      'Sales proposal templates segmented by company size and industry, case study summaries, ROI calculators, and competitive comparison one-pagers.',
    fileTypes: ['docx', 'pdf', 'pptx'],
    examples: [
      'Modelo_Proposta_Enterprise.docx',
      'Case_Study_Varejo_2024.pdf',
      'Calculadora_ROI_Template.pptx',
    ],
  },
  {
    slug: 'pricing-rules',
    nameEn: 'Pricing Tables & Discount Policies',
    namePtBr: 'Tabelas de Precos e Politicas de Desconto',
    department: 'vendas',
    description:
      'Product/service pricing tables, volume discount tiers, approval thresholds for discounts, margin multiplier rules, and annual price adjustment policies.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Tabela_Precos_Produtos_2024.xlsx',
      'Politica_Descontos_Aprovacao.pdf',
      'Multiplicadores_Margem_Por_Segmento.csv',
    ],
  },
  {
    slug: 'commercial-contract-templates',
    nameEn: 'Commercial Contract Templates',
    namePtBr: 'Modelos de Contrato Comercial',
    department: 'vendas',
    description:
      'Standard commercial contract templates (SaaS, services, reseller), common clause variations, SLA definitions, and renewal/cancellation terms.',
    fileTypes: ['docx', 'pdf'],
    examples: [
      'Modelo_Contrato_SaaS_Anual.docx',
      'Clausulas_SLA_Padrao.pdf',
      'Template_Contrato_Revenda.docx',
    ],
  },
  {
    slug: 'sales-cadence-templates',
    nameEn: 'Sales Cadence & Sequence Templates',
    namePtBr: 'Templates de Cadencia de Vendas',
    department: 'vendas',
    description:
      'Outbound and inbound sales cadence templates with timing rules, email/call/social touch sequences, A/B test results, and response rate benchmarks.',
    fileTypes: ['docx', 'xlsx', 'pdf'],
    examples: [
      'Cadencia_Outbound_14_Dias.docx',
      'Resultados_AB_Teste_Assunto.xlsx',
      'Templates_Email_Cold_Outreach.pdf',
    ],
  },
  {
    slug: 'customer-health-churn',
    nameEn: 'Customer Health Score & Churn Signals',
    namePtBr: 'Health Score do Cliente e Sinais de Churn',
    department: 'vendas',
    description:
      'Customer health score model with weighted dimensions (usage, engagement, support, NPS), churn risk signal definitions, and historical churn pattern data.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Modelo_Health_Score_Pesos.xlsx',
      'Sinais_Risco_Churn_Definicoes.pdf',
      'Analise_Historica_Churn_2023_2024.docx',
    ],
  },
  {
    slug: 'cs-playbooks-qbr',
    nameEn: 'CS Playbooks & QBR Templates',
    namePtBr: 'Playbooks de CS e Templates de QBR',
    department: 'vendas',
    description:
      'Customer Success playbooks for onboarding, adoption, renewal, and escalation; QBR (Quarterly Business Review) presentation templates; and upsell/cross-sell product catalog.',
    fileTypes: ['docx', 'pptx', 'pdf'],
    examples: [
      'Playbook_Onboarding_CS.docx',
      'Template_QBR_Trimestral.pptx',
      'Catalogo_Upsell_Cross_Sell.pdf',
    ],
  },

  // ─── MARKETING ──────────────────────────────────────────────────────
  {
    slug: 'brand-guidelines',
    nameEn: 'Brand Guidelines',
    namePtBr: 'Manual de Identidade Visual',
    department: 'marketing',
    description:
      'Brand guidelines covering logo usage, color palette (HEX/RGB/CMYK), typography rules, tone of voice principles, and visual do/don\'t examples.',
    fileTypes: ['pdf', 'docx', 'png'],
    examples: [
      'Manual_Marca_2024.pdf',
      'Guia_Tom_De_Voz.docx',
      'Paleta_Cores_Tipografia.pdf',
    ],
  },
  {
    slug: 'content-editorial-calendar',
    nameEn: 'Content & Editorial Calendar',
    namePtBr: 'Calendario Editorial e de Conteudo',
    department: 'marketing',
    description:
      'Content calendar with publication schedule, editorial style guide, content pillar definitions, and top-performing content analysis with engagement metrics.',
    fileTypes: ['xlsx', 'docx', 'pdf'],
    examples: [
      'Calendario_Editorial_Q1_2024.xlsx',
      'Style_Guide_Blog.docx',
      'Top_Conteudos_Performance_2023.pdf',
    ],
  },
  {
    slug: 'platform-format-specs',
    nameEn: 'Social Media Format Specs',
    namePtBr: 'Especificacoes de Formato por Plataforma',
    department: 'marketing',
    description:
      'Social media post format specifications per platform (Instagram, LinkedIn, TikTok, YouTube, X/Twitter) including image dimensions, video lengths, character limits, and best posting times.',
    fileTypes: ['pdf', 'xlsx'],
    examples: [
      'Specs_Formatos_Redes_Sociais_2024.pdf',
      'Dimensoes_Imagens_Por_Plataforma.xlsx',
    ],
  },
  {
    slug: 'seo-keyword-checklist',
    nameEn: 'SEO Checklist & Keyword Data',
    namePtBr: 'Checklist SEO e Dados de Palavras-Chave',
    department: 'marketing',
    description:
      'Technical SEO audit checklist, target keyword lists with search volume and difficulty, competitor domain analysis, and on-page optimization guidelines.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Checklist_SEO_Tecnico.pdf',
      'Palavras_Chave_Alvo_Volume.xlsx',
      'Analise_Concorrentes_SEO.csv',
    ],
  },
  {
    slug: 'ad-performance-benchmarks',
    nameEn: 'Ad Performance Benchmarks',
    namePtBr: 'Benchmarks de Performance de Anuncios',
    department: 'marketing',
    description:
      'Paid media performance benchmarks (CPC, CPM, CTR, CPA) by platform and industry, audience targeting strategies, and creative performance data.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Benchmarks_Ads_Google_Meta_2024.xlsx',
      'Estrategias_Segmentacao_Audiencia.pdf',
      'Performance_Criativos_AB_Testes.csv',
    ],
  },
  {
    slug: 'email-marketing-templates',
    nameEn: 'Email Marketing Templates & Flows',
    namePtBr: 'Templates de Email Marketing e Fluxos',
    department: 'marketing',
    description:
      'Email templates for campaigns, transactional emails, and nurture flows; segmentation rules and criteria; automation flow definitions; and deliverability best practices.',
    fileTypes: ['docx', 'pdf', 'xlsx'],
    examples: [
      'Templates_Email_Nurturing.docx',
      'Regras_Segmentacao_Base.xlsx',
      'Fluxos_Automacao_Email.pdf',
    ],
  },
  {
    slug: 'conversion-funnel-benchmarks',
    nameEn: 'Conversion Funnel Benchmarks',
    namePtBr: 'Benchmarks de Funil de Conversao',
    department: 'marketing',
    description:
      'Conversion funnel benchmark data by industry and channel, A/B testing methodology and results library, and landing page best practices with performance data.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Benchmarks_Funil_Por_Setor.xlsx',
      'Resultados_AB_Landing_Pages.pdf',
      'Boas_Praticas_Conversao.docx',
    ],
  },

  // ─── OPERACOES ──────────────────────────────────────────────────────
  {
    slug: 'procurement-supplier-data',
    nameEn: 'Procurement & Supplier Data',
    namePtBr: 'Compras e Dados de Fornecedores',
    department: 'operacoes',
    description:
      'Approved supplier list with qualification status, purchase policy with approval tiers, historical pricing data, and supplier evaluation scorecards.',
    fileTypes: ['xlsx', 'pdf', 'csv'],
    examples: [
      'Lista_Fornecedores_Homologados.xlsx',
      'Politica_Compras_Alçadas.pdf',
      'Historico_Precos_Fornecedores.csv',
    ],
  },
  {
    slug: 'inventory-management-models',
    nameEn: 'Inventory Management Models',
    namePtBr: 'Modelos de Gestao de Estoque',
    department: 'operacoes',
    description:
      'ABC/XYZ inventory classification models, demand forecasting methodologies, safety stock calculations, and reorder point formulas with seasonal adjustments.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Classificacao_ABC_XYZ_Estoque.xlsx',
      'Modelo_Previsao_Demanda.pdf',
      'Calculo_Estoque_Seguranca.docx',
    ],
  },
  {
    slug: 'logistics-shipping-data',
    nameEn: 'Logistics & Shipping Data',
    namePtBr: 'Dados de Logistica e Frete',
    department: 'operacoes',
    description:
      'Carrier rate cards and contract terms, delivery SLA definitions by region, route optimization data, and shipping cost comparison tables.',
    fileTypes: ['xlsx', 'csv', 'pdf'],
    examples: [
      'Tabela_Frete_Transportadoras_2024.xlsx',
      'SLAs_Entrega_Por_Regiao.csv',
      'Comparativo_Custos_Frete.pdf',
    ],
  },
  {
    slug: 'quality-iso9001',
    nameEn: 'Quality Management (ISO 9001)',
    namePtBr: 'Gestao da Qualidade (ISO 9001)',
    department: 'operacoes',
    description:
      'ISO 9001 standard requirements, inspection checklists and quality control procedures, non-conformity records and root cause analysis history, and corrective action plans.',
    fileTypes: ['pdf', 'docx', 'xlsx'],
    examples: [
      'Manual_Qualidade_ISO9001.pdf',
      'Checklist_Inspecao_Produto.docx',
      'Registro_Nao_Conformidades.xlsx',
    ],
  },
  {
    slug: 'sop-documentation',
    nameEn: 'SOP Documentation',
    namePtBr: 'Documentacao de POPs',
    department: 'operacoes',
    description:
      'Standard Operating Procedures (SOPs/POPs) organized by department and process, process mapping (BPMN diagrams), and SOP format templates with versioning guidelines.',
    fileTypes: ['docx', 'pdf', 'xlsx'],
    examples: [
      'POP_Recebimento_Mercadorias.docx',
      'Mapeamento_Processos_BPMN.pdf',
      'Template_POP_Padrao.docx',
    ],
  },
  {
    slug: 'operational-kpi-benchmarks',
    nameEn: 'Operational KPI Benchmarks',
    namePtBr: 'Benchmarks de KPIs Operacionais',
    department: 'operacoes',
    description:
      'Operational KPI definitions with calculation formulas, industry benchmark data, target-setting methodology, and performance dashboard specifications.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Definicoes_KPIs_Operacionais.xlsx',
      'Benchmarks_Industria_2024.pdf',
      'Metodologia_Metas_OKR.docx',
    ],
  },

  // ─── ATENDIMENTO ────────────────────────────────────────────────────
  {
    slug: 'customer-service-taxonomy',
    nameEn: 'Customer Service Taxonomy & Routing',
    namePtBr: 'Taxonomia e Roteamento de Atendimento',
    department: 'atendimento',
    description:
      'Ticket classification taxonomy (category, subcategory, priority), routing rules by issue type, customer tier definitions, and first-contact resolution guidelines.',
    fileTypes: ['xlsx', 'docx', 'pdf'],
    examples: [
      'Taxonomia_Classificacao_Tickets.xlsx',
      'Regras_Roteamento_Atendimento.docx',
      'Definicao_Tiers_Cliente.pdf',
    ],
  },
  {
    slug: 'sla-escalation-rules',
    nameEn: 'SLA & Escalation Rules',
    namePtBr: 'SLAs e Regras de Escalonamento',
    department: 'atendimento',
    description:
      'SLA tier definitions with response and resolution time targets, escalation matrix by severity and elapsed time, and breach notification procedures.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Tabela_SLAs_Por_Prioridade.xlsx',
      'Matriz_Escalonamento.pdf',
      'Procedimento_Breach_SLA.docx',
    ],
  },
  {
    slug: 'knowledge-base-faq',
    nameEn: 'Knowledge Base & FAQ Articles',
    namePtBr: 'Base de Conhecimento e FAQ',
    department: 'atendimento',
    description:
      'FAQ articles organized by product/feature, product documentation, troubleshooting guides with step-by-step resolutions, and known issue workarounds.',
    fileTypes: ['docx', 'pdf', 'xlsx'],
    examples: [
      'FAQ_Produto_Principal.docx',
      'Guia_Troubleshooting_Erros_Comuns.pdf',
      'Base_Conhecimento_Artigos.xlsx',
    ],
  },

  // ─── TI ─────────────────────────────────────────────────────────────
  {
    slug: 'infrastructure-monitoring',
    nameEn: 'Infrastructure & Monitoring',
    namePtBr: 'Infraestrutura e Monitoramento',
    department: 'ti',
    description:
      'Server and service inventory, monitoring alert thresholds and escalation rules, incident response playbooks, and capacity planning data.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Inventario_Servidores_Servicos.xlsx',
      'Playbook_Incidentes_P1.pdf',
      'Thresholds_Alertas_Monitoramento.docx',
    ],
  },
  {
    slug: 'security-vulnerability-data',
    nameEn: 'Security & Vulnerability Data',
    namePtBr: 'Seguranca e Dados de Vulnerabilidades',
    department: 'ti',
    description:
      'Information security policies, vulnerability database and scan results, access control matrix (RBAC), penetration test findings, and patch management schedules.',
    fileTypes: ['pdf', 'xlsx', 'docx'],
    examples: [
      'Politica_Seguranca_Informacao_v4.pdf',
      'Matriz_Controle_Acesso_RBAC.xlsx',
      'Relatorio_Pentest_Q4_2024.docx',
    ],
  },
  {
    slug: 'development-standards',
    nameEn: 'Development Standards & ADRs',
    namePtBr: 'Padroes de Desenvolvimento e ADRs',
    department: 'ti',
    description:
      'Code review checklists, coding standards and style guides by language, Architecture Decision Records (ADRs), and technical debt inventory.',
    fileTypes: ['docx', 'pdf', 'md'],
    examples: [
      'Checklist_Code_Review.docx',
      'Padroes_Codificacao_TypeScript.pdf',
      'ADR_001_Escolha_Framework.md',
    ],
  },
  {
    slug: 'cicd-deployment-procedures',
    nameEn: 'CI/CD & Deployment Procedures',
    namePtBr: 'Procedimentos de CI/CD e Deploy',
    department: 'ti',
    description:
      'CI/CD pipeline configuration documentation, environment inventory (dev, staging, production), deployment checklists, rollback procedures, and feature flag policies.',
    fileTypes: ['docx', 'pdf', 'xlsx'],
    examples: [
      'Documentacao_Pipeline_CICD.docx',
      'Inventario_Ambientes.xlsx',
      'Procedimento_Rollback_Producao.pdf',
    ],
  },

  // ─── TESOURARIA ─────────────────────────────────────────────────────
  {
    slug: 'cash-treasury-management',
    nameEn: 'Cash & Treasury Management',
    namePtBr: 'Gestao de Caixa e Tesouraria',
    department: 'tesouraria',
    description:
      'Bank account inventory with balances, minimum balance policies, cash flow forecasting templates, and treasury management policies and procedures.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Inventario_Contas_Bancarias.xlsx',
      'Politica_Saldo_Minimo.pdf',
      'Template_Fluxo_Caixa_Projetado.docx',
    ],
  },
  {
    slug: 'pix-boleto-procedures',
    nameEn: 'PIX & Boleto Procedures',
    namePtBr: 'Procedimentos PIX e Boleto',
    department: 'tesouraria',
    description:
      'PIX key registry and management, boleto bancario issuance and registration rules, payment reconciliation procedures, and CNAB/FEBRABAN file format specifications.',
    fileTypes: ['pdf', 'xlsx', 'docx'],
    examples: [
      'Registro_Chaves_PIX.xlsx',
      'Regras_Emissao_Boleto_Registrado.pdf',
      'Layout_CNAB_240_Remessa.docx',
    ],
  },
  {
    slug: 'credit-analysis-model',
    nameEn: 'Credit Analysis Model',
    namePtBr: 'Modelo de Analise de Credito',
    department: 'tesouraria',
    description:
      'Credit scoring model with weighted criteria, credit policy with limit tiers and approval authority, and customer creditworthiness assessment templates.',
    fileTypes: ['xlsx', 'pdf', 'docx'],
    examples: [
      'Modelo_Scoring_Credito.xlsx',
      'Politica_Credito_Alcadas.pdf',
      'Ficha_Analise_Credito_Cliente.docx',
    ],
  },
  {
    slug: 'investment-portfolio-policy',
    nameEn: 'Investment Portfolio & Policy',
    namePtBr: 'Politica de Investimentos e Carteira',
    department: 'tesouraria',
    description:
      'Investment policy statement with risk parameters, portfolio composition data, CDI/Selic historical series, and approved counterparty/instrument lists.',
    fileTypes: ['pdf', 'xlsx', 'csv'],
    examples: [
      'Politica_Investimentos_2024.pdf',
      'Carteira_Investimentos_Atual.xlsx',
      'Serie_CDI_Selic_Historico.csv',
    ],
  },
  {
    slug: 'collection-dunning-procedures',
    nameEn: 'Collection & Dunning Procedures',
    namePtBr: 'Procedimentos de Cobranca',
    department: 'tesouraria',
    description:
      'Collection scripts by aging bracket, negotiation guidelines with discount authority, legal escalation criteria (protesto, judicial collection), and dunning letter templates.',
    fileTypes: ['docx', 'pdf', 'xlsx'],
    examples: [
      'Scripts_Cobranca_Por_Faixa_Atraso.docx',
      'Politica_Negociacao_Descontos.pdf',
      'Fluxo_Escalacao_Protesto_Judicial.xlsx',
    ],
  },

  // ─── PLANEJAMENTO ───────────────────────────────────────────────────
  {
    slug: 'strategic-planning-okr-bsc',
    nameEn: 'Strategic Planning (OKR & BSC)',
    namePtBr: 'Planejamento Estrategico (OKR e BSC)',
    department: 'planejamento',
    description:
      'OKR (Objectives and Key Results) methodology guides, BSC (Balanced Scorecard) framework documentation, strategic planning templates, and corporate strategy documents.',
    fileTypes: ['pdf', 'docx', 'pptx'],
    examples: [
      'Metodologia_OKR_Guia_Pratico.pdf',
      'BSC_Mapa_Estrategico_2024.pptx',
      'Planejamento_Estrategico_2024_2026.docx',
    ],
  },
  {
    slug: 'board-governance-templates',
    nameEn: 'Board & Governance Templates',
    namePtBr: 'Templates de Conselho e Governanca',
    department: 'planejamento',
    description:
      'Board meeting agenda and minutes templates, prior meeting minutes for reference, strategic KPI dashboards for board reporting, and governance policy documents.',
    fileTypes: ['docx', 'pptx', 'pdf'],
    examples: [
      'Template_Ata_Reuniao_Conselho.docx',
      'Apresentacao_KPIs_Conselho_Q4.pptx',
      'Regimento_Interno_Conselho.pdf',
    ],
  },
];

/**
 * Returns all RAG document templates for a given department slug.
 */
export function getRagTemplatesByDepartment(
  dept: string,
): RagDocumentTemplate[] {
  return RAG_DOCUMENT_TEMPLATES.filter(
    (template) => template.department === dept,
  );
}
