import { parseMemberScanPayload } from './member-qr'

/**
 * Εξάγει τον 6ψήφιο κωδικό κουπονιού από σκάναρισμα (καθαρισμός κενών, μόνο ψηφία).
 */
export function normalizeCouponCodeFromScan(raw: string): string | null {
  const t = raw.trim()
  const digitsOnly = t.replace(/\D/g, '')
  if (digitsOnly.length === 6) return digitsOnly
  // Συχνά οι σαρωτές προσθέτουν χαρακτήρες — πάρε τις τελευταίες 6 συνεχόμενες ψηφίες
  const six = t.match(/(\d{6})/g)
  if (six?.length) return six[six.length - 1]
  return null
}

export type ParsedScan =
  | { kind: 'coupon'; code: string }
  | { kind: 'member' }
  | { kind: 'invalid' }

/**
 * Αν είναι σύνδεσμος ή κωδικός μέλους → πάντα «μέλος» (όχι κουπόνι).
 * Αλλιώς 6 ψηφία = κουπόνι.
 */
export function parseScanForRedeem(raw: string): ParsedScan {
  const t = raw.trim()
  const member = parseMemberScanPayload(t)
  if (member || t.toLowerCase().includes('/m/')) {
    return { kind: 'member' }
  }

  const coupon = normalizeCouponCodeFromScan(t)
  if (coupon) return { kind: 'coupon', code: coupon }

  return { kind: 'invalid' }
}
