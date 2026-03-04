import { Users, UserPlus, BookOpen, Receipt, Heart, Landmark, CalendarDays, FileX, Server, HardHat } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../../_components/process-card';
import { SimMapping } from '../../../_components/sim-mapping';

export const rhContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  1. Admissão CLT                                                    */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="admissao" icon={UserPlus} title="Admissão CLT" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O processo de admissão é o ponto de entrada formal do colaborador na empresa. Envolve a coleta
      de documentos pessoais, exame admissional, registro na CTPS Digital e cadastro nos sistemas
      internos. O cumprimento dos prazos legais é essencial para evitar multas e passivos trabalhistas.
    </p>
    <ProcessCard
      periodicity="por-demanda"
      tools={['CTPS Digital', 'eSocial', 'Sistema de RH', 'Clínica de Medicina do Trabalho']}
      legal="CLT Art. 29"
    />
    <QuickStart steps={[
      'Solicitar documentos pessoais (RG, CPF, comprovante de endereço, título de eleitor, certidão de nascimento/casamento)',
      'Agendar e encaminhar o candidato para exame admissional (ASO — Atestado de Saúde Ocupacional)',
      'Registrar o colaborador na CTPS Digital em até 5 dias úteis após a admissão',
      'Enviar evento S-2200 (Cadastramento Inicial) ao eSocial',
      'Cadastrar o colaborador no sistema de folha, benefícios e ponto eletrônico',
      'Abrir conta salário no banco conveniado e coletar dados bancários',
    ]} />
    <FeatureList items={[
      'Analista de RH — coleta de documentos e cadastro nos sistemas',
      'Médico do Trabalho — emissão do ASO admissional',
      'Departamento Pessoal — registro em CTPS e eSocial',
      'Gestor da área — solicitação da vaga e aprovação',
    ]} />
    <SimMapping items={[
      'Crie um workflow "Admissão" com tarefas sequenciais para cada etapa (documentos → exame → registro)',
      'Use o agente de RH para gerar automaticamente o checklist de documentos por tipo de contratação',
      'Configure alertas automáticos para prazos legais (5 dias úteis para registro CTPS)',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  2. Onboarding                                                      */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="onboarding" icon={BookOpen} title="Onboarding" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O onboarding vai além da admissão burocrática — é o processo de integração que garante que o
      novo colaborador entenda a cultura, os processos e as ferramentas da empresa. Um onboarding
      bem estruturado reduz o turnover nos primeiros 90 dias e acelera a produtividade.
    </p>
    <ProcessCard
      periodicity="por-demanda"
      tools={['Plataforma de Treinamento (LMS)', 'Slack/Teams', 'Notion/Confluence', 'Google Workspace']}
    />
    <QuickStart steps={[
      'Preparar o kit de boas-vindas (crachá, equipamentos, acessos a sistemas, e-mail corporativo)',
      'Agendar reunião de integração com o gestor direto e a equipe',
      'Apresentar a cultura organizacional, valores, código de conduta e políticas internas',
      'Realizar treinamentos obrigatórios (segurança do trabalho, LGPD, compliance)',
      'Definir metas e expectativas para os primeiros 30/60/90 dias',
    ]} />
    <FeatureList items={[
      'RH / People Ops — coordenação do programa de onboarding',
      'Gestor direto — acompanhamento do novo colaborador',
      'TI — provisionamento de acessos e equipamentos',
      'Treinamento & Desenvolvimento — conteúdos e trilhas de aprendizado',
    ]} />
    <SimMapping items={[
      'Configure um workflow de onboarding com etapas automáticas disparadas pela conclusão da admissão',
      'Use o agente para gerar planos personalizados de 30/60/90 dias com base no cargo',
      'Acompanhe o progresso do onboarding no dashboard com indicadores de conclusão por etapa',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  3. Folha de Pagamento                                              */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="folha" icon={Receipt} title="Folha de Pagamento" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A folha de pagamento é a espinha dorsal do Departamento Pessoal. Envolve o cálculo de
      salários, horas extras, adicional noturno, descontos obrigatórios (INSS, IRRF) e facultativos
      (vale-transporte, pensão alimentícia), culminando na emissão do holerite e crédito bancário.
    </p>
    <ProcessCard
      periodicity="mensal"
      tools={['Sistema de Folha (TOTVS, ADP, Domínio)', 'Ponto Eletrônico', 'eSocial', 'Banco (crédito em conta)']}
      legal="CLT Art. 459"
    />
    <QuickStart steps={[
      'Fechar o ponto eletrônico e consolidar horas trabalhadas, extras e faltas',
      'Importar eventos variáveis (comissões, bônus, adicionais, descontos de benefícios)',
      'Calcular a folha bruta: salário base + adicionais + horas extras',
      'Aplicar descontos obrigatórios: INSS (tabela progressiva) e IRRF (tabela vigente)',
      'Gerar holerites e disponibilizar aos colaboradores',
      'Transmitir a folha ao banco para crédito em conta até o 5º dia útil',
    ]} />
    <FeatureList items={[
      'Analista de Departamento Pessoal — processamento da folha',
      'Coordenador de RH — validação e aprovação da folha',
      'Financeiro — provisão de caixa e pagamento',
      'Contabilidade — contabilização da folha e encargos',
    ]} />
    <SimMapping items={[
      'Automatize a importação de dados do ponto eletrônico para a folha com integrações',
      'Use o agente financeiro para provisionar o valor da folha antecipadamente',
      'Configure alertas para o fechamento da folha e prazo de pagamento (5º dia útil)',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  4. Benefícios                                                      */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="beneficios" icon={Heart} title="Benefícios" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão de benefícios abrange vale-transporte (VT), vale-refeição/alimentação (VR/VA),
      plano de saúde, seguro de vida e outros. Além de ser uma obrigação legal em alguns casos
      (VT é obrigatório), os benefícios são ferramenta estratégica de atração e retenção de talentos.
    </p>
    <ProcessCard
      periodicity="mensal"
      tools={['Operadora de VT', 'Operadora de VR/VA (Sodexo, Alelo, iFood)', 'Operadora de Saúde', 'Seguradora']}
    />
    <QuickStart steps={[
      'Cadastrar novos colaboradores nas operadoras de benefícios',
      'Processar inclusões, exclusões e alterações mensais (dependentes, upgrade de plano)',
      'Calcular o desconto de VT em folha (até 6% do salário base)',
      'Realizar o pedido mensal de créditos de VT e VR/VA',
      'Conferir faturas das operadoras e encaminhar ao financeiro para pagamento',
    ]} />
    <FeatureList items={[
      'Analista de Benefícios — gestão operacional e movimentações',
      'Departamento Pessoal — descontos em folha',
      'Financeiro — pagamento das faturas',
      'Colaborador — solicitação de alterações e inclusão de dependentes',
    ]} />
    <SimMapping items={[
      'Crie um workflow mensal de "Gestão de Benefícios" com tarefas recorrentes para cada operadora',
      'Use o agente para calcular automaticamente o desconto de VT e gerar relatórios de custo por colaborador',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  5. FGTS/INSS                                                       */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="fgts-inss" icon={Landmark} title="FGTS / INSS" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O recolhimento do FGTS (8% sobre a remuneração) e do INSS patronal são obrigações mensais do
      empregador. O descumprimento gera multas pesadas e pode configurar crime de apropriação
      indébita previdenciária. As guias são geradas via SEFIP/Conectividade Social e, com o eSocial,
      pelo DCTFWeb.
    </p>
    <ProcessCard
      periodicity="mensal"
      tools={['SEFIP/GFIP', 'Conectividade Social (CEF)', 'DCTFWeb', 'eSocial']}
      legal="Lei 8.036/1990"
    />
    <QuickStart steps={[
      'Apurar a base de cálculo do FGTS (remuneração + adicionais) para cada colaborador',
      'Gerar a GFIP/SEFIP com os dados da folha mensal',
      'Transmitir o arquivo via Conectividade Social até o dia 7 do mês seguinte',
      'Emitir e pagar a guia GRF (Guia de Recolhimento do FGTS)',
      'Conferir a DCTFWeb e transmitir a DARF previdenciária (INSS patronal)',
      'Arquivar comprovantes de recolhimento para eventual fiscalização',
    ]} />
    <FeatureList items={[
      'Departamento Pessoal — geração das guias e transmissão',
      'Contabilidade — conciliação dos encargos sociais',
      'Financeiro — pagamento das guias no prazo',
      'Gestor de RH — supervisão e compliance',
    ]} />
    <SimMapping items={[
      'Configure alertas automáticos para o prazo de recolhimento do FGTS (dia 7) e INSS (dia 20)',
      'Use o agente contábil para conciliar os valores de FGTS/INSS entre folha e contabilidade',
      'Gere relatórios mensais de encargos sociais por centro de custo',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  6. 13º e Férias                                                    */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="decimo-ferias" icon={CalendarDays} title="13º Salário e Férias" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O 13º salário é pago em duas parcelas (novembro e dezembro) e as férias devem ser concedidas
      dentro do período concessivo (12 meses após o período aquisitivo). O cálculo inclui médias de
      variáveis, e a provisão mensal é essencial para o fluxo de caixa. Erros nos prazos geram
      pagamento em dobro.
    </p>
    <ProcessCard
      periodicity="anual"
      tools={['Sistema de Folha', 'Planilha de Provisão', 'eSocial']}
      legal="CLT Art. 129-145"
    />
    <QuickStart steps={[
      'Calcular a provisão mensal de 13º e férias (1/12 avos por mês trabalhado + encargos)',
      'Programar férias em conjunto com os gestores respeitando o período concessivo',
      'Emitir aviso de férias com 30 dias de antecedência',
      'Pagar as férias (salário + 1/3 constitucional) até 2 dias antes do início do gozo',
      'Calcular e pagar a 1ª parcela do 13º até 30/11 e a 2ª parcela até 20/12',
    ]} />
    <FeatureList items={[
      'Departamento Pessoal — cálculos, avisos e pagamentos',
      'Gestores de área — programação de férias da equipe',
      'Financeiro — provisão mensal e liberação de recursos',
      'Contabilidade — lançamentos de provisão e baixas',
    ]} />
    <SimMapping items={[
      'Automatize o cálculo de provisão mensal de férias e 13º com o agente financeiro',
      'Configure alertas para períodos concessivos próximos do vencimento (evitar férias em dobro)',
      'Use o dashboard para visualizar o calendário de férias consolidado da empresa',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  7. Rescisão                                                        */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="rescisao" icon={FileX} title="Rescisão" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A rescisão contratual pode ocorrer por iniciativa do empregador (com ou sem justa causa),
      do empregado (pedido de demissão), por acordo mútuo ou por término de contrato. Cada
      modalidade tem regras próprias para aviso prévio, multa do FGTS, verbas rescisórias e prazos.
      O TRCT (Termo de Rescisão) deve ser quitado em até 10 dias corridos.
    </p>
    <ProcessCard
      periodicity="por-demanda"
      tools={['Sistema de Folha', 'Conectividade Social', 'eSocial', 'Homolognet']}
      legal="CLT Art. 477"
    />
    <QuickStart steps={[
      'Definir a modalidade de rescisão (sem justa causa, justa causa, pedido de demissão, acordo mútuo)',
      'Calcular as verbas rescisórias: saldo de salário, férias proporcionais + 1/3, 13º proporcional, aviso prévio',
      'Emitir a GRRF (Guia de Recolhimento Rescisório do FGTS) com multa de 40% quando aplicável',
      'Transmitir os eventos de desligamento ao eSocial (S-2299)',
      'Gerar o TRCT e efetuar o pagamento em até 10 dias corridos',
      'Dar baixa na CTPS Digital, desativar acessos e recolher equipamentos',
    ]} />
    <FeatureList items={[
      'Departamento Pessoal — cálculos rescisórios e documentação',
      'Jurídico — validação em casos de justa causa ou litígio',
      'Financeiro — liberação de recursos para pagamento',
      'Gestor da área — comunicação e entrevista de desligamento',
    ]} />
    <SimMapping items={[
      'Crie um workflow "Rescisão" que gera automaticamente o checklist de acordo com a modalidade selecionada',
      'Use o agente de RH para calcular verbas rescisórias e simular cenários (com/sem justa causa)',
      'Configure alertas para o prazo de 10 dias corridos e para a entrega de documentos ao ex-colaborador',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  8. eSocial                                                         */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="esocial" icon={Server} title="eSocial" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O eSocial é o sistema do governo federal que unifica o envio de informações trabalhistas,
      previdenciárias e fiscais. Todas as empresas com empregados CLT devem transmitir eventos
      periódicos (folha, FGTS) e não periódicos (admissão, desligamento, afastamento). O
      cumprimento dos prazos e leiautes é obrigatório sob pena de multas automáticas.
    </p>
    <ProcessCard
      periodicity="mensal"
      tools={['eSocial/gov.br', 'Certificado Digital (e-CNPJ)', 'Sistema de Folha com módulo eSocial']}
    />
    <QuickStart steps={[
      'Manter o cadastro da empresa e dos colaboradores atualizado (tabelas S-1000, S-1005, S-1010)',
      'Enviar eventos não periódicos no prazo: S-2200 (admissão), S-2230 (afastamento), S-2299 (desligamento)',
      'Fechar e transmitir os eventos periódicos mensais: S-1200 (remuneração), S-1210 (pagamento)',
      'Transmitir a DCTFWeb e gerar as guias de recolhimento (DARF, GRF)',
      'Monitorar o retorno dos eventos e corrigir inconsistências apontadas pelo sistema',
    ]} />
    <FeatureList items={[
      'Departamento Pessoal — transmissão dos eventos e correção de inconsistências',
      'Contabilidade — conciliação com a DCTFWeb',
      'TI — certificado digital e conectividade',
      'Compliance — garantia de conformidade nos prazos',
    ]} />
    <SimMapping items={[
      'Automatize o disparo de alertas para cada prazo de evento do eSocial',
      'Use o agente para validar dados antes da transmissão, reduzindo rejeições',
      'Centralize o status de envio de todos os eventos no dashboard de compliance',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  9. Segurança do Trabalho                                           */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="seguranca-trabalho" icon={HardHat} title="Segurança do Trabalho" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A segurança do trabalho abrange todas as normas regulamentadoras (NR-1 a NR-37) que visam
      prevenir acidentes e doenças ocupacionais. Inclui a elaboração do PGR (Programa de
      Gerenciamento de Riscos), o PCMSO (Programa de Controle Médico de Saúde Ocupacional), a
      gestão da CIPA e o fornecimento de EPIs. O descumprimento pode gerar interdição, multas
      e responsabilidade criminal.
    </p>
    <ProcessCard
      periodicity="anual"
      tools={['Sistema de SST', 'eSocial (eventos S-2210, S-2220, S-2240)', 'Clínica de Medicina do Trabalho']}
      legal="NR-1 a NR-37"
    />
    <QuickStart steps={[
      'Elaborar e manter atualizado o PGR (antigo PPRA) com inventário de riscos e plano de ação',
      'Implementar o PCMSO com cronograma de exames periódicos (admissional, periódico, demissional)',
      'Constituir e treinar a CIPA conforme a NR-5 (empresas com 20+ empregados)',
      'Fornecer, controlar e registrar a entrega de EPIs (ficha de EPI assinada)',
      'Investigar acidentes de trabalho e emitir a CAT (Comunicação de Acidente de Trabalho) em até 24h',
      'Enviar eventos de SST ao eSocial: S-2210 (CAT), S-2220 (monitoramento), S-2240 (condições ambientais)',
    ]} />
    <FeatureList items={[
      'Técnico/Engenheiro de Segurança do Trabalho — elaboração de PGR e laudos',
      'Médico do Trabalho — PCMSO e exames ocupacionais',
      'CIPA — inspeções, SIPAT e recomendações',
      'Departamento Pessoal — envio de eventos SST ao eSocial',
      'Gestores de área — cumprimento das normas e uso de EPIs pela equipe',
    ]} />
    <SimMapping items={[
      'Crie um workflow anual de SST com todas as obrigações e prazos das normas regulamentadoras',
      'Use o agente para rastrear vencimento de exames periódicos e validade de EPIs',
      'Configure alertas automáticos para SIPAT, reuniões da CIPA e renovação de laudos',
    ]} />
  </section>
);
