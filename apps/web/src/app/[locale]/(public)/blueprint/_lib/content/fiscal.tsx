import { Receipt, FileText, Calculator, Database, ClipboardList, Server, FileBarChart, CreditCard } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const fiscalContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  1. Regimes Tributários                                            */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="regimes" icon={Receipt} title="Regimes Tributários" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O regime tributário define como a empresa apura e recolhe seus impostos. A escolha correta
      impacta diretamente a carga fiscal, as obrigações acessórias e a competitividade do negócio.
      No Brasil existem três regimes principais: Simples Nacional, Lucro Presumido e Lucro Real.
      A opção é feita anualmente (geralmente em janeiro) e vale para todo o exercício fiscal.
    </p>
    <QuickStart steps={[
      'Levante o faturamento bruto dos últimos 12 meses e a projeção para o próximo exercício',
      'Identifique a atividade principal (CNAE) e verifique se há vedações ao Simples Nacional',
      'Simule a carga tributária nos três regimes usando planilha comparativa ou software contábil',
      'Analise as obrigações acessórias de cada regime e o custo operacional de conformidade',
      'Formalize a opção no portal da Receita Federal até o último dia útil de janeiro',
    ]} />
    <FeatureList items={[
      'Contador — simulação de carga e recomendação de regime',
      'Diretor Financeiro — decisão estratégica e validação',
      'Analista Fiscal — operacionalização da opção e acompanhamento',
    ]} />
    <ProcessCard
      periodicity="anual"
      tools={['Planilha comparativa', 'Software contábil', 'Portal e-CAC']}
      legal="Lei Complementar 123/2006, Lei 9.718/1998, Lei 9.430/1996"
    />
    <SimMapping items={[
      'Agente Contador analisa faturamento e CNAE para recomendar regime ideal automaticamente',
      'Dashboard Fiscal compara carga tributária nos três regimes com base em dados reais da empresa',
      'Alerta automático antes do prazo de opção anual (janeiro)',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  2. Simples Nacional                                               */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="simples-nacional" icon={Calculator} title="Simples Nacional" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Regime simplificado para micro e pequenas empresas com faturamento bruto anual de até
      R$ 4,8 milhões. Unifica até 8 tributos (IRPJ, CSLL, PIS, COFINS, IPI, ICMS, ISS e CPP)
      em uma guia única — o DAS (Documento de Arrecadação do Simples Nacional). A apuração
      mensal é feita pelo PGDAS-D e as alíquotas variam conforme o anexo e a faixa de receita bruta.
    </p>
    <QuickStart steps={[
      'Verifique se a empresa atende aos requisitos de faturamento (até R$ 4,8M/ano) e CNAE permitido',
      'Faça a opção pelo Simples no Portal do Simples Nacional até o último dia útil de janeiro',
      'Apure mensalmente a receita bruta no PGDAS-D (Portal do Simples Nacional)',
      'Gere o DAS e efetue o pagamento até o dia 20 do mês seguinte ao fato gerador',
      'Acompanhe o faturamento acumulado para não ultrapassar o sublimite estadual ou o teto federal',
      'Entregue a DEFIS (Declaração de Informações Socioeconômicas e Fiscais) anualmente até março',
    ]} />
    <FeatureList items={[
      'Contador — apuração mensal no PGDAS-D e entrega da DEFIS',
      'Analista Fiscal — emissão de notas e controle de faturamento',
      'Empresário/Sócio — acompanhamento do faturamento acumulado',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['Portal Simples Nacional', 'PGDAS-D', 'e-CAC']}
      legal="Lei Complementar 123/2006, Resolução CGSN 140/2018"
    />
    <SimMapping items={[
      'Agente Fiscal calcula automaticamente o DAS mensal com base nas notas emitidas',
      'Alerta de aproximação do teto de faturamento (R$ 4,8M) com projeção de desenquadramento',
      'Workflow automatizado para geração e envio do DAS ao financeiro para pagamento',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  3. Lucro Presumido                                                */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="lucro-presumido" icon={FileBarChart} title="Lucro Presumido" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      No Lucro Presumido, a Receita Federal presume uma margem de lucro sobre o faturamento bruto
      para calcular IRPJ e CSLL, independente do lucro real obtido. As alíquotas de presunção variam
      conforme a atividade: 8% para comércio e indústria, 32% para serviços em geral. IRPJ é 15%
      (+ 10% sobre excedente de R$ 60 mil/trimestre) e CSLL é 9%. PIS (0,65%) e COFINS (3%) são
      apurados cumulativamente. Indicado para empresas com margem de lucro real superior à presumida.
    </p>
    <QuickStart steps={[
      'Confirme que o faturamento anual não ultrapassa R$ 78 milhões e a atividade permite o regime',
      'Calcule a base presumida aplicando o percentual de presunção sobre a receita bruta trimestral',
      'Apure IRPJ (15% + adicional de 10%) e CSLL (9%) sobre a base presumida',
      'Apure PIS (0,65%) e COFINS (3%) cumulativos sobre o faturamento mensal',
      'Gere os DARFs e efetue pagamento dentro do prazo (último dia útil do mês seguinte ao trimestre)',
    ]} />
    <FeatureList items={[
      'Contador — apuração trimestral de IRPJ/CSLL e mensal de PIS/COFINS',
      'Analista Fiscal — escrituração de notas e cálculo de tributos',
      'Diretor Financeiro — fluxo de caixa para pagamento dos tributos',
    ]} />
    <ProcessCard
      periodicity="trimestral"
      tools={['ERP / sistema contábil', 'SPED EFD-Contribuições', 'e-CAC']}
      legal="Lei 9.718/1998, Lei 9.249/1995, IN RFB 1.700/2017"
    />
    <SimMapping items={[
      'Agente Contador calcula automaticamente a base presumida e gera relatório de IRPJ/CSLL trimestral',
      'Workflow de apuração mensal de PIS/COFINS com conferência automática de notas fiscais',
      'Geração automática de DARFs com envio ao setor financeiro para programação de pagamento',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  4. Lucro Real                                                     */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="lucro-real" icon={Database} title="Lucro Real" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      No Lucro Real, o IRPJ e a CSLL são calculados sobre o lucro contábil ajustado por adições,
      exclusões e compensações registradas no LALUR (Livro de Apuração do Lucro Real). A apuração
      pode ser trimestral (definitiva) ou anual (com recolhimento mensal por estimativa). PIS (1,65%)
      e COFINS (7,6%) são não-cumulativos, permitindo créditos sobre insumos. Obrigatório para
      empresas com faturamento acima de R$ 78 milhões ou de setores regulados (bancos, seguradoras).
    </p>
    <QuickStart steps={[
      'Mantenha a contabilidade rigorosamente em dia — toda a apuração parte do lucro contábil',
      'Registre no LALUR/LACS as adições (despesas indedutíveis) e exclusões (receitas isentas)',
      'Defina a forma de apuração: trimestral (definitiva) ou anual (estimativa mensal + ajuste)',
      'Apure PIS/COFINS não-cumulativos mensalmente, identificando e escriturando créditos de insumos',
      'Gere a ECF (Escrituração Contábil Fiscal) anualmente via SPED e entregue até julho',
      'Compense prejuízos fiscais acumulados (limitado a 30% do lucro real do período)',
    ]} />
    <FeatureList items={[
      'Contador — escrituração contábil e fiscal completa, LALUR',
      'Analista Fiscal — apuração de PIS/COFINS não-cumulativo e créditos',
      'Controller — revisão de adições/exclusões e validação do LALUR',
      'Auditor — conferência de conformidade antes da entrega da ECF',
    ]} />
    <ProcessCard
      periodicity="trimestral"
      tools={['SPED ECF', 'LALUR digital', 'ERP contábil', 'e-CAC']}
      legal="Decreto 9.580/2018 (RIR), Lei 12.973/2014, IN RFB 1.700/2017"
    />
    <SimMapping items={[
      'Agente Contador automatiza lançamentos no LALUR com classificação de adições e exclusões',
      'Workflow de apuração mensal de PIS/COFINS não-cumulativo com identificação automática de créditos',
      'Dashboard de projeção de lucro real com simulação de impacto tributário em tempo real',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  5. NF-e / NFS-e                                                   */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="notas-fiscais" icon={FileText} title="NF-e / NFS-e" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A Nota Fiscal Eletrônica (NF-e) é obrigatória para operações de venda de produtos e
      circulação de mercadorias. A Nota Fiscal de Serviços Eletrônica (NFS-e) é exigida para
      prestação de serviços e emitida junto à prefeitura. Ambas devem ser emitidas antes ou no
      momento do fato gerador, possuem validade jurídica com certificado digital e alimentam
      a escrituração fiscal. Cancelamentos e cartas de correção possuem prazos e regras específicas.
    </p>
    <QuickStart steps={[
      'Cadastre a empresa no sistema emissor (SEFAZ para NF-e, prefeitura para NFS-e) com certificado digital',
      'Preencha os dados obrigatórios: CFOP, NCM, CST/CSOSN, valor, impostos e dados do destinatário',
      'Transmita a nota ao SEFAZ/prefeitura e aguarde a autorização de uso',
      'Armazene o XML e o DANFE/DANFSE por no mínimo 5 anos (obrigação legal)',
      'Para correções, emita Carta de Correção (CC-e) em até 30 dias — NÃO altera valores ou impostos',
      'Para cancelamento, solicite em até 24h (NF-e) ou conforme prazo da prefeitura (NFS-e)',
    ]} />
    <FeatureList items={[
      'Analista Fiscal — emissão, cancelamento e carta de correção',
      'Faturista / Vendedor — preenchimento de dados da operação',
      'Contador — escrituração das notas na apuração fiscal',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['Sistema emissor NF-e', 'Portal da Prefeitura (NFS-e)', 'Certificado digital A1/A3']}
      legal="Ajuste SINIEF 07/2005, Lei Complementar 116/2003, Convênio ICMS 143/2006"
    />
    <SimMapping items={[
      'Agente de Faturamento emite NF-e/NFS-e automaticamente ao concluir uma venda ou serviço',
      'Monitoramento automático de rejeições SEFAZ com reenvio e alerta ao operador',
      'Armazenamento estruturado de XMLs com busca indexada e controle de prazos de guarda',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  6. Obrigações Acessórias                                          */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="obrigacoes-acessorias" icon={ClipboardList} title="Obrigações Acessórias" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Além do pagamento dos tributos (obrigações principais), a empresa deve cumprir diversas
      obrigações acessórias — declarações e escriturações que informam ao fisco os detalhes das
      operações. O descumprimento gera multas pesadas (de R$ 500 a R$ 1.500/mês por obrigação).
      As principais incluem: DIRF (retenções na fonte), RAIS e CAGED (dados trabalhistas),
      EFD-Contribuições (PIS/COFINS) e EFD-ICMS/IPI (tributos estaduais/federais sobre mercadorias).
    </p>
    <QuickStart steps={[
      'Monte um calendário fiscal com todas as obrigações, prazos e responsáveis',
      'DIRF — informe retenções de IR na fonte, entrega anual até fevereiro (substituída pela EFD-Reinf a partir de 2025)',
      'RAIS — relação anual de informações sociais, entrega entre março e abril',
      'CAGED — admissões e desligamentos, envio até o dia 7 do mês seguinte (migrado para eSocial)',
      'EFD-Contribuições — escrituração mensal de PIS/COFINS, entrega até o 10º dia útil do 2º mês seguinte',
      'EFD-ICMS/IPI — escrituração mensal de ICMS e IPI, entrega conforme prazo estadual',
    ]} />
    <FeatureList items={[
      'Analista Fiscal — preparação e transmissão das declarações',
      'Contador — revisão e validação antes do envio',
      'Analista de RH — fornecimento de dados para RAIS, CAGED e DIRF (parte trabalhista)',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['PVA (Programa Validador e Assinador)', 'SPED', 'eSocial', 'e-CAC']}
      legal="IN RFB 1.990/2020 (DIRF), Decreto 76.900/1975 (RAIS), Lei 4.923/1965 (CAGED), IN RFB 1.252/2012"
    />
    <SimMapping items={[
      'Calendário fiscal inteligente com alertas automáticos por obrigação e prazo',
      'Agente Fiscal gera arquivos SPED a partir dos dados já lançados no sistema',
      'Painel de conformidade mostra status de cada obrigação (entregue, pendente, atrasada)',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  7. SPED                                                           */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="sped" icon={Server} title="SPED — Sistema Público de Escrituração Digital" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O SPED é o ecossistema digital da Receita Federal que substituiu a escrituração em papel.
      Engloba diversos módulos: ECD (Escrituração Contábil Digital — livros contábeis), ECF
      (Escrituração Contábil Fiscal — apuração de IRPJ/CSLL), EFD-Contribuições (PIS/COFINS/CPRB)
      e EFD-Reinf (retenções e informações fiscais previdenciárias). Cada módulo tem periodicidade
      e prazo de entrega próprios, e a transmissão exige certificado digital.
    </p>
    <QuickStart steps={[
      'ECD — gere a escrituração contábil digital e entregue até o último dia útil de maio (anual)',
      'ECF — gere a escrituração contábil fiscal e entregue até o último dia útil de julho (anual)',
      'EFD-Contribuições — apure PIS/COFINS mensalmente e entregue até o 10º dia útil do 2º mês seguinte',
      'EFD-Reinf — informe retenções (IRRF, CSLL, PIS/COFINS, INSS) mensalmente até o dia 15 do mês seguinte',
      'Valide os arquivos no PVA antes da transmissão para evitar rejeições',
      'Armazene os recibos de entrega e arquivos transmitidos por no mínimo 5 anos',
    ]} />
    <FeatureList items={[
      'Contador — geração de ECD e ECF anuais',
      'Analista Fiscal — geração mensal de EFD-Contribuições e EFD-Reinf',
      'TI / Responsável pelo ERP — extração de dados e integração com o PVA',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['SPED (PVA)', 'Certificado digital', 'ERP contábil', 'e-CAC']}
      legal="Decreto 6.022/2007, IN RFB 2.003/2021 (ECD), IN RFB 2.004/2021 (ECF), IN RFB 1.252/2012"
    />
    <SimMapping items={[
      'Agente Contábil gera arquivos SPED (ECD, ECF, EFD) automaticamente a partir dos lançamentos do sistema',
      'Validação automática pré-transmissão com detecção de inconsistências e sugestões de correção',
      'Timeline de entregas SPED integrada ao calendário fiscal com rastreamento de recibos',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  8. DCTF / DARF                                                    */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="dctf-darf" icon={CreditCard} title="DCTF / DARF" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A DCTF (Declaração de Débitos e Créditos Tributários Federais) é a declaração mensal que
      informa à Receita Federal todos os tributos devidos pela empresa (IRPJ, CSLL, PIS, COFINS,
      IPI, IRRF, IOF, CIDE). O DARF (Documento de Arrecadação de Receitas Federais) é a guia
      de pagamento desses tributos. A DCTF deve ser entregue até o 15º dia útil do 2º mês
      seguinte ao fato gerador. DARFs não pagos geram acréscimos de multa (0,33%/dia até 20%)
      e juros (SELIC acumulada).
    </p>
    <QuickStart steps={[
      'Apure todos os tributos federais devidos no mês (IRPJ, CSLL, PIS, COFINS, IPI, IRRF etc.)',
      'Gere os DARFs correspondentes via e-CAC ou sistema contábil com os códigos de receita corretos',
      'Efetue o pagamento dos DARFs dentro do prazo para evitar multa e juros SELIC',
      'Preencha a DCTF mensal informando os débitos apurados e os créditos/pagamentos realizados',
      'Transmita a DCTF via PGD DCTF com certificado digital até o 15º dia útil do 2º mês seguinte',
      'Concilie os débitos declarados na DCTF com os DARFs pagos para evitar pendências no e-CAC',
    ]} />
    <FeatureList items={[
      'Analista Fiscal — apuração de tributos e geração de DARFs',
      'Contador — preenchimento e transmissão da DCTF',
      'Financeiro — programação de pagamento dos DARFs',
      'Controller — conciliação DCTF x DARFs x e-CAC',
    ]} />
    <ProcessCard
      periodicity="mensal"
      tools={['PGD DCTF', 'e-CAC', 'SICALC (cálculo de DARF em atraso)', 'Certificado digital']}
      legal="IN RFB 2.005/2021, Lei 10.426/2002, Lei 9.430/1996"
    />
    <SimMapping items={[
      'Agente Fiscal gera DARFs automaticamente após apuração de tributos e envia ao financeiro',
      'Workflow de conciliação DCTF x DARFs com alerta de divergências antes da transmissão',
      'Monitoramento do e-CAC para detecção precoce de pendências fiscais',
    ]} />
  </section>
);
