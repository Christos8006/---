/**
 * Εξάγει τον κωδικό μέλους από σκάναρισμα (URL ή γυμνό κωδικό).
 */
export function parseMemberScanPayload(raw: string): string | null {
  const t = raw.trim()
  const urlMatch = t.match(/\/m\/([A-Z0-9]{10})(?:\?|$|\/)/i)
  if (urlMatch) return urlMatch[1].toUpperCase()
  if (/^[A-Z0-9]{10}$/i.test(t)) return t.toUpperCase()
  return null
}
