/**
 * Pix Payment Provider Abstraction
 *
 * In production, this would integrate with EFI Bank (Gerencianet) or similar
 * provider that supports recurring Pix charges. For now, this is a type-safe
 * stub that defines the interface for future implementation.
 *
 * Required env vars (for production):
 *   PIX_CLIENT_ID, PIX_CLIENT_SECRET, PIX_CERTIFICATE_PATH, PIX_SANDBOX
 */

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

/**
 * Create a Pix charge (QR code + copia-e-cola)
 * TODO: Implement with EFI Bank API
 */
export async function createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
  const expirationMinutes = input.expirationMinutes ?? 30;

  // Stub — return mock data for development
  return {
    txId: `pix_${Date.now()}_${input.orgId.slice(0, 8)}`,
    qrCode: 'STUB_QR_CODE_DATA',
    qrCodeBase64: '',
    copiaECola: `00020126580014br.gov.bcb.pix0136stub-${input.orgId.slice(0, 8)}`,
    amount: input.amount,
    expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    status: 'pending',
  };
}

/**
 * Check the status of a Pix charge
 * TODO: Implement with EFI Bank API
 */
export async function getPixChargeStatus(txId: string): Promise<PixCharge['status']> {
  return 'pending';
}

/**
 * Process a Pix refund
 * TODO: Implement with EFI Bank API
 */
export async function refundPixCharge(txId: string, endToEndId: string): Promise<boolean> {
  return false;
}
