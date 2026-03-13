/**
 * Pix Payment Provider — Mercado Pago Integration
 *
 * Uses the Mercado Pago Payments API to create Pix charges, check status, and refund.
 * Docs: https://www.mercadopago.com.br/developers/en/reference/payments/_payments/post
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
    'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
}

export interface PixCharge {
  txId: string;
  qrCode: string;
  qrCodeBase64: string;
  copiaECola: string;
  amount: number;         // in cents (BRL)
  expiresAt: Date;
  status: 'pending' | 'paid' | 'expired' | 'refunded';
}

export interface CreatePixChargeInput {
  orgId: string;
  amount: number;         // in cents (BRL)
  description: string;
  expirationMinutes?: number;  // default 30
}

export interface PixWebhookPayload {
  txId: string;
  status: 'paid' | 'expired';
  paidAt?: string;
  endToEndId?: string;
}

/** Map Mercado Pago payment status to our status */
function mapMpStatus(mpStatus: string): PixCharge['status'] {
  switch (mpStatus) {
    case 'approved': return 'paid';
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'rejected':
    case 'cancelled':
      return 'expired';
    default:
      return 'pending';
  }
}

/**
 * Create a Pix charge via Mercado Pago Payments API
 */
export async function createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
  const expirationMinutes = input.expirationMinutes ?? 30;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  const body = {
    transaction_amount: input.amount / 100, // MP expects float in BRL (not cents)
    description: input.description,
    payment_method_id: 'pix',
    payer: {
      email: `org-${input.orgId.slice(0, 8)}@ai-office.dev`,
    },
    date_of_expiration: expiresAt.toISOString(),
    metadata: {
      org_id: input.orgId,
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
    console.error('[pix] Mercado Pago create payment failed:', res.status, err);
    throw new Error(`Mercado Pago Pix payment failed: ${res.status}`);
  }

  const data = await res.json() as {
    id: number;
    status: string;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
      };
    };
  };

  const txData = data.point_of_interaction?.transaction_data;

  return {
    txId: String(data.id),
    qrCode: txData?.qr_code ?? '',
    qrCodeBase64: txData?.qr_code_base64 ?? '',
    copiaECola: txData?.qr_code ?? '',
    amount: input.amount,
    expiresAt,
    status: mapMpStatus(data.status),
  };
}

/**
 * Check the status of a Pix charge via Mercado Pago
 */
export async function getPixChargeStatus(txId: string): Promise<PixCharge['status']> {
  const res = await fetch(`${MP_BASE_URL}/v1/payments/${txId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error('[pix] Mercado Pago get payment failed:', res.status);
    return 'pending';
  }

  const data = await res.json() as { status: string };
  return mapMpStatus(data.status);
}

/**
 * Process a Pix refund via Mercado Pago
 */
export async function refundPixCharge(txId: string, _endToEndId: string): Promise<boolean> {
  const res = await fetch(`${MP_BASE_URL}/v1/payments/${txId}/refunds`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[pix] Mercado Pago refund failed:', res.status, err);
    return false;
  }

  return true;
}
