/**
 * Seed data for 5 default WhatsApp message templates (P1-1.5).
 */
import { db } from '../client.js';
import { whatsappTemplates } from '../schema/whatsapp.js';

export const WHATSAPP_TEMPLATE_SEEDS = [
  {
    templateName: 'welcome',
    language: 'pt-BR',
    content:
      'Olá {{nome}}! 👋 Bem-vindo(a) à {{empresa}}. Estou aqui para ajudá-lo(a). Como posso atendê-lo(a) hoje?',
  },
  {
    templateName: 'follow_up',
    language: 'pt-BR',
    content:
      'Olá {{nome}}, tudo bem? Estou entrando em contato para dar continuidade ao nosso último assunto. Posso ajudar com mais alguma coisa?',
  },
  {
    templateName: 'appointment_reminder',
    language: 'pt-BR',
    content:
      'Olá {{nome}}! Lembrando que você tem um compromisso agendado para {{data}} às {{horario}}. Confirma sua presença? Responda SIM ou NÃO.',
  },
  {
    templateName: 'payment_confirmation',
    language: 'pt-BR',
    content:
      'Olá {{nome}}! Confirmamos o recebimento do seu pagamento de R$ {{valor}} referente a {{referencia}}. Obrigado!',
  },
  {
    templateName: 'support_response',
    language: 'pt-BR',
    content:
      'Olá {{nome}}, obrigado por entrar em contato com a {{empresa}}. Seu chamado #{{protocolo}} foi registrado e nossa equipe está analisando. Retornaremos em breve.',
  },
];

/** Seed default WhatsApp templates for a project */
export async function seedWhatsAppTemplates(projectId: string) {
  for (const template of WHATSAPP_TEMPLATE_SEEDS) {
    await db
      .insert(whatsappTemplates)
      .values({ projectId, ...template })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${WHATSAPP_TEMPLATE_SEEDS.length} WhatsApp templates for project ${projectId}`);
}
