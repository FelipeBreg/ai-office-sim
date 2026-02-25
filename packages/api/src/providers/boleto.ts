/**
 * Boleto Payment Provider Abstraction
 *
 * In production, this would integrate with Stripe Brazil or a dedicated boleto
 * provider for annual plan purchases. For now, this is a type-safe stub.
 *
 * Boleto is available for annual plans only (not monthly).
 *
 * Required env vars (for production):
 *   BOLETO_API_KEY, BOLETO_SANDBOX
 */

export interface Boleto {
  id: string;
  barcode: string;
  digitableLine: string;
  pdfUrl: string;
  amount: number;           // in cents (BRL)
  dueDate: Date;
  status: 'pending' | 'paid' | 'expired' | 'canceled';
  orgName: string;
  planDescription: string;
}

export interface CreateBoletoInput {
  orgId: string;
  orgName: string;
  amount: number;           // in cents (BRL)
  planDescription: string;
  dueDays?: number;         // default 7 business days
}

export interface BoletoWebhookPayload {
  boletoId: string;
  status: 'paid' | 'expired';
  paidAt?: string;
}

/**
 * Generate a boleto for an annual plan purchase
 * TODO: Implement with Stripe Brazil or dedicated provider
 */
export async function createBoleto(input: CreateBoletoInput): Promise<Boleto> {
  const dueDays = input.dueDays ?? 7;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  // Stub — return mock data for development
  return {
    id: `bol_${Date.now()}_${input.orgId.slice(0, 8)}`,
    barcode: '00000.00000 00000.000000 00000.000000 0 00000000000000',
    digitableLine: '00000.00000 00000.000000 00000.000000 0 00000000000000',
    pdfUrl: '',
    amount: input.amount,
    dueDate,
    status: 'pending',
    orgName: input.orgName,
    planDescription: input.planDescription,
  };
}

/**
 * Check the status of a boleto
 * TODO: Implement with provider API
 */
export async function getBoletoStatus(boletoId: string): Promise<Boleto['status']> {
  return 'pending';
}

/**
 * Cancel a pending boleto
 * TODO: Implement with provider API
 */
export async function cancelBoleto(boletoId: string): Promise<boolean> {
  return false;
}
