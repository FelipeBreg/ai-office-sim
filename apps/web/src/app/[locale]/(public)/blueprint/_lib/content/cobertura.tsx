import {
  CheckSquare,
  Scale,
  Receipt,
  Calculator,
  Users,
  TrendingUp,
  Megaphone,
  Cog,
  Headphones,
  Monitor,
  ShieldCheck,
  Landmark,
  Target,
} from 'lucide-react';
import { SectionHeading } from '../../../_components/reference-components';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CoverageStatus = 'automatizavel' | 'parcial' | 'planejado';
type Complexity = 'tarefa' | 'workflow' | 'integracao';
type Frequency = 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual' | 'por-demanda';

interface CoverageRow {
  processo: string;
  status: CoverageStatus;
  complexidade: Complexity;
  frequencia: Frequency;
  recurso: string;
  observacao: string;
  detalhe: string;
}

interface DepartmentCoverage {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  rows: CoverageRow[];
}

/* ------------------------------------------------------------------ */
/*  Badge configs                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<CoverageStatus, { label: string; color: string }> = {
  automatizavel: { label: 'AUTOMATIZÁVEL', color: 'border-status-success text-status-success' },
  parcial: { label: 'PARCIAL', color: 'border-status-warning text-status-warning' },
  planejado: { label: 'PLANEJADO', color: 'border-text-muted text-text-muted' },
};

const complexityConfig: Record<Complexity, { label: string; color: string }> = {
  tarefa: { label: 'TAREFA', color: 'border-status-success text-status-success' },
  workflow: { label: 'WORKFLOW', color: 'border-accent-cyan text-accent-cyan' },
  integracao: { label: 'INTEGRAÇÃO', color: 'border-status-warning text-status-warning' },
};

const frequencyConfig: Record<Frequency, { label: string; color: string }> = {
  diario: { label: 'DIÁRIO', color: 'border-status-success text-status-success' },
  semanal: { label: 'SEMANAL', color: 'border-blue-500 text-blue-400' },
  mensal: { label: 'MENSAL', color: 'border-accent-cyan text-accent-cyan' },
  trimestral: { label: 'TRIMESTRAL', color: 'border-yellow-500 text-yellow-400' },
  anual: { label: 'ANUAL', color: 'border-text-muted text-text-muted' },
  'por-demanda': { label: 'POR DEMANDA', color: 'border-text-secondary text-text-secondary' },
};

/* ------------------------------------------------------------------ */
/*  Coverage data — 12 departments, 76 processes                       */
/* ------------------------------------------------------------------ */

const coverageData: DepartmentCoverage[] = [
  {
    icon: Scale,
    name: 'Jurídico & Constituição',
    rows: [
      {
        processo: 'Registro CNPJ',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'por-demanda',
        recurso: 'Workflow + Agente Compliance',
        observacao: 'Checklist automático; sem integração gov.br',
        detalhe: 'Requer integração com portal gov.br (Redesim) para consulta de viabilidade e acompanhamento de status. O fluxo envolve: consulta prévia de nome empresarial na Junta, preenchimento do DBE (Documento Básico de Entrada) na Receita Federal, geração do CNPJ e inscrição estadual/municipal simultâneas. Cada estado tem particularidades no processo — SP usa VRE (Via Rápida Empresa), outros estados têm portais próprios. Precisa lidar com os diferentes CNAEs e suas exigências específicas de licenciamento. Dados de entrada: nome empresarial, natureza jurídica, endereço, quadro societário, capital social, atividades (CNAE). Output: número CNPJ + comprovante de inscrição.',
      },
      {
        processo: 'Escolha tipo societário',
        status: 'parcial',
        complexidade: 'tarefa',
        frequencia: 'por-demanda',
        recurso: 'Agente Financeiro',
        observacao: 'Simulação tributária disponível; decisão manual',
        detalhe: 'O agente precisa comparar MEI, EI, EIRELI (extinta, migrou para SLU), SLU (Sociedade Limitada Unipessoal), Ltda e S/A. Cada tipo tem limites de faturamento (MEI: R$81k/ano), número de sócios, responsabilidade patrimonial e obrigações acessórias distintas. A simulação deve cruzar: faturamento projetado, número de funcionários, atividade (CNAE), necessidade de investidores e proteção patrimonial. Diferença crítica: MEI tem DAS fixo (~R$70/mês), enquanto Ltda pode optar entre Simples/Presumido/Real. O agente já calcula carga tributária comparativa, mas a decisão final é do empreendedor por envolver fatores subjetivos (plano de crescimento, sócios futuros).',
      },
      {
        processo: 'Contrato social',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'por-demanda',
        recurso: 'Agente Jurídico',
        observacao: 'Geração de minutas; sem registro eletrônico',
        detalhe: 'Geração de minutas com cláusulas padrão: objeto social, capital social (integralizado vs. a integralizar), distribuição de quotas, administração, pro-labore, regras de cessão de quotas, dissolução e foro. Cada alteração contratual (mudança de endereço, entrada/saída de sócio, alteração de capital) gera uma nova versão que precisa ser registrada na Junta. O sistema deve manter versionamento completo com diff entre versões. Tipos de cláusulas variam: Ltda tem contrato social, S/A tem estatuto social com assembleia. Precisa gerar tanto o documento em si quanto a ata de aprovação pelos sócios. Integração futura: assinatura digital via ICP-Brasil ou plataformas como DocuSign/Clicksign para validade jurídica.',
      },
      {
        processo: 'Registro Junta Comercial',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'por-demanda',
        recurso: 'Workflow + Dashboard',
        observacao: 'Acompanhamento de status; sem protocolo automático',
        detalhe: 'Cada estado tem sua Junta Comercial com portal próprio (JUCESP em SP, JUCERJA no RJ, etc.). O registro envolve: protocolo do documento, pagamento de taxas (DARE), análise pelo examinador, exigências (correções), deferimento e arquivamento. Prazos variam de 2 a 15 dias úteis. O sistema precisa rastrear: número do protocolo, status (em análise, em exigência, deferido, indeferido), prazos para cumprimento de exigências (30 dias). Documentos necessários variam por tipo de ato (constituição, alteração, extinção). Integração ideal: API da Junta (quando disponível) ou scraping do portal para atualização automática de status.',
      },
      {
        processo: 'Alvarás e licenças',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'anual',
        recurso: 'Agente Compliance',
        observacao: 'Checklist por CNAE; renovação depende de prefeitura',
        detalhe: 'Múltiplos tipos: Alvará de Funcionamento (prefeitura), Licença Sanitária (Vigilância — ANVISA/municipal), Licença Ambiental (IBAMA/estadual), Auto de Vistoria do Corpo de Bombeiros (AVCB), Licença da Polícia Federal (produtos controlados). Cada CNAE exige um conjunto diferente de licenças. Prazos de renovação variam: alvará geralmente anual, AVCB a cada 3-5 anos, licença ambiental por prazo determinado. O sistema precisa: mapear CNAE → licenças obrigatórias, rastrear validade de cada uma, alertar 60 dias antes do vencimento, gerar checklist de documentos para renovação. Cada município tem portal e processo diferentes — não existe API unificada.',
      },
      {
        processo: 'Marcas e patentes',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'por-demanda',
        recurso: 'Agente Jurídico',
        observacao: 'Monitoramento RPI; sem peticionamento INPI',
        detalhe: 'Registro de marca no INPI leva 12-24 meses. Etapas: busca prévia de anterioridade, petição de depósito (classes NCL — Nice), publicação na RPI (Revista da Propriedade Industrial), período de oposição (60 dias), exame de mérito, deferimento/indeferimento. O sistema precisa monitorar a RPI semanalmente para: status da própria marca, oposições de terceiros, marcas similares sendo registradas no mesmo segmento. Custos: GRU de depósito (~R$355 normal, R$142 com desconto), GRU de concessão. Patentes têm fluxo diferente e mais complexo (busca internacional PCT, exame técnico). Integração ideal: API e-INPI para peticionamento eletrônico e consulta de andamento processual.',
      },
      {
        processo: 'Contratos',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Jurídico + Workflow',
        observacao: 'Minutas automáticas + fluxo de aprovação',
        detalhe: 'Tipos: prestação de serviços, compra e venda, locação, NDA/confidencialidade, trabalho (CLT/PJ), parceria comercial, licenciamento de software, SLA. Cada tipo tem cláusulas obrigatórias distintas e bases legais específicas (Código Civil, CDC, CLT, LGPD). O workflow inclui: geração da minuta a partir de template → revisão jurídica → negociação de cláusulas → aprovação por alçada (gerente até R$X, diretor até R$Y, CEO acima) → assinatura → armazenamento com indexação. Controles necessários: vencimento, renovação automática, reajuste por índice (IGPM, IPCA), aditivos. O agente já gera minutas e gerencia o fluxo de aprovação, mas falta integração com plataformas de assinatura digital (DocuSign, Clicksign, D4Sign) e OCR para digitalização de contratos físicos legados.',
      },
    ],
  },
  {
    icon: Receipt,
    name: 'Tributário & Fiscal',
    rows: [
      {
        processo: 'Escolha regime tributário',
        status: 'parcial',
        complexidade: 'tarefa',
        frequencia: 'anual',
        recurso: 'Agente Contador',
        observacao: 'Comparativo automático; opção via portal gov',
        detalhe: 'Três regimes: Simples Nacional (faturamento até R$4,8M, alíquota progressiva por anexo I-V), Lucro Presumido (presunção de margem por atividade — 8% comércio, 32% serviços) e Lucro Real (apuração sobre lucro contábil efetivo, obrigatório acima de R$78M/ano). A simulação precisa considerar: faturamento projetado, folha de pagamento (fator R no Simples), margem de lucro real, créditos de PIS/COFINS (só Lucro Real), ISS/ICMS por município/estado. Janela de opção: janeiro de cada ano (Simples) ou primeiro pagamento do ano (Presumido/Real). O agente calcula o comparativo, mas a opção é feita no portal do Simples Nacional ou via primeiro DARF do ano.',
      },
      {
        processo: 'Apuração Simples Nacional',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Fiscal',
        observacao: 'Cálculo DAS; geração de guia manual',
        detalhe: 'Cálculo do DAS (Documento de Arrecadação do Simples): soma o faturamento bruto dos últimos 12 meses (RBT12), aplica a alíquota do anexo correspondente (I=comércio, II=indústria, III=serviços, IV=serviços com ISS, V=serviços intelectuais), desconta a parcela a deduzir. Fator R (folha/faturamento > 28%) pode mover empresa do Anexo V para III (alíquota menor). O sistema precisa: consolidar todas as NFs emitidas no mês, classificar por anexo, calcular RBT12 rolling, gerar o valor do DAS, alertar sobre sublimite estadual (R$3,6M para ICMS/ISS). A guia é gerada no PGDAS-D (portal do Simples). Vencimento: dia 20 do mês seguinte.',
      },
      {
        processo: 'Apuração Lucro Presumido',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'trimestral',
        recurso: 'Agente Contador',
        observacao: 'Cálculo automático; DARF gerado internamente',
        detalhe: 'Apuração trimestral de IRPJ (15% + adicional de 10% sobre lucro acima de R$60k/trimestre) e CSLL (9%) sobre base presumida. Presunções: 8% para comércio/indústria, 1,6% para revenda de combustíveis, 32% para serviços, 16% para transporte. PIS (0,65%) e COFINS (3%) são cumulativos (sem créditos) e apurados mensalmente. O workflow: consolida receita bruta → aplica percentual de presunção → calcula IRPJ/CSLL trimestrais → calcula PIS/COFINS mensais → gera DARFs com códigos corretos (IRPJ: 2089, CSLL: 2372, PIS: 8109, COFINS: 2172). Vencimentos: último dia útil do mês seguinte ao trimestre (IRPJ/CSLL), dia 25 do mês seguinte (PIS/COFINS).',
      },
      {
        processo: 'Apuração Lucro Real',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Contador',
        observacao: 'LALUR + PIS/COFINS; sem transmissão oficial',
        detalhe: 'O regime mais complexo: IRPJ/CSLL calculados sobre lucro contábil ajustado por adições (multas, brindes, provisões não dedutíveis) e exclusões (receitas não tributáveis) no LALUR (Livro de Apuração do Lucro Real) — Parte A (ajustes) e Parte B (controle de prejuízos). PIS (1,65%) e COFINS (7,6%) são não-cumulativos: o sistema precisa identificar créditos sobre insumos, energia, aluguel, depreciação, devoluções. Pode ser trimestral ou anual (com estimativas mensais por balancete de suspensão/redução). O workflow: fecha balancete mensal → lança ajustes no LALUR → calcula IRPJ/CSLL (com compensação de prejuízo fiscal limitada a 30%) → apura PIS/COFINS não-cumulativo com créditos → gera DARFs. Obrigatório para empresas com faturamento >R$78M/ano.',
      },
      {
        processo: 'Emissão NF-e / NFS-e',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Faturamento',
        observacao: 'Emissão automática; monitoramento de rejeições SEFAZ',
        detalhe: 'NF-e (produto): integração com SEFAZ estadual via web service (SOAP/REST), certificado digital A1/A3 (ICP-Brasil), XML assinado digitalmente, validação de schema, DANFE para transporte. Cada estado tem endpoint e particularidades (ICMS-ST, FCP, DIFAL). NFS-e (serviço): cada município tem sistema próprio — não existe padrão nacional unificado (ABRASF é referência mas não obrigatório). São +5.000 municípios com APIs diferentes. O sistema precisa: emitir automaticamente ao fechar venda/serviço, tratar rejeições da SEFAZ (código + motivo), armazenar XML por 5 anos, gerar carta de correção (CC-e), processar cancelamentos (até 24h) e inutilizações de numeração. Eventos: manifestação do destinatário (ciência, confirmação, desconhecimento). CT-e para transporte tem fluxo separado.',
      },
      {
        processo: 'Obrigações acessórias',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Calendário Fiscal',
        observacao: 'Alertas automáticos; geração de arquivos parcial',
        detalhe: 'Calendário varia por regime: Simples Nacional (PGDAS-D mensal, DEFIS anual), Lucro Presumido (DCTF mensal, EFD-Contribuições, ECF anual), Lucro Real (todas as anteriores + ECD, ECF, LALUR, EFD-ICMS/IPI). Obrigações municipais: DES, GIA-ST, declarações de ISS retido. Estaduais: GIA, SINTEGRA, DeSTDA (Simples). Federais: DIRF (extinta em 2024, migrou para EFD-Reinf), RAIS (extinta, migrou para eSocial). O sistema precisa: manter calendário atualizado por regime e jurisdição, gerar alertas escalonados (15 dias, 7 dias, 1 dia antes do vencimento), rastrear status de cada obrigação (pendente, gerada, transmitida, recebida), armazenar recibos de entrega. Multas por atraso variam: DCTF R$500/mês, ECD R$1.500/mês.',
      },
      {
        processo: 'SPED (ECD/ECF/EFD)',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'trimestral',
        recurso: 'Agente Contábil',
        observacao: 'Geração planejada; validação pré-transmissão',
        detalhe: 'Sistema Público de Escrituração Digital com 3 pilares: ECD (Escrituração Contábil Digital — livro diário/razão, entrega anual em junho), ECF (Escrituração Contábil Fiscal — IRPJ/CSLL com LALUR, entrega anual em julho), EFD (subdividida em EFD-ICMS/IPI mensal e EFD-Contribuições mensal para PIS/COFINS). Cada arquivo tem layout específico com blocos e registros (ex: ECD tem blocos I, J, K; ECF tem blocos 0, C, E, J, K, L, M, N, P, T, U, X, Y). O sistema precisa gerar os arquivos TXT no layout exato da RFB, validar com o PVA (Programa Validador e Assinador) antes da transmissão, assinar com certificado digital e transmitir via ReceitaNet. Erros de validação são comuns e precisam de correção iterativa. Retificações têm prazo de 5 anos.',
      },
      {
        processo: 'DCTF / DARF',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Fiscal',
        observacao: 'Geração de DARF automática; conciliação DCTF',
        detalhe: 'DCTF (Declaração de Débitos e Créditos Tributários Federais): declara os tributos devidos (IRPJ, CSLL, PIS, COFINS, IPI, IRRF, CIDE) e como foram pagos (DARF, compensação via PER/DCOMP). A DCTF está migrando para DCTFWeb (unificação com eSocial/EFD-Reinf). DARF: guia de pagamento com código de receita específico por tributo, período de apuração, número de referência e valor. O sistema precisa: calcular cada tributo → gerar DARF com código correto → conciliar DCTF (débitos declarados) com DARFs efetivamente pagos → identificar divergências antes da transmissão. Multa por DCTF em atraso: 2% ao mês sobre o valor declarado (mínimo R$500). O e-CAC da RFB mostra pendências que o sistema deve monitorar.',
      },
    ],
  },
  {
    icon: Calculator,
    name: 'Contabilidade & Finanças',
    rows: [
      {
        processo: 'DRE',
        status: 'parcial',
        complexidade: 'tarefa',
        frequencia: 'mensal',
        recurso: 'Agente Contador',
        observacao: 'Geração automática; margens em tempo real',
        detalhe: 'Demonstração do Resultado do Exercício com estrutura CPC/IFRS: Receita Bruta → (-) Deduções (impostos sobre vendas, devoluções, descontos) → Receita Líquida → (-) CMV/CSP → Lucro Bruto → (-) Despesas Operacionais (vendas, administrativas, gerais) → (+/-) Outras Receitas/Despesas → EBITDA → (-) Depreciação/Amortização → EBIT → (+/-) Resultado Financeiro → Lucro Antes do IR → (-) IR/CSLL → Lucro Líquido. O sistema precisa classificar automaticamente cada lançamento contábil na conta correta do plano de contas, consolidar por centro de custo e gerar comparativos (mês anterior, mesmo mês ano anterior, orçado vs realizado). Margens calculadas: bruta, operacional, EBITDA, líquida. Para PMEs, a DRE simplificada (NBC TG 1002) tem menos exigências.',
      },
      {
        processo: 'Balanço Patrimonial',
        status: 'planejado',
        complexidade: 'workflow',
        frequencia: 'trimestral',
        recurso: 'Agente Contador',
        observacao: 'Consolidação de saldos; comparativo entre períodos',
        detalhe: 'Estrutura: Ativo (Circulante + Não Circulante) = Passivo (Circulante + Não Circulante) + Patrimônio Líquido. Requer fechamento contábil completo: conciliação de todas as contas, provisões (férias, 13º, contingências), depreciação acumulada, ajuste a valor presente de recebíveis/pagáveis de longo prazo, teste de impairment de ativos. Notas explicativas são obrigatórias para empresas de médio/grande porte. O sistema precisa: consolidar saldos de todas as contas patrimoniais, calcular índices de liquidez (corrente, seca, geral), endividamento, ROE e ROA, gerar comparativo com período anterior e análise vertical/horizontal. Para grupos econômicos: consolidação eliminando operações intercompany.',
      },
      {
        processo: 'Fluxo de Caixa',
        status: 'automatizavel',
        complexidade: 'tarefa',
        frequencia: 'diario',
        recurso: 'Agente Tesoureiro',
        observacao: 'Atualização em tempo real + projeção automática',
        detalhe: 'Dois métodos: direto (entradas e saídas efetivas de caixa) e indireto (parte do lucro líquido e ajusta itens não-caixa). O sistema opera no método direto para gestão diária e gera o indireto para fins contábeis (DFC — Demonstração dos Fluxos de Caixa). Classificação em 3 atividades: operacionais (vendas, pagamentos a fornecedores, salários), investimento (compra/venda de ativos, aplicações) e financiamento (empréstimos, distribuição de lucros). A projeção automática usa: contas a receber com probabilidade de recebimento (aging), contas a pagar confirmadas, receita recorrente (contratos), sazonalidade histórica. Alerta proativo quando projeção indica saldo negativo em X dias. O agente já faz tudo isso via Google Sheets + dados internos.',
      },
      {
        processo: 'Contas a Receber',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Financeiro',
        observacao: 'Cobrança automática + aging dashboard',
        detalhe: 'Ciclo completo: emissão da fatura (vinculada à NF) → envio ao cliente (email/WhatsApp) → monitoramento de pagamento → baixa automática (via conciliação bancária ou webhook do gateway) → cobrança em caso de atraso. Régua de cobrança configurável: D+1 lembrete amigável, D+7 segunda cobrança, D+15 notificação formal, D+30 negativação (SPC/Serasa via API), D+60 encaminhamento jurídico. Aging report por faixas: a vencer, 1-15 dias, 16-30, 31-60, 61-90, >90 dias. Integrações necessárias: gateway de pagamento (Stripe, PagSeguro, Asaas) para baixa automática de boleto/Pix, plataforma de negativação, email/WhatsApp para cobrança. Desconto por antecipação e juros/multa por atraso calculados automaticamente.',
      },
      {
        processo: 'Contas a Pagar',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Financeiro',
        observacao: 'Workflow de aprovação por alçada + agendamento',
        detalhe: 'Fluxo: recebimento da NF/fatura do fornecedor → conferência (valor, CNPJ, impostos retidos) → aprovação por alçada (operacional até R$5k, gerente até R$50k, diretor acima) → agendamento do pagamento → execução no banco → baixa contábil. O sistema precisa gerenciar: retenções na fonte (IR 1,5%, PIS/COFINS/CSLL 4,65%, ISS conforme município), categorização por centro de custo e conta contábil, priorização por vencimento (evitar juros) e por desconto por antecipação. Formas de pagamento: boleto, transferência bancária (TED/PIX), débito automático. O agente já processa tudo com workflow de aprovação automático, falta integração bancária direta (Open Finance) para execução do pagamento sem intervenção.',
      },
      {
        processo: 'Conciliação bancária',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Financeiro',
        observacao: 'Matching automático; divergências para revisão humana',
        detalhe: 'Processo de cruzar o extrato bancário (origem: OFX/CSV do banco ou API Open Finance) com os lançamentos internos do sistema (contas a pagar/receber). Matching por: valor exato + data + referência/descrição. Regras de matching inteligente: agrupar múltiplos lançamentos que somam o valor de uma transferência, identificar tarifas bancárias, IOF, rendimentos de aplicação. Divergências comuns: pagamentos parciais, valores com juros/multa, depósitos não identificados, cheques compensados em data diferente. O sistema faz matching automático para ~80% dos lançamentos; os ~20% restantes vão para fila de revisão humana com sugestões. Trilha de auditoria completa: quem conciliou, quando, qual critério. Frequência ideal: diária para empresas com alto volume, semanal para PMEs.',
      },
      {
        processo: 'Orçamento empresarial',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'anual',
        recurso: 'Agente Controller',
        observacao: 'Consolidação departamental + cenários simulados',
        detalhe: 'Ciclo orçamentário anual: cada departamento submete seu budget (bottom-up) → controller consolida → diretoria aprova (top-down) → acompanhamento mensal de variação (realizado vs orçado). Tipos: orçamento base zero (ZBB — justifica cada gasto), incremental (base no ano anterior + %), rolling forecast (atualiza projeção a cada trimestre). O sistema precisa: coletar inputs por centro de custo, consolidar em visão empresa, gerar 3 cenários (otimista, realista, pessimista) com premissas configuráveis (crescimento de receita, inflação, câmbio, headcount), analisar variações mensais com drill-down por conta/departamento. Alertas quando variação > threshold definido (ex: +15% de despesa). O agente já consolida e gera cenários, mas a coleta de inputs departamentais ainda é manual.',
      },
    ],
  },
  {
    icon: Users,
    name: 'RH & Dept. Pessoal',
    rows: [
      {
        processo: 'Admissão CLT',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'por-demanda',
        recurso: 'Workflow + Agente RH',
        observacao: 'Checklist automático; registro CTPS manual',
        detalhe: 'Fluxo legal: exame admissional (ASO) → coleta de documentos (RG, CPF, CTPS digital, foto, comprovante de endereço, certidão de nascimento/casamento, PIS/PASEP) → registro na CTPS digital (prazo: 5 dias úteis — art. 29 CLT) → cadastro no eSocial (evento S-2200) → inclusão em benefícios (VT, VR/VA, plano de saúde) → abertura de conta salário. Variações por tipo: menor aprendiz (14-24 anos, jornada reduzida), PCD (cota obrigatória para empresas >100 funcionários), estrangeiro (precisa de visto de trabalho e CRNM). O sistema gera checklist por tipo de contratação e rastreia cada etapa, mas o registro efetivo na CTPS digital e eSocial precisa ser feito nos portais oficiais.',
      },
      {
        processo: 'Onboarding',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'por-demanda',
        recurso: 'Workflow + Agente RH',
        observacao: 'Plano 30/60/90 automático com acompanhamento',
        detalhe: 'Workflow disparado automaticamente após conclusão da admissão. Etapas: Dia 1 (boas-vindas, acesso a sistemas, apresentação do time, handbook da empresa), Semana 1 (treinamentos obrigatórios: compliance, segurança, LGPD, cultura), 30 dias (avaliação de adaptação, feedback do gestor direto, ajuste de expectativas), 60 dias (avaliação de performance inicial, definição de metas), 90 dias (avaliação final do período de experiência — art. 445 CLT — decisão de efetivação). O sistema gera plano personalizado por cargo/departamento, atribui tarefas aos envolvidos (RH, gestor, TI, facilities), rastreia conclusão de cada etapa e gera relatório de onboarding. Métricas: tempo até produtividade, taxa de conclusão de treinamentos, NPS do novo colaborador.',
      },
      {
        processo: 'Folha de pagamento',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'mensal',
        recurso: 'Agente Financeiro',
        observacao: 'Importação de dados; cálculo em sistema externo',
        detalhe: 'Cálculo extremamente regulado: salário base + horas extras (50% dia, 100% domingo/feriado) + adicional noturno (20%) + insalubridade (10/20/40% do salário mínimo) + periculosidade (30% do salário base) + comissões — descontos (INSS progressivo 7,5-14%, IRRF progressivo 0-27,5%, VT até 6% do salário, faltas, adiantamentos). Precisa integrar com: ponto eletrônico (REP-P conforme Portaria 671/MTE), sistema de benefícios, sindicato (CCT com pisos e benefícios específicos por categoria). Output: holerite, guia de FGTS (GRFGTS — 8% do salário bruto), GPS/DARF de INSS patronal (20% + RAT 1-3% + terceiros), IRRF, informes para contabilidade. Prazo: pagamento até o 5º dia útil do mês seguinte. Sistema externo faz o cálculo, o sim importa dados para provisão e contabilização.',
      },
      {
        processo: 'Benefícios',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Workflow mensal',
        observacao: 'Gestão de tarefas recorrentes por operadora',
        detalhe: 'Benefícios comuns: VT (vale-transporte — desconto de até 6% do salário, empresa cobre o excedente), VR/VA (convenção coletiva define valor mínimo, PAT dá dedução fiscal), plano de saúde (ANS regula, coparticipação opcional, inclusão de dependentes), plano odontológico, seguro de vida (obrigatório em algumas CCTs), PLR (Participação nos Lucros — acordo coletivo, isento de encargos). Cada operadora tem portal e processo de inclusão/exclusão diferente: Alelo, Sodexo, VR para alimentação; Unimed, SulAmérica, Bradesco Saúde para plano médico. O sistema precisa: rastrear inclusões/exclusões mensais, calcular rateio empresa/funcionário, gerar relatório de custo per capita, alertar sobre reajustes anuais (plano de saúde reajusta em junho pela ANS). Movimentações devem ser feitas até deadline de cada operadora (geralmente dia 20).',
      },
      {
        processo: 'FGTS / INSS',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'mensal',
        recurso: 'Agente Contábil',
        observacao: 'Alertas de prazo + conciliação; guias externas',
        detalhe: 'FGTS: 8% sobre remuneração bruta depositado na Caixa (conta vinculada do trabalhador). Guia GRFGTS gerada pelo FGTS Digital (novo sistema desde 2024, substituiu SEFIP/GFIP). Prazo: dia 20 do mês seguinte. Multa rescisória: 40% do saldo em demissão sem justa causa. INSS patronal: 20% sobre folha total + RAT (1-3% conforme grau de risco da atividade — CNAE) + FAP (fator acidentário, multiplica RAT por 0,5-2,0) + terceiros (SESI/SENAI/SEBRAE — 5,8%). Empresas do Simples Nacional têm tratamento diferenciado (INSS patronal incluído no DAS para maioria dos anexos). O sistema concilia valores da folha com guias geradas, alerta sobre prazos e monitora CRF (Certidão de Regularidade do FGTS) — essencial para licitações e financiamentos.',
      },
      {
        processo: 'Férias e 13º',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Financeiro',
        observacao: 'Provisão automática + alertas de período concessivo',
        detalhe: 'Férias: direito a 30 dias após 12 meses de trabalho (período aquisitivo). Período concessivo: 12 meses seguintes para conceder. Pode fracionar em até 3 períodos (mínimo 14 dias corridos em um deles — Reforma Trabalhista). Pagamento: salário + 1/3 constitucional, pago 2 dias antes do início. Abono pecuniário: converter 1/3 em dinheiro (10 dias). Se não conceder no prazo: paga em dobro (art. 137 CLT). 13º salário: 1ª parcela (50%) até 30/nov, 2ª parcela (50% - descontos INSS/IR) até 20/dez. Provisão mensal: 1/12 avos por mês trabalhado para ambos. O sistema calcula provisão automaticamente, gera calendário consolidado de férias (evitar conflitos no time), alerta sobre períodos concessivos prestes a vencer e calcula os valores bruto/líquido.',
      },
      {
        processo: 'Rescisão',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'por-demanda',
        recurso: 'Workflow + Agente RH',
        observacao: 'Checklist por modalidade + cálculo de verbas',
        detalhe: 'Modalidades: sem justa causa (aviso prévio + multa 40% FGTS + seguro-desemprego), por justa causa (art. 482 CLT — só saldo de salário + férias vencidas), pedido de demissão (sem multa FGTS, sem seguro-desemprego), acordo mútuo (Reforma Trabalhista — multa 20% FGTS, saca 80% do saldo, sem seguro-desemprego). Verbas rescisórias: saldo de salário, aviso prévio (trabalhado ou indenizado, proporcional ao tempo: 30 dias + 3 dias por ano), férias proporcionais + 1/3, 13º proporcional. Prazo de pagamento: 10 dias corridos (art. 477 CLT). O sistema gera checklist, calcula verbas, simula cenários (com/sem justa causa), gera TRCT (Termo de Rescisão). Exame demissional obrigatório. Homologação sindical obrigatória para contratos >1 ano (depende da CCT).',
      },
      {
        processo: 'eSocial',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'mensal',
        recurso: 'Agente RH',
        observacao: 'Validação pré-envio; sem transmissão direta',
        detalhe: 'Sistema do governo que unifica 15 obrigações trabalhistas/previdenciárias. Eventos periódicos: S-1200 (remuneração mensal), S-1210 (pagamentos), S-1299 (fechamento). Eventos não-periódicos: S-2200 (admissão), S-2206 (alteração contratual), S-2230 (afastamento), S-2299 (desligamento), S-2300 (trabalhador sem vínculo). Eventos de SST: S-2210 (CAT — Comunicação de Acidente), S-2220 (ASO), S-2240 (condições ambientais). Cada evento tem schema XML específico, prazos distintos (admissão: até dia anterior ao início, desligamento: até 10 dias) e regras de validação complexas (cruzamento com CNIS, CPF, CNPJ). O sistema valida dados antes do envio para reduzir rejeições, mas a transmissão é feita via portal ou software de folha homologado. Integração ideal: API REST do eSocial para transmissão direta.',
      },
      {
        processo: 'Segurança do Trabalho',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'anual',
        recurso: 'Workflow anual',
        observacao: 'Rastreamento de NRs e exames; laudos externos',
        detalhe: 'Normas Regulamentadoras (NRs) aplicáveis variam por atividade e porte. Principais: NR-1 (PGR — Programa de Gerenciamento de Riscos, obrigatório), NR-5 (CIPA — obrigatória >20 empregados), NR-6 (EPIs — controle de entrega e validade), NR-7 (PCMSO — exames admissional, periódico, demissional), NR-9 (agentes ambientais), NR-17 (ergonomia). Laudos obrigatórios: LTCAT (para aposentadoria especial), PPRA/PGR, laudo de insalubridade/periculosidade. SIPAT (Semana Interna de Prevenção) obrigatória anualmente. O sistema rastreia: validade de ASOs por funcionário, vencimento de EPIs, mandatos da CIPA, agendamento de SIPAT, renovação de laudos. Os laudos em si são emitidos por engenheiro/médico do trabalho — o sistema apenas gerencia prazos e documentação.',
      },
    ],
  },
  {
    icon: TrendingUp,
    name: 'Vendas & Comercial',
    rows: [
      {
        processo: 'CRM / Pipeline',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente CRM + Workflow',
        observacao: 'Movimentação automática + relatórios diários',
        detalhe: 'Pipeline com etapas configuráveis: Lead → MQL (Marketing Qualified Lead) → SQL (Sales Qualified Lead) → Reunião Agendada → Proposta Enviada → Negociação → Fechado Ganho/Perdido. Movimentação automática baseada em gatilhos: lead responde email → move para MQL, SDR qualifica → move para SQL. Campos obrigatórios por etapa (ex: não pode ir para "Proposta" sem valor estimado). Métricas calculadas em tempo real: taxa de conversão entre etapas, ticket médio, ciclo de venda médio, win rate, pipeline coverage (3x a meta). Relatório diário automático: novos leads, oportunidades movimentadas, deals parados >X dias (stale), previsão de fechamento do mês. O agente já faz tudo isso internamente — os dados vivem no sistema do sim, sem necessidade de CRM externo.',
      },
      {
        processo: 'Prospecção',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Prospecção',
        observacao: 'Enriquecimento de dados + score automático',
        detalhe: 'Dois fluxos: outbound (empresa vai atrás do cliente) e inbound (cliente vem até a empresa via marketing). Outbound: definição de ICP (Ideal Customer Profile — setor, porte, localização, faturamento, dor), montagem de listas (LinkedIn Sales Navigator, Apollo.io, RocketReach), cadência de abordagem multicanal (email frio + LinkedIn + ligação, 8-12 toques em 3 semanas). Inbound: lead entra via formulário/chatbot → enrichment automático (busca CNPJ na RFB, LinkedIn, site da empresa) → lead scoring baseado em fit (matches ICP) + intent (páginas visitadas, conteúdo baixado). Frameworks de qualificação: BANT (Budget, Authority, Need, Timeline), SPIN, MEDDIC. O agente pesquisa dados públicos, enriquece o lead, aplica score e prioriza a fila do SDR automaticamente.',
      },
      {
        processo: 'Propostas comerciais',
        status: 'automatizavel',
        complexidade: 'tarefa',
        frequencia: 'semanal',
        recurso: 'Agente Propostas',
        observacao: 'Geração automática a partir do CRM',
        detalhe: 'Estrutura padrão: capa, sumário executivo (dor do cliente + solução proposta), escopo detalhado (o que está e o que não está incluído), cronograma de implementação, investimento (tabela de preços com breakdown), condições comerciais (pagamento, reajuste, SLA, penalidades), cases de sucesso similares, próximos passos. O agente puxa dados do CRM (empresa, contato, dor identificada, valor estimado) e gera o rascunho automaticamente. Precificação segue regras de negócio configuradas: tabela base × multiplicadores (urgência, complexidade, volume). Personalização por segmento: B2B enterprise tem proposta formal, SMB tem proposta simplificada. Tracking: notificação quando prospect abre a proposta (via pixel/link rastreável), tempo de leitura por seção, número de reaberturas. Output: PDF branded + link de visualização online.',
      },
      {
        processo: 'Contratos comerciais',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Contratos + Workflow',
        observacao: 'Minutas + assinatura digital + alertas',
        detalhe: 'Gerados automaticamente a partir da proposta aprovada: escopo vira cláusula de objeto, preço vira cláusula de remuneração, SLA vira cláusula de nível de serviço. Tipos comuns: contrato de prestação de serviços (prazo determinado/indeterminado), licença de software (SaaS com termos de uso), contrato de revenda/distribuição. Cláusulas sensíveis que exigem revisão jurídica: limitação de responsabilidade, propriedade intelectual, não-concorrência, LGPD (DPA — Data Processing Agreement). Workflow: agente gera minuta → jurídico revisa (tracked changes) → cliente negocia → aprovação final → assinatura digital (integração com DocuSign, Clicksign, D4Sign via API) → armazenamento com metadados (valor, vigência, renovação). Alertas: 90/60/30 dias antes do vencimento, reajuste anual automático por índice contratual.',
      },
      {
        processo: 'Follow-up',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Follow-up',
        observacao: 'Cadências automatizadas + priorização inteligente',
        detalhe: 'Cadências multicanal automatizadas: sequência de emails + mensagens LinkedIn + lembretes de ligação, com intervalos configuráveis (dia 1: email, dia 3: LinkedIn, dia 5: email, dia 7: ligação, etc.). Personalização baseada em contexto: o agente analisa interações anteriores, páginas visitadas no site, conteúdo baixado e adapta a mensagem. Regras de pausa/saída: prospect respondeu → sai da cadência automática e vai para atendimento humano; prospect pediu para não ser contactado → blocklist permanente. Priorização inteligente: leads com maior score e sinais de intent (abriu email 3x, visitou página de preços) sobem na fila. Métricas por cadência: taxa de abertura, taxa de resposta, taxa de conversão para reunião. A/B testing automático de subject lines e copies. O agente já executa tudo isso com dados internos do sim.',
      },
      {
        processo: 'Pós-venda',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente CS',
        observacao: 'Health score + onboarding + alertas de churn',
        detalhe: 'Customer Success com health score composto: uso do produto (logins, features usadas, frequência), engajamento (respostas a emails, participação em calls), financeiro (pagamentos em dia, upsell realizado), suporte (volume de tickets, severidade, CSAT). Score de 0-100 com faixas: verde (>70), amarelo (40-70), vermelho (<40). Alertas de churn: queda de uso >30% em 2 semanas, ticket de severidade alta sem resolução, NPS detrator. Onboarding estruturado pós-venda: kickoff call → configuração → treinamento → go-live → review de 30 dias. Playbooks automáticos: cliente em risco → agendar call de retenção, cliente saudável → oferecer upsell/cross-sell. QBR (Quarterly Business Review) automático: relatório de valor entregue + próximos passos. Métricas: NRR (Net Revenue Retention), churn rate, expansion revenue, time-to-value.',
      },
    ],
  },
  {
    icon: Megaphone,
    name: 'Marketing',
    rows: [
      {
        processo: 'Branding',
        status: 'parcial',
        complexidade: 'tarefa',
        frequencia: 'por-demanda',
        recurso: 'Agente Branding',
        observacao: 'Validação de guidelines; criação parcial',
        detalhe: 'Brand guidelines: logotipo (versões, área de proteção, usos incorretos), paleta de cores (primárias, secundárias, com códigos HEX/RGB/CMYK/Pantone), tipografia (fontes para títulos, corpo, digital, impressos), tom de voz (formal/informal, palavras a usar/evitar), iconografia, fotografia (estilo, filtros, composição). O agente valida automaticamente se uma peça segue as guidelines (cores corretas, logo no tamanho certo, fonte aprovada) mas a criação de ativos visuais (logo, key visual, templates) é feita por designer ou ferramenta de design. Auditoria periódica de brand consistency: verifica site, redes sociais, materiais impressos, apresentações, emails. Precisa armazenar os assets em brand center acessível (logos em SVG/PNG/PDF, templates de apresentação, assinatura de email).',
      },
      {
        processo: 'Marketing Digital',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Analytics + Workflow',
        observacao: 'Consolidação multicanal + alocação de budget',
        detalhe: 'Dashboard unificado consolidando dados de múltiplos canais: Google Analytics 4 (tráfego, conversões, comportamento), Google Ads (CPC, CTR, conversões, ROAS), Meta Ads (Facebook + Instagram — alcance, engajamento, leads), LinkedIn Ads (B2B — CPL, taxa de conversão), email marketing (opens, clicks, conversões), orgânico (posições SEO, tráfego orgânico). Integrações via API: Google Analytics Data API, Google Ads API, Meta Marketing API, LinkedIn Marketing API. KPIs consolidados: CAC (Custo de Aquisição de Cliente) por canal, LTV/CAC ratio, ROAS por campanha, contribution margin. Alocação de budget: o agente analisa performance histórica por canal e sugere redistribuição para maximizar ROI. Relatório semanal automático com anomalias (queda >20% em métrica-chave = alerta).',
      },
      {
        processo: 'Redes Sociais',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Social Media',
        observacao: 'Sugestão de pautas + publicação automática',
        detalhe: 'Cada rede tem API e particularidades próprias. Instagram: Graph API (posts, stories, reels — formatos 1:1, 9:16, 1.91:1), limite de 30 hashtags, melhor horário varia por nicho, algoritmo prioriza reels e carrosséis. LinkedIn: Share API (texto, artigo, documento, vídeo), algoritmo valoriza comentários nos primeiros 90min, posts de texto puro têm mais alcance que links externos. X/Twitter: API v2, limite de 280 caracteres (ou threads), melhor frequência é 3-5x/dia. Facebook: Graph API, alcance orgânico <5%, prioriza grupos e vídeos. TikTok: Content Posting API (vídeos verticais 9:16), algoritmo baseado em watch time e replays. YouTube: Data API v3 (upload, metadata, thumbnails). O agente precisa adaptar formato, tom e horário para cada rede. Calendário editorial com categorias (educativo, promocional, institucional, UGC). Monitoramento de menções e comentários com classificação de sentimento (positivo/neutro/negativo). Métricas por rede: alcance, impressões, engajamento rate, crescimento de seguidores.',
      },
      {
        processo: 'Conteúdo',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Conteúdo',
        observacao: 'Blog posts SEO + distribuição multicanal',
        detalhe: 'Funil de conteúdo: ToFu (awareness — blog posts, infográficos, vídeos educativos), MoFu (consideration — ebooks, webinars, case studies, comparativos), BoFu (decision — demos, trials, consultorias). O agente gera rascunhos otimizados para SEO: pesquisa de keywords (volume, dificuldade, intenção de busca), estrutura de headings (H1-H3), meta title e description, internal linking, alt text de imagens. Processo: briefing (keyword + persona + stage) → rascunho IA → revisão editorial → publicação → distribuição (newsletter, redes sociais, LinkedIn article, syndication). Distribuição multicanal: o mesmo conteúdo é adaptado para cada formato (blog completo → resumo para LinkedIn → thread para X → carrossel para Instagram → vídeo curto para TikTok). Métricas: tráfego orgânico por post, tempo na página, scroll depth, conversão (CTA clicks, leads gerados), backlinks earned.',
      },
      {
        processo: 'Anúncios pagos',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Ads',
        observacao: 'Monitoramento + sugestões; sem API de plataformas',
        detalhe: 'Plataformas principais: Google Ads (Search, Display, YouTube, Shopping, Performance Max), Meta Ads (Facebook + Instagram — feed, stories, reels, audience network), LinkedIn Ads (Sponsored Content, InMail, Text Ads — CPC alto mas B2B qualificado), TikTok Ads (In-Feed, TopView, Branded Effects). Cada plataforma tem: API própria para gerenciamento de campanhas, pixel/tag de conversão, audiences (lookalike, retargeting, custom), formatos de criativo diferentes, regras de aprovação distintas. O agente monitora métricas em tempo real (CPC, CPM, CTR, CPA, ROAS) e sugere otimizações: pausar anúncios com CTR <1%, realocar budget para campanhas com ROAS >3x, sugerir novos públicos, alertar sobre fatigue de criativo (frequência >3). Integração com APIs das plataformas é necessária para executar alterações automaticamente — hoje o agente apenas sugere e o humano executa.',
      },
      {
        processo: 'SEO',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente SEO',
        observacao: 'Auditoria técnica + monitoramento de keywords',
        detalhe: 'Três pilares: técnico (velocidade, Core Web Vitals — LCP/FID/CLS, indexação, sitemap, robots.txt, canonical, hreflang, schema markup/structured data), on-page (title tags, meta descriptions, H1-H3, keyword density, internal linking, imagens otimizadas) e off-page (backlinks — DA/DR, anchor text distribution, link building). O agente faz auditoria técnica automatizada: crawl do site identificando erros 404, redirects em cadeia, páginas não indexadas, páginas lentas, conteúdo duplicado. Monitoramento de keywords: posição no Google para target keywords (APIs: Google Search Console, SEMrush, Ahrefs), alertas quando posição cai >5 posições. Sugestões automáticas de otimização on-page para cada novo conteúdo publicado. Relatório semanal: keywords que subiram/caíram, novas oportunidades, backlinks ganhos/perdidos. Competitor tracking: monitora posições dos concorrentes para as mesmas keywords.',
      },
      {
        processo: 'Email Marketing',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Email Marketing',
        observacao: 'Copies otimizadas + automações comportamentais',
        detalhe: 'Tipos: newsletters (broadcast semanal/quinzenal), campanhas promocionais (lançamentos, ofertas), automações comportamentais (welcome series, abandoned cart, re-engagement, lead nurturing). O agente gera subject lines otimizadas (A/B testing automático, emojis, personalização com merge tags), preview text, body copy e CTAs. Automações: trigger por comportamento do lead (baixou ebook → sequência de nurturing de 5 emails em 3 semanas, não abriu 3 emails seguidos → re-engagement com desconto). Segmentação: por estágio do funil, interesse (tags), engajamento (ativo/inativo), dados demográficos. Integrações: plataformas de envio (Mailchimp API, SendGrid, ActiveCampaign, RD Station), CRM para sincronizar contatos. Métricas: delivery rate (>95%), open rate (benchmark 20-25%), click rate (2-5%), conversion rate, unsubscribe rate (<0,5%). LGPD: double opt-in, link de descadastro obrigatório, política de privacidade.',
      },
      {
        processo: 'Funil de conversão',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente CRO + Workflow',
        observacao: 'Análise de taxas + rastreamento de leads',
        detalhe: 'Funil completo: visitante → lead (formulário, chatbot, trial) → MQL (engajou com conteúdo) → SQL (qualificado por vendas) → oportunidade → cliente. Taxas de conversão benchmark: visitante→lead 2-5%, lead→MQL 30-40%, MQL→SQL 50-60%, SQL→oportunidade 60-70%, oportunidade→cliente 20-30%. O agente analisa cada transição e identifica gargalos: se visitante→lead está baixo, sugere otimizar landing pages (CRO — Conversion Rate Optimization); se MQL→SQL está baixo, sugere revisar critérios de qualificação. Ferramentas de análise: heatmaps (onde o usuário clica), session recordings (como navega), form analytics (onde abandona o formulário). Testes: A/B testing de landing pages, formulários, CTAs, headlines. Rastreamento end-to-end: UTM parameters → primeiro toque → última interação → conversão, com atribuição multi-touch. O workflow rastreia leads automaticamente entre etapas e notifica equipes responsáveis.',
      },
    ],
  },
  {
    icon: Cog,
    name: 'Operações & Processos',
    rows: [
      {
        processo: 'Cadeia de suprimentos',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'semanal',
        recurso: 'Agente Compras',
        observacao: 'Avaliação de cotações; sem integração fornecedores',
        detalhe: 'Fluxo: requisição de compra (usuário interno) → cotação com 3+ fornecedores → análise comparativa (preço, prazo, qualidade, condição de pagamento) → aprovação por alçada → pedido de compra (PO) → recebimento → conferência (NF vs PO — quantidade, valor, impostos) → pagamento. O agente avalia cotações automaticamente usando critérios ponderados configuráveis. Gestão de fornecedores: cadastro com documentação (CNPJ, certidões negativas, referências), avaliação periódica (qualidade, pontualidade, preço), categorização (ABC por volume de compra). Para supply chain completa: lead time por fornecedor, ponto de pedido (estoque mínimo × lead time), lote econômico de compra (EOQ). Integração ideal: EDI (Electronic Data Interchange) ou API com fornecedores para envio automático de PO e rastreamento de entrega. Hoje o agente compara cotações mas comunicação com fornecedores é manual (email).',
      },
      {
        processo: 'Estoque',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Estoque',
        observacao: 'Saldo automático + alertas; sem WMS integrado',
        detalhe: 'Controle: entrada (NF de compra), saída (NF de venda, requisição interna, perda/avaria), transferência entre depósitos, inventário (contagem cíclica ou geral). Métodos de custeio: PEPS (primeiro que entra, primeiro que sai — obrigatório para fins fiscais no Brasil), custo médio ponderado (mais usado na prática), custo padrão (para indústria). Curva ABC: classe A (20% dos itens = 80% do valor), B (30% = 15%), C (50% = 5%). O sistema atualiza saldo a cada movimentação e alerta quando item classe A atinge estoque de segurança. Para operação completa: integração com WMS (Warehouse Management System) para controle de posição (rua, prateleira, nível), picking list, packing, expedição com etiqueta/código de barras. Hoje o agente rastreia saldo e gera alertas, mas sem controle de posição física ou integração com leitores de código de barras/RFID.',
      },
      {
        processo: 'Logística',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Logística',
        observacao: 'Atribuição de transportadora; sem tracking API',
        detalhe: 'Fluxo: pedido aprovado → separação (picking) → embalagem (packing) → emissão de NF-e + CT-e (Conhecimento de Transporte) → despacho → rastreamento → confirmação de entrega (POD — Proof of Delivery). Seleção de transportadora: o agente compara custo, prazo e cobertura entre múltiplas transportadoras (Correios via API dos Correios, Jadlog, Total Express, Azul Cargo, transportadoras regionais). Cada transportadora tem API diferente para: cotação de frete, geração de etiqueta, postagem e rastreamento. Tabela de frete: peso vs dimensões (peso cubado = C×L×A/6000), faixas de CEP, ad valorem (% sobre valor da mercadoria), GRIS (seguro). Logística reversa: troca/devolução com coleta no endereço do cliente. Métricas: OTIF (On Time In Full), custo de frete/receita, taxa de avaria, SLA de entrega por região. Hoje o agente atribui transportadora por regra, mas sem tracking API integrado.',
      },
      {
        processo: 'Qualidade',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Qualidade + Workflow',
        observacao: 'Auditoria interna + gestão de NCs',
        detalhe: 'Sistema de Gestão da Qualidade (SGQ) baseado em ISO 9001: política da qualidade, objetivos mensuráveis, processos documentados, auditorias internas, ações corretivas/preventivas, análise crítica pela direção. Ciclo PDCA: Plan (planejar melhoria) → Do (executar) → Check (verificar resultados) → Act (padronizar ou corrigir). Não-conformidades (NCs): registro → análise de causa raiz (5 Porquês, Ishikawa, 8D) → plano de ação corretiva → prazo → verificação de eficácia. Auditorias internas: checklist por processo, evidências documentais, relatório com NCs classificadas por severidade (crítica/maior/menor/observação). O agente agenda auditorias, gera checklists, registra NCs e cobra prazo de planos de ação automaticamente. Para empresas com certificação ISO: o sistema precisa manter o SGQ documentado e rastrear indicadores de qualidade (taxa de defeito, reclamações de cliente, retrabalho).',
      },
      {
        processo: 'SOPs',
        status: 'automatizavel',
        complexidade: 'tarefa',
        frequencia: 'por-demanda',
        recurso: 'Agente Processos + Wiki',
        observacao: 'Geração de SOPs + workflow de revisão',
        detalhe: 'SOP (Standard Operating Procedure) = documento que padroniza a execução de uma atividade. Estrutura: objetivo, escopo, responsáveis, definições/siglas, materiais necessários, passo a passo detalhado (com screenshots se digital), critérios de aceitação, registros gerados, referências normativas. O agente gera rascunho de SOP a partir de descrição textual da atividade, formatando no padrão da empresa. Armazenamento na Wiki interna com: versionamento (v1.0, v1.1), data de criação/revisão, autor, aprovador. Workflow de revisão periódica: o sistema notifica o gestor responsável quando SOP atinge data de revisão (geralmente anual). Controle de leitura: rastreia quais colaboradores leram/confirmaram cada SOP (obrigatório para ISO 9001 e compliance). Categorização: por departamento, processo, tipo (operacional, administrativo, emergência).',
      },
      {
        processo: 'KPIs operacionais',
        status: 'automatizavel',
        complexidade: 'tarefa',
        frequencia: 'diario',
        recurso: 'Agente BI + Dashboard',
        observacao: 'OEE, lead time, OTIF em tempo real',
        detalhe: 'KPIs por área: Produção — OEE (Overall Equipment Effectiveness = disponibilidade × performance × qualidade, benchmark >85%), takt time, throughput, taxa de refugo. Logística — OTIF (On Time In Full, benchmark >95%), custo de frete/receita (<5%), tempo de ciclo do pedido. Estoque — giro de estoque (receita/estoque médio), acuracidade de inventário (>97%), dias de estoque (DOH). Compras — saving rate, lead time de fornecimento, taxa de entrega no prazo do fornecedor. Qualidade — PPM (Parts Per Million defeituosas), taxa de reclamações, custo de não-qualidade. O agente coleta dados automaticamente dos módulos internos, calcula cada indicador em tempo real, gera dashboard com semáforo (verde/amarelo/vermelho baseado em targets definidos) e relatório semanal com análise de desvios e recomendações de ação corretiva. Alertas automáticos quando KPI ultrapassa limite crítico.',
      },
    ],
  },
  {
    icon: Headphones,
    name: 'Atendimento ao Cliente',
    rows: [
      {
        processo: 'Canais de atendimento',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Atendimento',
        observacao: 'Resposta automática em canais integrados',
        detalhe: 'Multicanal integrado: WhatsApp Business API (mensagens template HSM para ativo, sessão de 24h para reativo, mídia rica, botões de resposta rápida, listas), email (IMAP/SMTP ou API do provider — Gmail API, Outlook Graph API), chat no site (widget embed com websocket), telefone (integração com PABX/VoIP via SIP/WebRTC, gravação de chamadas), redes sociais (Facebook Messenger Graph API, Instagram Direct, Twitter DM). Cada canal tem regras diferentes: WhatsApp cobra por conversa (modelo de preço por categoria — utility, marketing, service), email é assíncrono, chat exige resposta em <30s. O agente responde automaticamente perguntas frequentes (FAQ via knowledge base), identifica intenção e encaminha para departamento correto. Histórico unificado: todas as interações do cliente em todos os canais visíveis em timeline única. Horário de atendimento configurável com mensagem de ausência automática.',
      },
      {
        processo: 'SLA',
        status: 'automatizavel',
        complexidade: 'tarefa',
        frequencia: 'diario',
        recurso: 'Motor de SLA',
        observacao: 'Cálculo automático + alertas em 80% do prazo',
        detalhe: 'SLA (Service Level Agreement) com prazos por prioridade: P1/Crítico (sistema fora do ar — 1h primeira resposta, 4h resolução), P2/Alto (funcionalidade principal impactada — 4h resposta, 8h resolução), P3/Médio (funcionalidade secundária — 8h resposta, 24h resolução), P4/Baixo (dúvida, melhoria — 24h resposta, 72h resolução). Prazos contam apenas em horário comercial (configurable business hours). O motor calcula: tempo restante para primeira resposta, tempo restante para resolução, percentual consumido do SLA. Alertas escalonados: 50% do tempo (amarelo — atenção), 80% (laranja — urgente ao atendente), 100% (vermelho — breach, escala para gerente). Métricas mensais: % de tickets dentro do SLA por prioridade, MTTR (Mean Time To Resolve), MTTFR (Mean Time To First Response). Penalidades contratuais: se SLA breach >X% no mês, crédito de Y% na fatura (para contratos enterprise).',
      },
      {
        processo: 'Tickets',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Suporte + Workflow',
        observacao: 'Abertura, categorização e distribuição automáticas',
        detalhe: 'Ciclo de vida: Aberto → Em Andamento → Aguardando Cliente → Resolvido → Fechado (fecha automaticamente após X dias sem resposta do cliente). Campos: assunto, descrição, categoria (bug, dúvida, solicitação, reclamação), subcategoria, prioridade (auto-calculada por regras: cliente enterprise + sistema fora = P1), canal de origem, atribuído a. O agente categoriza automaticamente por NLP (análise do texto), atribui prioridade e distribui entre atendentes por: especialidade (cada atendente tem skills configurados — financeiro, técnico, comercial), carga de trabalho atual (round-robin ponderado), idioma do cliente. Respostas sugeridas: o agente busca na knowledge base e sugere resposta ao atendente (ou responde diretamente se confiança >90%). Merge de tickets duplicados do mesmo cliente. Métricas: backlog, tickets/dia, resolução no primeiro contato (FCR, benchmark >70%), CSAT por ticket.',
      },
      {
        processo: 'Escalação',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Workflow de escalação',
        observacao: 'N1→N2→N3 automático com contexto completo',
        detalhe: 'Níveis: N1 (atendimento geral — FAQ, procedimentos básicos, triagem, SLA: resolver 70% dos tickets), N2 (especialista — problemas técnicos, análise de conta, requer acesso a sistemas internos), N3 (engenharia/produto — bugs confirmados, feature requests, requer intervenção no código). Regras de escalação automática: ticket aberto >X horas sem resolução → escala para N2; N2 identifica bug → escala para N3 com evidências (logs, screenshots, steps to reproduce). Cada escalação carrega contexto completo: histórico de mensagens, ações já tentadas, dados do cliente, prints/anexos. Escalonamento hierárquico: se gerente de suporte não age em 2h após breach de SLA → notifica diretor. O workflow move o ticket automaticamente, notifica o próximo nível e preserva todo o contexto para evitar que o cliente repita informações. Dashboard: taxa de escalação por categoria (ideal <30%), tempo médio em cada nível.',
      },
      {
        processo: 'NPS / CSAT',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente CX',
        observacao: 'Pesquisas automáticas + análise de sentimento',
        detalhe: 'CSAT (Customer Satisfaction Score): pesquisa disparada automaticamente após resolução do ticket (escala 1-5 ou emoji). Benchmark: >4.0/5. NPS (Net Promoter Score): pesquisa mensal/trimestral a toda a base — "De 0 a 10, quanto você recomendaria?" + pergunta aberta. Cálculo: %Promotores(9-10) - %Detratores(0-6). Benchmark: >50 é excelente. CES (Customer Effort Score): "Quão fácil foi resolver seu problema?" — foco em reduzir esforço do cliente. O agente envia pesquisas automaticamente, consolida resultados, faz análise de sentimento dos comentários abertos usando NLP (classificação em temas: atendimento, produto, preço, prazo), identifica tendências e gera relatório com insights acionáveis. Fechamento do loop: detrator identificado → alerta ao gerente de CS para contato proativo. Segmentação: NPS por plano, tempo de cliente, segmento, canal de aquisição.',
      },
    ],
  },
  {
    icon: Monitor,
    name: 'TI & Tecnologia',
    rows: [
      {
        processo: 'Infraestrutura',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Infraestrutura',
        observacao: 'Monitoramento + alertas; sem provisionamento',
        detalhe: 'Monitoramento: servidores (CPU, RAM, disco, rede), aplicações (uptime, latência, error rate), bancos de dados (queries lentas, conexões ativas, replicação), certificados SSL (validade). Integrações com ferramentas de observabilidade: Datadog, Grafana+Prometheus, New Relic, AWS CloudWatch via APIs respectivas. Alertas por threshold: CPU >80% por 5min → warning, >95% por 2min → critical → auto-scale ou notificação. Backup: verificação diária de execução (último backup, tamanho, integridade), teste de restore periódico. O agente monitora e alerta, mas não faz provisionamento automático (criar/destruir servidores, scaling). Para provisionamento: precisaria integrar com APIs de cloud (AWS EC2/ECS, GCP Compute, Azure VM) ou IaC (Terraform, Pulumi). Inventário de ativos: servidores, licenças de software, certificados, domínios — com rastreamento de validade e renovação.',
      },
      {
        processo: 'Segurança de TI',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Segurança',
        observacao: 'Análise de logs + simulação phishing; sem WAF/IDS',
        detalhe: 'Camadas: perímetro (firewall, WAF, DDoS protection), rede (segmentação, VPN, IDS/IPS), endpoint (antivírus, EDR), aplicação (OWASP Top 10, pentest), dados (criptografia at-rest e in-transit, DLP), identidade (MFA, SSO, RBAC, least privilege). O agente analisa logs de segurança (SIEM-like), classifica eventos por severidade e identifica padrões suspeitos (brute force, SQL injection attempts, unusual data exfiltration). Simulações de phishing: gera emails falsos realistas, envia para colaboradores, rastreia quem clicou/informou dados, gera relatório e agenda treinamento para quem caiu. Falta: integração com WAF (Cloudflare, AWS WAF) para bloqueio automático de IPs, IDS/IPS para detecção de intrusão em rede, vulnerability scanning automatizado (Nessus, Qualys). Compliance de segurança: ISO 27001, SOC 2 — checklists de controles que o sistema poderia rastrear.',
      },
      {
        processo: 'LGPD',
        status: 'planejado',
        complexidade: 'integracao',
        frequencia: 'por-demanda',
        recurso: 'Agente Compliance LGPD',
        observacao: 'Rastreamento de coleta; DSAR com SLA',
        detalhe: 'Lei Geral de Proteção de Dados (Lei 13.709/2018). O sistema precisa: manter ROPA (Record of Processing Activities — registro de todas as atividades de tratamento de dados pessoais), identificar bases legais por tratamento (consentimento, contrato, legítimo interesse, obrigação legal), rastrear novos pontos de coleta de dados (formulários, cookies, APIs de terceiros). DSAR (Data Subject Access Request): quando titular solicita acesso, correção, exclusão ou portabilidade dos seus dados — prazo de 15 dias (art. 18). Workflow DSAR: recebimento → identificação do titular → localização de todos os dados em todos os sistemas → geração de relatório → revisão do DPO → resposta ao titular. Consentimento: rastreamento de opt-in/opt-out por finalidade, com log auditável. Cookie consent: banner com granularidade (necessários, analytics, marketing). Relatório de Impacto à Proteção de Dados (RIPD) para tratamentos de alto risco. Notificação à ANPD em caso de incidente de segurança.',
      },
      {
        processo: 'Dev Lifecycle',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agentes Dev + Workflow',
        observacao: 'Sprints simuladas + code review + QA',
        detalhe: 'Ciclo completo simulado: Product Backlog (priorização por valor × esforço) → Sprint Planning (seleção de stories, estimativa em story points, capacity planning) → Sprint (2 semanas, daily standup com status de cada task) → Code Review (atribuição automática por code ownership, checklist de qualidade) → QA (testes automatizados — unit, integration, e2e; coverage report) → Sprint Review (demo do incremento) → Retrospectiva (o que foi bem, o que melhorar, ações). Os agentes dev simulam o trabalho de desenvolvimento: geram código, fazem reviews cruzados, executam testes. Ferramentas de referência: Jira/Linear para backlog (APIs para integração), GitHub/GitLab para code review (PR workflow com checks obrigatórios), testing frameworks (Jest, Playwright, Cypress). Métricas: velocity (story points/sprint), cycle time, lead time, deployment frequency, MTTR.',
      },
      {
        processo: 'DevOps / CI-CD',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente DevOps',
        observacao: 'Monitoramento de pipelines; sem infra provisioning',
        detalhe: 'Pipeline CI/CD: commit → build → lint/format → unit tests → integration tests → security scan (SAST/DAST — Snyk, SonarQube) → build artifact (Docker image) → deploy to staging → e2e tests → manual approval → deploy to production → smoke tests → monitoring. O agente monitora pipelines (GitHub Actions, GitLab CI, Jenkins, CircleCI via APIs), notifica sobre falhas de build com contexto (qual step falhou, log relevante, commit que quebrou), sugere fix para erros comuns. Checklist pré-deploy: migrations rodaram, feature flags configuradas, rollback plan definido, on-call assignado. Métricas DORA: deployment frequency (elite: múltiplas vezes/dia), lead time for changes (elite: <1 hora), change failure rate (elite: <15%), MTTR (elite: <1 hora). Falta: provisionamento de infra automatizado (Terraform plan/apply), auto-scaling, canary deployments.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    name: 'Compliance & Governança',
    rows: [
      {
        processo: 'Regulatório',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Compliance',
        observacao: 'Monitoramento de diários oficiais + renovações',
        detalhe: 'O agente monitora: Diário Oficial da União (DOU), diários estaduais e municipais, publicações de agências reguladoras (ANVISA, ANATEL, ANS, BACEN, CVM, SUSEP) relevantes ao setor da empresa. Alerta quando nova norma, regulamentação, instrução normativa ou portaria impacta a operação. Para cada regulamentação: o sistema rastreia obrigações geradas (prazo de adequação, documentação necessária, processos a serem alterados). Gestão de licenças: cada licença/autorização tem órgão emissor, validade, documentos para renovação, taxas. Workflow de renovação: dispara 60 dias antes do vencimento → coleta de documentos → protocolo no órgão → acompanhamento → atualização do cadastro. Mapa regulatório: visão consolidada de todas as obrigações por órgão, prazo e status (em dia, a vencer, vencida). Setores altamente regulados (financeiro, saúde, alimentos) têm volume muito maior de obrigações.',
      },
      {
        processo: 'Auditoria interna',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'trimestral',
        recurso: 'Agente Auditoria',
        observacao: 'Papéis de trabalho automáticos; execução manual',
        detalhe: 'Ciclo: planejamento anual de auditoria (risk-based — áreas de maior risco auditadas com mais frequência) → notificação à área auditada → execução (entrevistas, análise documental, testes de controle, walkthrough) → draft do relatório → discussão com auditado → relatório final com findings classificados por risco (alto/médio/baixo) → plano de ação corretiva com responsáveis e prazos → follow-up. O agente gera automaticamente: papéis de trabalho (checklists por processo), programa de auditoria (steps a executar), matrizes de risco, draft do relatório com findings estruturados. A execução em si (entrevistas, verificação física, análise de amostras) é manual. Follow-up automatizado: sistema cobra planos de ação, escala itens vencidos para comitê de auditoria. Para empresas com auditoria externa (Big4): o sistema facilita o acesso a documentos e controles solicitados pelos auditores.',
      },
      {
        processo: 'Gestão de riscos',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Riscos + Dashboard',
        observacao: 'Matriz consolidada + heat map; inputs manuais',
        detalhe: 'Framework: ISO 31000 ou COSO ERM. Processo: identificação de riscos (brainstorming, análise de cenários, incidentes passados) → avaliação (probabilidade × impacto, escala 1-5) → tratamento (mitigar, transferir, aceitar, evitar) → monitoramento contínuo via KRIs (Key Risk Indicators). Categorias: estratégico (mercado, concorrência), operacional (processos, pessoas), financeiro (crédito, liquidez, câmbio), regulatório (mudanças de lei), cibernético (data breach, ransomware), reputacional (redes sociais, imprensa). O agente consolida a matriz de riscos coletando inputs de cada área (risk owners), calcula o nível de risco residual (após controles), gera heat map visual (probabilidade × impacto), monitora KRIs e alerta quando indicador ultrapassa threshold. Dashboard em tempo real com drill-down por categoria, área e nível de risco. Os inputs iniciais de identificação e avaliação são manuais (requerem julgamento de especialistas).',
      },
      {
        processo: 'Controles internos',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Controles',
        observacao: 'Segregação de funções + alçadas automáticas',
        detalhe: 'Framework COSO IC (Internal Control). Princípios: segregação de funções (SoD — quem aprova não pode executar, quem executa não pode conciliar), alçadas de aprovação (limites por cargo/nível para compras, pagamentos, contratações), reconciliação periódica (contas contábeis, estoque físico vs sistema), controle de acesso (RBAC — Role-Based Access Control, least privilege). O agente detecta violações de SoD automaticamente: analisa permissões de sistema e alerta quando um usuário tem funções conflitantes (ex: cadastra fornecedor E aprova pagamento). Workflow de aprovação com alçadas configuráveis: operacional até R$5k, gerente até R$50k, diretor até R$200k, CEO acima. Relatório mensal de controles: exceções identificadas, violações de alçada, operações fora do padrão, justificativas pendentes. Para SOX compliance (empresas listadas em bolsa): documentação de controles-chave, teste de efetividade, certificação gerencial.',
      },
      {
        processo: 'Anticorrupção',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'por-demanda',
        recurso: 'Agente Compliance + Workflow',
        observacao: 'Canal de denúncias + due diligence de fornecedores',
        detalhe: 'Base legal: Lei Anticorrupção (12.846/2013), Lei de Lavagem de Dinheiro (9.613/1998), FCPA (se opera nos EUA), UK Bribery Act (se opera no UK). Programa de integridade: código de conduta (assinatura obrigatória por todos os colaboradores), treinamento anual (presencial ou EAD com avaliação), canal de denúncias (anônimo, gerido por terceiro independente para garantir confidencialidade), due diligence de terceiros. Canal de denúncias: recebimento → classificação (assédio, fraude, corrupção, conflito de interesse) → apuração (entrevistas, análise documental) → parecer → medidas disciplinares. Due diligence de fornecedores/parceiros: consulta a listas restritivas (CEIS, CNEP, CEPIM, Transparência Internacional, OFAC), verificação de PEP (Pessoa Exposta Politicamente), análise de mídia adversa. O agente processa denúncias e executa DD automaticamente; apuração requer investigação humana.',
      },
    ],
  },
  {
    icon: Landmark,
    name: 'Tesouraria & Financeiro',
    rows: [
      {
        processo: 'Gestão de caixa',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Financeiro',
        observacao: 'Saldos via integração; projeção 30 dias',
        detalhe: 'Cash management: consolidação de saldos de todas as contas bancárias (conta corrente, aplicações, CDB, fundos) em tempo real. Integrações: Open Finance (APIs padronizadas pelo BACEN para leitura de saldo e extrato), OFX/CSV manual (fallback), APIs proprietárias de bancos (Itaú Empresas API, Bradesco Corporate, BB Developers). Cash pooling: para empresas com múltiplas contas/filiais, consolida saldos e otimiza aplicação do excedente. Projeção de caixa: modelo de 30/60/90 dias baseado em contas a receber (probabilidade de recebimento por aging), contas a pagar confirmadas, folha e encargos provisionados, receita recorrente (contratos), sazonalidade histórica. Reserva mínima de segurança configurável (ex: 3 meses de despesa fixa). Alertas: saldo abaixo da reserva, necessidade de resgate de aplicação, oportunidade de aplicação de excedente.',
      },
      {
        processo: 'Pix / Boleto',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'diario',
        recurso: 'Agente Cobrança',
        observacao: 'Emissão automática; conciliação bancária parcial',
        detalhe: 'Pix: API Pix do BACEN (regulamentação via PSPs — Prestadores de Serviços de Pagamento). Funcionalidades: Pix cobrança (QR Code estático e dinâmico com valor e vencimento), Pix Copia e Cola, webhook para notificação de recebimento em tempo real, conciliação automática por txid (identificador único). Boleto: registro obrigatório na CIP (Nova Plataforma de Cobrança) — cada banco tem API de registro (Banco do Brasil, Itaú, Bradesco, Santander, Sicoob, Sicredi, Inter — APIs todas diferentes). Campos: cedente, sacado, valor, vencimento, juros/multa, desconto por antecipação, instruções. Conciliação: matching do retorno bancário (arquivo CNAB 240/400 ou webhook) com o título emitido. O agente emite Pix/boleto automaticamente ao criar fatura, mas a conciliação depende de integração bancária que hoje é parcial. Para cobrir todos os bancos: usar intermediário como Asaas, Pagar.me, ou Pluggy para API unificada.',
      },
      {
        processo: 'Crédito',
        status: 'parcial',
        complexidade: 'integracao',
        frequencia: 'mensal',
        recurso: 'Agente Financeiro',
        observacao: 'Monitoramento de vencimentos; sem API bancária',
        detalhe: 'Gestão de empréstimos e financiamentos: tracking de cada operação (banco, modalidade, valor principal, taxa de juros — pré/pós/CDI+spread, prazo, parcelas pagas/restantes, saldo devedor, garantias). Modalidades comuns: capital de giro, conta garantida (cheque especial empresarial), antecipação de recebíveis (duplicatas, cartão), BNDES (via agente financeiro — taxas subsidiadas), leasing. CET (Custo Efetivo Total) para comparação entre operações. O agente monitora vencimentos de parcelas, calcula CET, sugere renegociação quando taxa de mercado cai (refinanciamento), alerta sobre covenants (indicadores financeiros que o banco exige manter — ex: dívida/EBITDA <3x). Para operação completa: integração com APIs bancárias para simulação de novas operações e contratação digital. Open Finance do BACEN está expandindo para incluir operações de crédito, o que facilitará a integração futura.',
      },
      {
        processo: 'Investimentos',
        status: 'parcial',
        complexidade: 'tarefa',
        frequencia: 'mensal',
        recurso: 'Agente Financeiro',
        observacao: 'Sugestão de aplicação; sem execução automática',
        detalhe: 'Gestão de caixa excedente: o agente calcula o valor disponível (saldo atual - reserva de segurança - compromissos de curto prazo) e sugere aplicação ideal baseado em: prazo de liquidez necessário (D+0 para CDB liquidez diária ou fundo DI, D+30+ para CDB com carência ou LCI/LCA — isentas de IR para PJ em alguns casos), rentabilidade (% do CDI), risco (FGC cobre até R$250k por CPF/CNPJ por instituição). Tipos: CDB, LCI/LCA, fundos DI, compromissadas, Tesouro Selic (via Tesouro Direto). Revisão mensal: comparativo de rentabilidade da carteira vs benchmark (CDI), rebalanceamento entre liquidez e rentabilidade. Para execução automática: integração com API de corretora/banco para aplicação e resgate programado. IR sobre rendimentos: tabela regressiva (22,5% até 180 dias → 15% acima de 720 dias) para maioria dos produtos.',
      },
      {
        processo: 'Cobrança',
        status: 'automatizavel',
        complexidade: 'workflow',
        frequencia: 'diario',
        recurso: 'Agente Cobrança + Workflow',
        observacao: 'Régua automática + escalação jurídica D+60',
        detalhe: 'Régua de cobrança automatizada: D+1 (lembrete amigável por email — "Identificamos que o pagamento não foi processado"), D+3 (segundo email + WhatsApp com nova via de pagamento), D+7 (ligação automática ou contato humano, oferecer parcelamento), D+15 (notificação formal com prazo — template jurídico), D+30 (negativação nos bureaus de crédito — Serasa Experian API, SPC/Boa Vista API), D+60 (encaminhamento para cobrança jurídica — protesto de título ou ação de cobrança). Cada etapa é configurável por tipo de cliente (enterprise tem tratamento VIP, régua mais suave). Acordo de parcelamento: o agente pode oferecer opções predefinidas (2x, 3x, 6x com juros de X% am). Dashboard de inadimplência: aging report (a vencer, 1-15, 16-30, 31-60, 61-90, >90), taxa de recuperação por faixa, provisão para devedores duvidosos (PDD). Métricas: DSO (Days Sales Outstanding, benchmark <30 dias), taxa de inadimplência (<3%), eficácia da cobrança por canal.',
      },
    ],
  },
  {
    icon: Target,
    name: 'Planejamento Estratégico',
    rows: [
      {
        processo: 'OKRs',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'semanal',
        recurso: 'Agente Planejamento',
        observacao: 'Criação de ciclos + check-in semanal; sem cascateamento',
        detalhe: 'OKR (Objectives and Key Results): ciclo trimestral. Objective = qualitativo, inspiracional ("Ser referência em atendimento ao cliente"). Key Results = quantitativos, mensuráveis (KR1: NPS >70, KR2: tempo médio de resposta <2h, KR3: FCR >75%). Hierarquia: OKRs da empresa → OKRs de departamento (alinhados) → OKRs individuais (contribuem para os do time). Scoring: 0.0 a 1.0 (0.7 é o sweet spot — se atingir 1.0 sempre, objetivos são pouco ambiciosos). O agente cria ciclos, distribui para departamentos, coleta check-ins semanais (progresso de cada KR com evidências), gera relatório consolidado com scoring e status por cores (verde >0.7, amarelo 0.4-0.7, vermelho <0.4). Falta: cascateamento automático (OKR da empresa gera sugestão de OKRs departamentais), alinhamento visual (árvore de OKRs mostrando como cada KR contribui para o nível acima), integração com dados reais do sistema para atualizar KRs automaticamente.',
      },
      {
        processo: 'BSC',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'mensal',
        recurso: 'Agente Planejamento + Dashboard',
        observacao: 'KPIs mapeados + semáforo; atualização manual',
        detalhe: 'Balanced Scorecard com 4 perspectivas: Financeira (receita, lucro, ROE, margem EBITDA), Clientes (NPS, market share, retenção, CAC), Processos Internos (eficiência operacional, lead time, taxa de defeito, inovação), Aprendizado e Crescimento (satisfação do colaborador, turnover, horas de treinamento, competências desenvolvidas). Cada perspectiva tem: objetivo estratégico, indicador (KPI), meta, iniciativa (projeto para atingir a meta). Mapa estratégico: diagrama de causa-efeito mostrando como os objetivos se conectam (investir em treinamento → melhorar processos → satisfazer clientes → aumentar receita). O agente mapeia KPIs de cada perspectiva e gera dashboard com semáforo (verde = meta atingida, amarelo = tolerância, vermelho = abaixo). A atualização dos KPIs é parcialmente manual (dados de RH como satisfação e treinamento não estão integrados automaticamente). Revisão mensal com análise de tendência e plano de ação para indicadores em vermelho.',
      },
      {
        processo: 'SWOT',
        status: 'parcial',
        complexidade: 'tarefa',
        frequencia: 'anual',
        recurso: 'Agente Planejamento',
        observacao: 'Coleta de dados + matriz automática; análise anual',
        detalhe: 'Matriz SWOT: Strengths (forças internas — competências, recursos, vantagens competitivas), Weaknesses (fraquezas internas — gaps, limitações, dependências), Opportunities (oportunidades externas — tendências de mercado, regulamentação favorável, tecnologia), Threats (ameaças externas — concorrência, mudança regulatória, crise econômica). O agente coleta dados internos automaticamente: KPIs financeiros e operacionais (para S e W) e dados externos (tendências de mercado, movimentos de concorrentes, legislação — para O e T). Gera a matriz e sugere estratégias cruzadas: SO (usar forças para aproveitar oportunidades), WO (superar fraquezas via oportunidades), ST (usar forças para mitigar ameaças), WT (plano de contingência). Análise PESTEL complementar: fatores Políticos, Econômicos, Sociais, Tecnológicos, Ecológicos e Legais. Output: relatório executivo com plano de ação sugerido por quadrante, usado como input para o planejamento anual.',
      },
      {
        processo: 'Planejamento anual',
        status: 'parcial',
        complexidade: 'workflow',
        frequencia: 'anual',
        recurso: 'Agente Planejamento + Workflow',
        observacao: 'Draft automático + fluxo de aprovação',
        detalhe: 'Ciclo setembro-novembro para o ano seguinte. Etapas: análise de cenário (SWOT + PESTEL) → definição de visão e metas do ano (receita, lucro, crescimento, novos mercados) → desdobramento em iniciativas por departamento → orçamento por iniciativa → consolidação pelo controller → aprovação pela diretoria → comunicação para a empresa → kickoff em janeiro. O agente consolida dados de todos os departamentos (histórico de performance, projeções, pedidos de budget), gera draft do plano estratégico com: sumário executivo, análise de cenário, metas macro, iniciativas priorizadas (matriz esforço × impacto), cronograma, orçamento consolidado, riscos e mitigações. Workflow de aprovação: cada diretor revisa e comenta sua seção → CEO aprova versão final. Dashboard de execução durante o ano: acompanhamento de realizado vs planejado por iniciativa, com indicadores de on-track / at-risk / off-track. Revisão de meio de ano (mid-year review) para ajustes.',
      },
      {
        processo: 'Reuniões de diretoria',
        status: 'automatizavel',
        complexidade: 'tarefa',
        frequencia: 'semanal',
        recurso: 'Agente Planejamento',
        observacao: 'Pauta automática + distribuição de deliberações',
        detalhe: 'Reunião semanal ou quinzenal da diretoria. O agente gera pauta automática baseada em: KPIs que precisam de atenção (indicadores em amarelo/vermelho), iniciativas estratégicas com desvio, tópicos pendentes de reuniões anteriores, aprovações necessárias (investimentos acima de alçada, contratações, mudanças de política). Estrutura da pauta: review de KPIs (5min por área — flash report), tópicos estratégicos (deep dive em 1-2 temas), decisões necessárias (votar/aprovar), informes. Pós-reunião: o agente distribui deliberações como tarefas para os responsáveis (com prazo e owner), atualiza status de itens de reuniões anteriores, gera ata executiva (decisões + action items, não transcrição completa). Dashboard de deliberações: mostra todas as decisões tomadas, quem é responsável, prazo e status de execução. Histórico pesquisável de todas as reuniões e deliberações.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Derived stats                                                      */
/* ------------------------------------------------------------------ */

const allRows = coverageData.flatMap((d) => d.rows);
const countByStatus = (s: CoverageStatus) => allRows.filter((r) => r.status === s).length;
const countByComplexity = (c: Complexity) => allRows.filter((r) => r.complexidade === c).length;
const countByFrequency = (f: Frequency) => allRows.filter((r) => r.frequencia === f).length;

const statusStats = [
  { label: 'Automatizável', count: countByStatus('automatizavel'), color: 'border-status-success text-status-success' },
  { label: 'Parcial', count: countByStatus('parcial'), color: 'border-status-warning text-status-warning' },
  { label: 'Planejado', count: countByStatus('planejado'), color: 'border-text-muted text-text-muted' },
] as const;

const complexityStats = [
  { label: 'Tarefa', count: countByComplexity('tarefa'), color: 'border-status-success text-status-success' },
  { label: 'Workflow', count: countByComplexity('workflow'), color: 'border-accent-cyan text-accent-cyan' },
  { label: 'Integração', count: countByComplexity('integracao'), color: 'border-status-warning text-status-warning' },
] as const;

const frequencyStats = [
  { label: 'Diário', count: countByFrequency('diario') },
  { label: 'Semanal', count: countByFrequency('semanal') },
  { label: 'Mensal', count: countByFrequency('mensal') },
  { label: 'Trimestral', count: countByFrequency('trimestral') },
  { label: 'Anual', count: countByFrequency('anual') },
  { label: 'Por Demanda', count: countByFrequency('por-demanda') },
] as const;

/* ------------------------------------------------------------------ */
/*  Exported content                                                   */
/* ------------------------------------------------------------------ */

export const coberturaContent = (
  <section>
    <SectionHeading id="cobertura" icon={CheckSquare} title="Cobertura do AI Office Sim" />

    <p className="mb-6 text-sm leading-relaxed text-text-secondary">
      Esta matriz compara cada processo descrito no Blueprint com as capacidades reais do AI Office Sim.
      Para cada um dos {allRows.length} processos mapeados nos 12 departamentos, indicamos o status de
      automação, a complexidade de implementação, a frequência de uso e uma descrição detalhada das
      particularidades — dados essenciais para priorizar o que construir e como integrar ao software.
    </p>

    {/* Status cards */}
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Status de Automação</p>
    <div className="mb-4 grid gap-4 sm:grid-cols-3">
      {statusStats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-4 text-center">
          <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.count}</p>
          <p className={`mt-1 border-t pt-2 text-xs font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Complexity cards */}
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Complexidade</p>
    <div className="mb-4 grid gap-4 sm:grid-cols-3">
      {complexityStats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-4 text-center">
          <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.count}</p>
          <p className={`mt-1 border-t pt-2 text-xs font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Frequency cards */}
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Frequência de Uso</p>
    <div className="mb-6 grid gap-4 grid-cols-3 sm:grid-cols-6">
      {frequencyStats.map((s) => (
        <div key={s.label} className="border border-border-default bg-bg-base p-3 text-center">
          <p className="text-2xl font-bold text-text-primary">{s.count}</p>
          <p className="mt-1 border-t pt-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {s.label}
          </p>
        </div>
      ))}
    </div>

    {/* Legend */}
    <div className="mb-8 space-y-3 text-xs">
      <div className="flex flex-wrap gap-4">
        <span className="text-text-muted font-bold">Status:</span>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`border px-2 py-0.5 font-bold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-text-muted">
              {key === 'automatizavel' && '— Executa o processo'}
              {key === 'parcial' && '— Parte manual'}
              {key === 'planejado' && '— Futuro'}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <span className="text-text-muted font-bold">Complexidade:</span>
        {Object.entries(complexityConfig).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`border px-2 py-0.5 font-bold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-text-muted">
              {key === 'tarefa' && '— Ação única do agente'}
              {key === 'workflow' && '— Múltiplas etapas'}
              {key === 'integracao' && '— API/sistema externo'}
            </span>
          </span>
        ))}
      </div>
    </div>

    {/* Department tables */}
    {coverageData.map((dept) => (
      <div key={dept.name} className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-text-primary">
          <dept.icon className="h-4 w-4 text-accent-cyan" />
          {dept.name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-4">Processo</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Complexidade</th>
                <th className="py-2 pr-4">Frequência</th>
                <th className="py-2 pr-4">Recurso</th>
                <th className="py-2">Observação</th>
              </tr>
            </thead>
            <tbody>
              {dept.rows.map((row) => {
                const sc = statusConfig[row.status];
                const cc = complexityConfig[row.complexidade];
                const fc = frequencyConfig[row.frequencia];
                return (
                  <tr key={row.processo} className="border-b border-border-default/50 align-top">
                    <td className="py-2 pr-4 text-text-primary">{row.processo}</td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${cc.color}`}>
                        {cc.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${fc.color}`}>
                        {fc.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">{row.recurso}</td>
                    <td className="py-2 text-text-muted">{row.observacao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail cards below each department table */}
        <div className="mt-4 space-y-3">
          {dept.rows.map((row) => (
            <div key={`detail-${row.processo}`} className="border-l-2 border-border-default bg-bg-base p-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-accent-cyan">
                {row.processo}
              </p>
              <p className="text-xs leading-relaxed text-text-secondary">
                {row.detalhe}
              </p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </section>
);
