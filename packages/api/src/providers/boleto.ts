/**
 * Boleto Payment Provider — Mercado Pago Integration
 *
 * Uses the Mercado Pago Payments API to generate boletos for annual plan purchases.
 * Docs: https://www.mercadopago.com.br/developers/en/reference/payments/_payments/post
 *
 * Boleto is available for annual plans only (not monthly).
 *
 * Required env vars:
 *   MERCADOPAGO_ACCESS_TOKEN  — production or sandbox access token
 *   MERCADOPAGO_SANDBOX       — "true" to use sandbox mode (optional)
 */

const MP_BASE_URL = 'https://api.mercadopago.com';

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');
  return token;
}

function mpHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': `boleto-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
}

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

/** Map Mercado Pago payment status to our boleto status */
function mapMpStatus(mpStatus: string): Boleto['status'] {
  switch (mpStatus) {
    case 'approved': return 'paid';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending';
    case 'rejected':
    case 'cancelled':
      return 'canceled';
    default:
      return 'pending';
  }
}

/**
 * Generate a boleto for an annual plan purchase via Mercado Pago
 */
export async function createBoleto(input: CreateBoletoInput): Promise<Boleto> {
  const dueDays = input.dueDays ?? 7;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const body = {
    transaction_amount: input.amount / 100, // MP expects float in BRL (not cents)
    description: input.planDescription,
    payment_method_id: 'bolbradesco', // Bradesco boleto — most common
    payer: {
      email: `org-${input.orgId.slice(0, 8)}@ai-office.dev`,
      first_name: input.orgName,
      identification: {
        type: 'CNPJ',
        number: '00000000000000', // placeholder — real CNPJ from org profile when available
      },
    },
    date_of_expiration: dueDate.toISOString(),
    metadata: {
      org_id: input.orgId,
      plan_description: input.planDescription,
      source: 'ai-office-sim',
    },
  };

  const res = await fetch(`${MP_BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[boleto] Mercado Pago create payment failed:', res.status, err);
    throw new Error(`Mercado Pago boleto payment failed: ${res.status}`);
  }

  const data = await res.json() as {
    id: number;
    status: string;
    barcode?: { content?: string };
    transaction_details?: {
      external_resource_url?: string;
      digitable_line?: string;
    };
  };

  return {
    id: String(data.id),
    barcode: data.barcode?.content ?? '',
    digitableLine: data.transaction_details?.digitable_line ?? '',
    pdfUrl: data.transaction_details?.external_resource_url ?? '',
    amount: input.amount,
    dueDate,
    status: mapMpStatus(data.status),
    orgName: input.orgName,
    planDescription: input.planDescription,
  };
}

/**
 * Check the status of a boleto via Mercado Pago
 */
export async function getBoletoStatus(boletoId: string): Promise<Boleto['status']> {
  const res = await fetch(`${MP_BASE_URL}/v1/payments/${boletoId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error('[boleto] Mercado Pago get payment failed:', res.status);
    return 'pending';
  }

  const data = await res.json() as { status: string };
  return mapMpStatus(data.status);
}

/**
 * Cancel a pending boleto via Mercado Pago
 */
export async function cancelBoleto(boletoId: string): Promise<boolean> {
  const res = await fetch(`${MP_BASE_URL}/v1/payments/${boletoId}`, {
    method: 'PUT',
    headers: mpHeaders(),
    body: JSON.stringify({ status: 'cancelled' }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[boleto] Mercado Pago cancel failed:', res.status, err);
    return false;
  }

  return true;
}
