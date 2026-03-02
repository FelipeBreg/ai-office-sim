import { visaoGeralContent } from './content/visao-geral';
import { legalContent } from './content/legal';
import { fiscalContent } from './content/fiscal';
import { contabilidadeContent } from './content/contabilidade';
import { rhContent } from './content/rh';
import { comercialContent } from './content/comercial';
import { marketingContent } from './content/marketing';
import { operacoesContent } from './content/operacoes';
import { atendimentoContent } from './content/atendimento';
import { tiContent } from './content/ti';
import { complianceContent } from './content/compliance';
import { tesourariaContent } from './content/tesouraria';
import { planejamentoContent } from './content/planejamento';
import { coberturaContent } from './content/cobertura';

export const blueprintContent: Record<string, React.ReactNode> = {
  'visao-geral': visaoGeralContent,
  legal: legalContent,
  fiscal: fiscalContent,
  contabilidade: contabilidadeContent,
  rh: rhContent,
  comercial: comercialContent,
  marketing: marketingContent,
  operacoes: operacoesContent,
  atendimento: atendimentoContent,
  ti: tiContent,
  compliance: complianceContent,
  tesouraria: tesourariaContent,
  planejamento: planejamentoContent,
  cobertura: coberturaContent,
};
