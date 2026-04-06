import CryptoJS from 'crypto-js'

export interface CouponDiscount {
  eligible: boolean
  discountAmount: number
  reason: string
}

/**
 * Determines discount amount based on receipt total.
 * €10-€19.99 → €1 discount
 * €20+       → €2 discount
 * <€10       → not eligible
 */
export function calculateDiscount(amount: number): CouponDiscount {
  if (amount >= 20) {
    return { eligible: true, discountAmount: 2, reason: `Παραγγελία €${amount.toFixed(2)} → Κουπόνι €2` }
  }
  if (amount >= 10) {
    return { eligible: true, discountAmount: 1, reason: `Παραγγελία €${amount.toFixed(2)} → Κουπόνι €1` }
  }
  return {
    eligible: false,
    discountAmount: 0,
    reason: `Η παραγγελία πρέπει να είναι τουλάχιστον €10 (τρέχον ποσό: €${amount.toFixed(2)})`,
  }
}

/**
 * Creates a SHA-256 hash of the receipt image to prevent duplicate submissions.
 */
export function hashReceiptImage(base64Image: string): string {
  return CryptoJS.SHA256(base64Image).toString()
}

/**
 * Generates a unique QR code string for a coupon.
 */
export function generateQRCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `TAKIS-${timestamp}-${random}`.toUpperCase()
}

/**
 * Calculates expiry date: 30 days from now.
 */
export function calculateExpiryDate(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)
  return expiry
}

/**
 * Checks if a coupon is still valid (not redeemed and not expired).
 */
export function isCouponValid(coupon: {
  is_redeemed: boolean
  expires_at: string
}): { valid: boolean; reason?: string } {
  if (coupon.is_redeemed) {
    return { valid: false, reason: 'Το κουπόνι έχει ήδη χρησιμοποιηθεί' }
  }
  if (new Date(coupon.expires_at) < new Date()) {
    return { valid: false, reason: 'Το κουπόνι έχει λήξει' }
  }
  return { valid: true }
}

/**
 * Formats a date in Greek locale.
 */
export function formatDateGR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Returns how many days until expiry.
 */
export function daysUntilExpiry(expiresAt: string): number {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
