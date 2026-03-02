import { Megaphone, Palette, Globe, Share2, PenTool, DollarSign, Search, Mail, Filter } from 'lucide-react';
import { SectionHeading, FeatureList, QuickStart } from '../../../_components/reference-components';
import { ProcessCard } from '../../_components/process-card';
import { SimMapping } from '../../_components/sim-mapping';

export const marketingContent = (
  <section>
    {/* ------------------------------------------------------------------ */}
    {/*  Branding                                                           */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="branding" icon={Palette} title="Branding" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Branding é a construção e gestão da identidade da marca. Vai além do logotipo: engloba
      identidade visual completa, brand guidelines, tom de voz, posicionamento e percepção de
      mercado. Uma marca forte e consistente gera reconhecimento, confiança e diferenciação
      competitiva. O brand book deve ser o documento de referência para toda comunicação da empresa.
    </p>
    <QuickStart steps={[
      'Defina missão, visão, valores e proposta de valor da marca',
      'Desenvolva a identidade visual: logo, paleta de cores, tipografia e elementos gráficos',
      'Crie o brand book com guidelines de uso da marca (do/don\'t, exemplos aplicados)',
      'Estabeleça o tom de voz e persona da marca para toda comunicação',
      'Distribua o brand book para todas as equipes e parceiros externos',
      'Faça auditoria anual de consistência de marca em todos os canais',
    ]} />
    <FeatureList items={[
      'Diretor de Marketing — define posicionamento e estratégia de marca',
      'Designer / Diretor de Arte — cria identidade visual e brand book',
      'Redator — define tom de voz e guidelines de comunicação',
      'Gerente de Marketing — garante consistência em todos os canais',
    ]} />
    <ProcessCard periodicity="anual" tools={['Figma / Adobe Creative Suite', 'Brand book (Notion / PDF)', 'Frontify / Brandfolder']} />
    <SimMapping items={[
      'Agente de branding valida automaticamente se peças de comunicação seguem as guidelines da marca',
      'Workflow de auditoria verifica consistência visual e textual em todos os canais periodicamente',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Marketing Digital                                                  */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="digital" icon={Globe} title="Marketing Digital" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Marketing digital é a estratégia integrada de presença e aquisição nos canais online.
      Inclui definição de canais prioritários (orgânico, pago, social, email), alocação de
      budget, definição de KPIs e análise de performance. O planejamento mensal garante
      alinhamento entre objetivos de negócio e ações táticas em cada canal.
    </p>
    <QuickStart steps={[
      'Mapeie a jornada do cliente e identifique os canais digitais mais relevantes',
      'Defina o budget mensal de marketing e distribua entre canais (orgânico, pago, social)',
      'Estabeleça KPIs por canal: CAC, CPL, ROAS, taxa de conversão e LTV',
      'Crie um calendário integrado com campanhas, lançamentos e datas sazonais',
      'Configure dashboards de performance com dados unificados de todos os canais',
    ]} />
    <FeatureList items={[
      'Gerente de Marketing Digital — define estratégia e alocação de budget',
      'Analista de Performance — monitora KPIs e otimiza campanhas',
      'Especialista em Growth — testa hipóteses e escala canais de aquisição',
      'Diretor de Marketing — aprova planejamento e budget mensal',
    ]} />
    <ProcessCard periodicity="mensal" tools={['Google Analytics 4', 'Google Data Studio / Looker', 'Planilha de budget', 'Trello / Asana (calendário)']} />
    <SimMapping items={[
      'Agente de analytics consolida dados de todos os canais em relatório unificado automaticamente',
      'Workflow de planejamento sugere alocação de budget com base em performance histórica',
      'Alertas automáticos notificam sobre anomalias de performance em qualquer canal',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Redes Sociais                                                      */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="redes-sociais" icon={Share2} title="Redes Sociais" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      A gestão de redes sociais envolve planejamento editorial, criação de conteúdo, publicação,
      engajamento com a audiência e análise de métricas. O calendário editorial garante
      consistência e frequência, enquanto o monitoramento ativo de comentários e mensagens
      constrói relacionamento com a comunidade. Cada rede tem suas particularidades de formato,
      linguagem e algoritmo.
    </p>
    <QuickStart steps={[
      'Defina as redes sociais prioritárias com base no ICP e comportamento da audiência',
      'Crie o calendário editorial mensal com temas, formatos e datas de publicação',
      'Produza conteúdo em lote (batching) para manter consistência e ganhar eficiência',
      'Agende publicações usando ferramentas de agendamento (Buffer, mLabs, Hootsuite)',
      'Monitore comentários, DMs e menções diariamente — responda em até 2 horas',
      'Analise métricas semanalmente: alcance, engajamento, cliques e crescimento de seguidores',
    ]} />
    <FeatureList items={[
      'Social Media Manager — planeja calendário e gerencia publicações',
      'Designer — cria peças visuais para cada formato e plataforma',
      'Redator — produz copies e legendas alinhadas ao tom de voz',
      'Community Manager — interage com a audiência e gerencia crises',
    ]} />
    <ProcessCard periodicity="diario" tools={['Buffer / mLabs / Hootsuite', 'Canva / Figma', 'Instagram / LinkedIn / TikTok / X', 'Notion (calendário editorial)']} />
    <SimMapping items={[
      'Agente de social media sugere pautas e gera rascunhos de posts com base no calendário editorial',
      'Workflow de publicação agenda e publica conteúdo automaticamente nos horários de maior engajamento',
      'Monitoramento automático de menções e comentários com classificação de sentimento',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Marketing de Conteúdo                                              */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="conteudo" icon={PenTool} title="Marketing de Conteúdo" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Marketing de conteúdo é a estratégia de criar e distribuir conteúdo relevante para atrair,
      engajar e converter o público-alvo. Inclui blog posts, vídeos, ebooks, webinars, podcasts
      e infográficos. O conteúdo deve ser planejado com base em pesquisa de palavras-chave,
      dores do ICP e etapas do funil de conversão. A consistência na produção é o fator mais
      importante para resultados a longo prazo.
    </p>
    <QuickStart steps={[
      'Faça pesquisa de palavras-chave e mapeie temas relevantes para o ICP',
      'Crie um calendário de conteúdo semanal com formatos variados (blog, vídeo, ebook)',
      'Produza conteúdo otimizado para SEO com CTAs claros para cada etapa do funil',
      'Distribua conteúdo nos canais relevantes: blog, redes sociais, newsletter e parceiros',
      'Analise performance de cada peça: tráfego, tempo na página, conversões e compartilhamentos',
    ]} />
    <FeatureList items={[
      'Content Manager — planeja pauta e calendário de conteúdo',
      'Redator / Copywriter — produz textos otimizados para blog, email e landing pages',
      'Designer — cria materiais visuais, infográficos e ebooks',
      'Videomaker — produz e edita conteúdo em vídeo',
    ]} />
    <ProcessCard periodicity="semanal" tools={['WordPress / Ghost / Notion', 'Google Docs', 'Canva / Figma', 'YouTube / Vimeo', 'Ferramentas de SEO (Ahrefs, SEMrush)']} />
    <SimMapping items={[
      'Agente de conteúdo gera rascunhos de blog posts otimizados para SEO com base em palavras-chave definidas',
      'Workflow de distribuição publica e compartilha conteúdo automaticamente em todos os canais configurados',
      'Relatórios automáticos de performance por peça de conteúdo com sugestões de otimização',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Anúncios Pagos                                                     */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="ads" icon={DollarSign} title="Anúncios Pagos" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Anúncios pagos (paid media) são campanhas de mídia paga em plataformas como Google Ads
      e Meta Ads (Facebook/Instagram). O objetivo é gerar tráfego qualificado, leads e vendas
      com investimento controlado. A otimização contínua de criativos, segmentação e lances é
      essencial para maximizar o ROAS (Return on Ad Spend) e reduzir o CAC (Custo de Aquisição
      de Cliente).
    </p>
    <QuickStart steps={[
      'Defina objetivos de campanha: awareness, tráfego, leads ou conversão',
      'Configure contas e pixels de rastreamento (Google Tag Manager, Meta Pixel, API de Conversões)',
      'Crie estrutura de campanhas organizada: campanha → grupo de anúncio → anúncio',
      'Desenvolva criativos variados para testes A/B (imagem, vídeo, carousel, copy)',
      'Monitore métricas diariamente: CPC, CPL, CTR, ROAS e taxa de conversão',
      'Otimize lances, segmentação e criativos com base nos dados de performance',
    ]} />
    <FeatureList items={[
      'Analista de Mídia Paga — cria, monitora e otimiza campanhas diariamente',
      'Designer — produz criativos para anúncios em diversos formatos',
      'Copywriter — escreve copies de anúncio com foco em conversão',
      'Gerente de Marketing — define budget e aprova estratégia de mídia',
    ]} />
    <ProcessCard periodicity="diario" tools={['Google Ads', 'Meta Business Suite (Facebook/Instagram Ads)', 'Google Tag Manager', 'Google Analytics 4', 'Planilha de controle de budget']} />
    <SimMapping items={[
      'Agente de ads monitora performance em tempo real e sugere otimizações de lance e segmentação',
      'Workflow de criativos rotaciona anúncios automaticamente com base em performance e fadiga',
      'Relatórios automáticos de ROAS e CAC por campanha com comparativo de períodos',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  SEO                                                                */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="seo" icon={Search} title="SEO" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      SEO (Search Engine Optimization) é o conjunto de técnicas para melhorar o posicionamento
      orgânico do site nos mecanismos de busca. Divide-se em três pilares: SEO on-page
      (conteúdo, meta tags, heading structure), SEO off-page (backlinks, menções, autoridade
      de domínio) e SEO técnico (velocidade, mobile-first, sitemap, structured data). Resultados
      são de médio/longo prazo, mas geram tráfego qualificado com custo marginal zero.
    </p>
    <QuickStart steps={[
      'Faça auditoria técnica do site: velocidade, mobile, sitemap.xml, robots.txt e erros de rastreamento',
      'Pesquise palavras-chave prioritárias com volume de busca e intenção de compra',
      'Otimize páginas existentes: title tags, meta descriptions, headings e conteúdo',
      'Crie estratégia de link building: guest posts, parcerias e conteúdo linkável',
      'Monitore posições no ranking e tráfego orgânico mensalmente via Search Console e Ahrefs',
    ]} />
    <FeatureList items={[
      'Analista de SEO — executa auditorias, pesquisa keywords e otimiza páginas',
      'Redator SEO — produz conteúdo otimizado para palavras-chave estratégicas',
      'Desenvolvedor Front-end — implementa melhorias técnicas (Core Web Vitals, structured data)',
      'Gerente de Marketing — prioriza esforços de SEO no planejamento geral',
    ]} />
    <ProcessCard periodicity="mensal" tools={['Google Search Console', 'Ahrefs / SEMrush', 'Google PageSpeed Insights', 'Screaming Frog', 'Google Analytics 4']} />
    <SimMapping items={[
      'Agente de SEO realiza auditoria técnica automatizada e gera relatório de correções prioritárias',
      'Workflow de monitoramento rastreia posições de keywords e alerta sobre quedas significativas',
      'Sugestões automáticas de otimização on-page para cada novo conteúdo publicado',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Email Marketing                                                    */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="email-marketing" icon={Mail} title="Email Marketing" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      Email marketing é um dos canais de maior ROI do marketing digital. Inclui gestão de listas
      de contatos, segmentação por comportamento e perfil, automações (drip campaigns, welcome
      series, abandoned cart) e newsletters periódicas. A chave é enviar a mensagem certa, para
      a pessoa certa, no momento certo — mantendo altas taxas de entregabilidade e engajamento.
    </p>
    <QuickStart steps={[
      'Escolha uma plataforma de email marketing (Mailchimp, ActiveCampaign, RD Station)',
      'Configure domínio de envio com SPF, DKIM e DMARC para garantir entregabilidade',
      'Segmente a base de contatos por perfil, comportamento e estágio no funil',
      'Crie automações para jornadas-chave: boas-vindas, nutrição, reengajamento e pós-compra',
      'Produza newsletters semanais com conteúdo relevante e CTAs claros',
      'Monitore métricas: taxa de abertura, cliques, conversão e descadastros',
    ]} />
    <FeatureList items={[
      'Analista de Email Marketing — cria campanhas, segmenta listas e analisa métricas',
      'Copywriter — escreve assuntos e corpos de email com foco em conversão',
      'Designer — cria templates de email responsivos e visualmente alinhados à marca',
      'Gerente de Marketing — aprova estratégia e calendário de envios',
    ]} />
    <ProcessCard periodicity="semanal" tools={['Mailchimp / ActiveCampaign / RD Station', 'Canva (templates de email)', 'Google Analytics 4 (UTMs)', 'Ferramentas de validação de email (NeverBounce, ZeroBounce)']} />
    <SimMapping items={[
      'Agente de email marketing gera copies e subject lines otimizadas com base em dados de performance',
      'Workflow de automação dispara sequências personalizadas baseadas em comportamento do lead',
      'Relatórios automáticos de entregabilidade e engajamento com sugestões de melhoria',
    ]} />

    {/* ------------------------------------------------------------------ */}
    {/*  Funil de Conversão                                                 */}
    {/* ------------------------------------------------------------------ */}
    <SectionHeading id="funil" icon={Filter} title="Funil de Conversão" />
    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
      O funil de conversão mapeia a jornada do visitante até se tornar cliente, dividido em
      topo (awareness), meio (consideração) e fundo (decisão). Cada etapa requer conteúdos,
      CTAs e métricas específicas. A otimização contínua das taxas de conversão entre etapas
      (CRO — Conversion Rate Optimization) é fundamental para maximizar o retorno de todos os
      esforços de marketing e vendas.
    </p>
    <QuickStart steps={[
      'Mapeie as etapas do funil: visitante → lead → MQL → SQL → oportunidade → cliente',
      'Defina conteúdos e ofertas para cada etapa (ebook no topo, demo no fundo)',
      'Crie landing pages otimizadas com formulários e CTAs para captura de leads',
      'Configure rastreamento de conversões em cada etapa (eventos no GA4, goals no CRM)',
      'Analise taxas de conversão entre etapas mensalmente e identifique gargalos',
      'Execute testes A/B em landing pages, CTAs e formulários para melhorar taxas',
    ]} />
    <FeatureList items={[
      'Growth / CRO Specialist — analisa funil, identifica gargalos e executa testes',
      'Analista de Marketing — monitora taxas de conversão e volume por etapa',
      'Designer — cria landing pages e CTAs otimizados para conversão',
      'Gerente de Marketing — alinha funil de marketing com pipeline de vendas',
    ]} />
    <ProcessCard periodicity="mensal" tools={['Google Analytics 4', 'Hotjar / Microsoft Clarity', 'Unbounce / Instapage (landing pages)', 'Google Optimize / VWO (testes A/B)', 'CRM (integração funil marketing → vendas)']} />
    <SimMapping items={[
      'Agente de CRO analisa taxas de conversão e sugere hipóteses de otimização com base em dados',
      'Workflow de funil rastreia leads automaticamente entre etapas e notifica equipes responsáveis',
      'Relatórios automáticos de funil completo com visualização de gargalos e oportunidades',
    ]} />
  </section>
);
