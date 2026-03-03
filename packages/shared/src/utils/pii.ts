/**
 * PII (Personally Identifiable Information) detection and masking.
 * Used to sanitize text before sending to LLM context.
 */

const PII_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // Email addresses
  { regex: /\b[\w.+-]+@[\w.-]+\.\w{2,}\b/gi, replacement: '[EMAIL]' },
  // Phone numbers (international, BR, US formats)
  { regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },
  // Credit card numbers (13-19 digits, with optional separators)
  { regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{1,7}\b/g, replacement: '[CREDIT_CARD]' },
  // CPF (Brazilian national ID: XXX.XXX.XXX-XX)
  { regex: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, replacement: '[CPF]' },
  // CNPJ (Brazilian company ID: XX.XXX.XXX/XXXX-XX)
  { regex: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, replacement: '[CNPJ]' },
  // SSN (US Social Security Number: XXX-XX-XXXX)
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  // IP addresses (v4)
  { regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP_ADDRESS]' },
];

/**
 * Mask PII in a text string. Returns the sanitized text.
 */
export function maskPII(text: string): string {
  let masked = text;
  for (const { regex, replacement } of PII_PATTERNS) {
    masked = masked.replace(regex, replacement);
  }
  return masked;
}

/**
 * Count PII occurrences in a text string (for analytics/alerting).
 */
export function countPII(text: string): number {
  let total = 0;
  for (const { regex } of PII_PATTERNS) {
    const matches = text.match(regex);
    if (matches) total += matches.length;
  }
  return total;
}
