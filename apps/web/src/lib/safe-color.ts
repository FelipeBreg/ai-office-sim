const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const FALLBACK_COLOR = '#6E7681';

/** Validates that a string is a safe hex color. Returns fallback if not. */
export function safeColor(color: string | undefined | null): string {
  if (!color || !HEX_COLOR_RE.test(color)) return FALLBACK_COLOR;
  return color;
}
