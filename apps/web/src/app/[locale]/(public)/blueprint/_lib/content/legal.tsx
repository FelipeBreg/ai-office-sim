import { Scale, FileText, Building2, Stamp, Award, FileSignature, ScrollText } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const legalContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  1. Registro do CNPJ                                               */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="cnpj" icon={Scale} title="Registro do CNPJ" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O Cadastro Nacional da Pessoa Jurídica (CNPJ) é o primeiro passo para formalizar
      qualquer empresa no Brasil. O processo é centralizado pela Receita Federal e integrado
      à Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e
      Negócios (REDESIM), que unifica etapas de registro em diferentes órgãos.
    </p>
    <QuickStart steps={[
      'Defina o tipo societário (MEI, LTDA, SLU, S.A.) e o objeto social da empresa.',
      'Acesse o portal gov.br/REDESIM e realize a consulta prévia de viabilidade (nome e endereço).',
      'Preencha o DBE (Documento Básico de Entrada) no Coletor Nacional da Receita Federal.',
      'Envie a documentação (contrato social ou requerimento de empresário) à Junta Comercial do estado.',
      'Após deferimento na Junta, o CNPJ é gerado automaticamente pela Receita Federal.',
      'Obtenha a Inscrição Estadual (SEFAZ) e/ou Municipal (prefeitura), conforme a atividade.',
    ]} />
    <FeatureList items={[
      'Contador — responsável pela elaboração e envio do DBE',
      'Advogado societário — revisão do contrato social e conformidade legal',
      'Sócio-administrador — assinatura e responsável legal perante a Receita Federal',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['Portal gov.br/REDESIM', 'Coletor Nacional CNPJ', 'Junta Comercial do estado']}
      legal="Lei 11.598/2007 (REDESIM) — IN RFB 2.119/2022"
    />
    <SimMapping items={[
      'Agente de Compliance gera checklist de documentos necessários automaticamente.',
      'Workflow de abertura de empresa acompanha cada etapa e envia alertas de prazo.',
      'Dashboard jurídico exibe status do registro em tempo real para todos os sócios.',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  2. Tipos de Empresa                                               */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="tipos-empresa" icon={Building2} title="Tipos de Empresa" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A escolha do tipo societário impacta diretamente a tributação, a responsabilidade dos
      sócios e a capacidade de captação de recursos. Abaixo os principais tipos previstos na
      legislação brasileira e quando cada um é mais indicado.
    </p>
    <QuickStart steps={[
      'MEI (Microempreendedor Individual) — faturamento até R$ 81 mil/ano, 1 funcionário, atividades permitidas. Ideal para profissionais autônomos e pequenos negócios.',
      'ME (Microempresa) — faturamento até R$ 360 mil/ano, pode optar pelo Simples Nacional. Indicada para negócios em crescimento inicial.',
      'EPP (Empresa de Pequeno Porte) — faturamento de R$ 360 mil a R$ 4,8 milhões/ano, Simples Nacional ou Lucro Presumido. Para empresas em fase de expansão.',
      'LTDA (Sociedade Limitada) — dois ou mais sócios com responsabilidade limitada ao capital social. Tipo mais comum no Brasil para PMEs.',
      'SLU (Sociedade Limitada Unipessoal) — sócio único com responsabilidade limitada, substituiu a antiga EIRELI. Ideal para empreendedor solo que deseja proteção patrimonial.',
      'S.A. (Sociedade Anônima) — capital dividido em ações, pode ser aberta (bolsa) ou fechada. Para empresas que buscam investidores ou IPO.',
    ]} />
    <FeatureList items={[
      'Contador — simulação tributária para cada tipo societário',
      'Advogado societário — análise de responsabilidade e estruturação do capital',
      'Sócios/investidores — definição de participação e governança',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['Portal gov.br/REDESIM', 'Simples Nacional', 'Simulador tributário do contador']}
      legal="Código Civil (Lei 10.406/2002) — LC 123/2006 (Simples Nacional) — Lei 6.404/1976 (S.A.)"
    />
    <SimMapping items={[
      'Agente Financeiro simula automaticamente a carga tributária para cada tipo societário.',
      'Workflow de decisão guia o empreendedor na escolha do tipo ideal com base no faturamento projetado.',
      'Relatórios comparativos gerados por IA apresentam prós e contras de cada formato jurídico.',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  3. Contrato Social                                                */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="contrato-social" icon={FileText} title="Contrato Social" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O contrato social é o documento constitutivo da empresa, equivalente à sua
      &quot;certidão de nascimento&quot;. Define os sócios, o capital social, o objeto da
      empresa, as regras de administração e a distribuição de lucros. Deve ser registrado na
      Junta Comercial para ter validade perante terceiros.
    </p>
    <QuickStart steps={[
      'Defina a razão social, o nome fantasia e o objeto social (CNAEs) da empresa.',
      'Estabeleça o capital social total e a participação (quotas) de cada sócio.',
      'Determine as regras de administração: quem administra, poderes, pro-labore e retiradas.',
      'Inclua cláusulas sobre entrada/saída de sócios, dissolução, não-competição e foro.',
      'Contrate um advogado e/ou contador para revisar e formatar conforme as normas da Junta.',
      'Assine (físico ou digital via e-CPF) e protocole na Junta Comercial do estado.',
    ]} />
    <FeatureList items={[
      'Advogado societário — redação e revisão das cláusulas',
      'Contador — enquadramento tributário e definição de CNAEs',
      'Sócios — aprovação e assinatura do documento',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['Modelo padrão da Junta Comercial', 'Certificado digital e-CPF/e-CNPJ', 'Assessoria contábil/jurídica']}
      legal="Código Civil (Lei 10.406/2002, arts. 997-1.038) — IN DREI 81/2020"
    />
    <SimMapping items={[
      'Agente Jurídico gera minutas de contrato social com cláusulas padrão personalizáveis.',
      'Sistema de versionamento rastreia todas as alterações contratuais e mantém histórico completo.',
      'Alertas automáticos notificam quando uma alteração contratual precisa ser registrada.',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  4. Junta Comercial                                                */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="junta-comercial" icon={Stamp} title="Junta Comercial" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A Junta Comercial é o órgão estadual responsável pelo registro público de empresas
      mercantis. Todo ato constitutivo, alteração contratual ou extinção de empresa deve ser
      arquivado na Junta do estado onde a sede está localizada. O processo vem sendo
      digitalizado progressivamente via integração com a REDESIM.
    </p>
    <QuickStart steps={[
      'Acesse o site da Junta Comercial do estado (ex.: JUCERJA no RJ, JUCESP em SP).',
      'Realize a consulta prévia de nome empresarial para verificar disponibilidade.',
      'Preencha o formulário eletrônico de registro e anexe o contrato social ou ata.',
      'Recolha as taxas (DARF + taxa estadual) e anexe os comprovantes.',
      'Envie o protocolo e acompanhe o status online até o deferimento.',
    ]} />
    <FeatureList items={[
      'Contador — preparo da documentação e protocolo junto à Junta',
      'Advogado — revisão de atos para garantir conformidade com IN DREI',
      'Administrador/sócio — assinatura dos atos e acompanhamento',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['JUCERJA', 'JUCESP', 'Portal REDESIM', 'Certificado digital']}
      legal="Lei 8.934/1994 (Registro Público de Empresas) — Decreto 1.800/1996 — IN DREI 81/2020"
    />
    <SimMapping items={[
      'Workflow de registro acompanha automaticamente o status do protocolo na Junta.',
      'Agente de Compliance verifica se todos os documentos estão em conformidade antes do envio.',
      'Dashboard centralizado exibe prazos e pendências de todos os registros empresariais.',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  5. Alvarás e Licenças                                             */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="alvaras" icon={Award} title="Alvarás e Licenças" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Após o registro na Junta Comercial e a obtenção do CNPJ, a empresa precisa de
      licenças específicas para operar. Os alvarás variam conforme o município, a atividade
      econômica e o grau de risco. As principais licenças incluem o alvará de funcionamento
      municipal, o Auto de Vistoria do Corpo de Bombeiros (AVCB), a licença sanitária
      (Vigilância Sanitária) e a licença ambiental, quando aplicável.
    </p>
    <QuickStart steps={[
      'Consulte na prefeitura quais licenças são exigidas para os CNAEs da empresa.',
      'Solicite o Alvará de Funcionamento municipal (presencial ou via portal da prefeitura).',
      'Obtenha o AVCB (Auto de Vistoria do Corpo de Bombeiros) — contrate laudo técnico de engenheiro.',
      'Se a atividade envolve alimentos, saúde ou estética, solicite licença da Vigilância Sanitária (ANVISA/VISA municipal).',
      'Para atividades com impacto ambiental, obtenha a Licença Ambiental (IBAMA ou órgão estadual).',
      'Renove cada licença dentro do prazo de validade para evitar multas e interdição.',
    ]} />
    <FeatureList items={[
      'Contador — solicitação do alvará municipal e acompanhamento',
      'Engenheiro/arquiteto — laudo técnico para Corpo de Bombeiros',
      'Responsável técnico — laudos sanitários e ambientais',
      'Administrador — gerenciamento de renovações e prazos',
    ]} />
    <ProcessCard
      periodicity="anual"
      tools={['Portal da prefeitura', 'Corpo de Bombeiros (CBMERJ/CBPMESP)', 'VISA municipal', 'IBAMA/órgão ambiental estadual']}
      legal="LC 123/2006 (simplificação para ME/EPP) — Lei 6.437/1977 (infrações sanitárias) — Lei 12.651/2012 (Código Florestal)"
    />
    <SimMapping items={[
      'Calendário de renovações alerta automaticamente 60 dias antes do vencimento de cada alvará.',
      'Agente de Compliance gera checklist de documentos por tipo de licença e CNAE.',
      'Painel de conformidade exibe o status de todas as licenças em um único dashboard.',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  6. Marcas e Patentes                                              */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="marcas-patentes" icon={FileSignature} title="Marcas e Patentes" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O registro de marca no INPI (Instituto Nacional da Propriedade Industrial) garante
      exclusividade de uso em todo o território nacional por 10 anos, renováveis. Patentes
      protegem invenções (20 anos) e modelos de utilidade (15 anos). O processo é
      administrativo, mas pode levar de 6 meses a 2+ anos dependendo da complexidade e de
      eventuais oposições.
    </p>
    <QuickStart steps={[
      'Realize busca prévia de anterioridade no banco de marcas do INPI para verificar disponibilidade.',
      'Classifique a marca conforme a Classificação de Nice (classe do produto/serviço).',
      'Cadastre-se no sistema e-Marcas do INPI e preencha o pedido de registro.',
      'Recolha a GRU (taxa do INPI) — valores reduzidos para MEI, ME e EPP.',
      'Acompanhe a publicação na RPI (Revista da Propriedade Industrial) e responda eventuais oposições.',
      'Após deferimento, pague a taxa de concessão para obter o certificado de registro.',
    ]} />
    <FeatureList items={[
      'Advogado de propriedade intelectual — busca de anterioridade e acompanhamento processual',
      'Agente de propriedade industrial — representação perante o INPI',
      'Sócio/administrador — definição estratégica de quais marcas registrar',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['INPI (inpi.gov.br)', 'e-Marcas', 'Banco de marcas (busca prévia)', 'RPI (Revista da Propriedade Industrial)']}
      legal="Lei 9.279/1996 (Lei da Propriedade Industrial) — IN INPI 95/2018"
    />
    <SimMapping items={[
      'Agente Jurídico monitora automaticamente publicações na RPI relacionadas às marcas da empresa.',
      'Workflow de registro de marca acompanha cada fase do processo no INPI com alertas de prazos.',
      'Sistema de alertas notifica sobre marcas similares registradas por terceiros no mesmo segmento.',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  7. Contratos Empresariais                                         */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="contratos" icon={ScrollText} title="Contratos Empresariais" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Contratos empresariais formalizam relações comerciais e protegem as partes envolvidas.
      Os principais tipos incluem contratos de prestação de serviço, fornecimento, NDA
      (acordo de confidencialidade) e SLA (acordo de nível de serviço). Uma boa gestão
      contratual reduz riscos jurídicos e garante previsibilidade nas operações.
    </p>
    <QuickStart steps={[
      'Identifique o tipo de contrato necessário (prestação de serviço, fornecimento, NDA, SLA).',
      'Defina as cláusulas essenciais: objeto, prazo, valor, condições de pagamento e penalidades.',
      'Inclua cláusulas de proteção: confidencialidade, propriedade intelectual, rescisão e foro.',
      'Submeta a minuta para revisão do advogado da empresa e negocie ajustes com a contraparte.',
      'Assine o contrato (preferencialmente com assinatura digital via plataforma certificada ICP-Brasil).',
      'Armazene o contrato assinado em repositório seguro e registre prazos de renovação e vencimento.',
    ]} />
    <FeatureList items={[
      'Advogado corporativo — redação, revisão e negociação de cláusulas',
      'Gestor de contratos — acompanhamento de prazos, renovações e compliance',
      'Departamento comercial — definição de condições comerciais e SLAs',
      'Financeiro — validação de condições de pagamento e impacto orçamentário',
    ]} />
    <ProcessCard
      periodicity="por-demanda"
      tools={['Plataforma de assinatura digital (DocuSign, Clicksign)', 'Sistema de gestão de contratos', 'Certificado ICP-Brasil']}
      legal="Código Civil (Lei 10.406/2002, arts. 421-480) — MP 2.200-2/2001 (ICP-Brasil) — Lei 13.709/2018 (LGPD)"
    />
    <SimMapping items={[
      'Agente Jurídico gera minutas de contratos a partir de templates configuráveis por tipo.',
      'Workflow de aprovação encaminha contratos para revisão jurídica e assinatura em cadeia.',
      'Dashboard de contratos exibe vencimentos, renovações pendentes e valores consolidados.',
    ]} />
  </section>
);
