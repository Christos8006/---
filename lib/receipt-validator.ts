export interface ReceiptValidationResult {
  valid: boolean
  amount: number | null
  vatNumber: string | null
  isFromTakis: boolean
  error?: string
}

/**
 * Tries to extract a monetary amount from raw text (HTML or XML).
 */
function parseAmountFromText(text: string): number | null {
  const patterns = [
    // XML myDATA format
    /<totalGrossValue>([\d.]+)<\/totalGrossValue>/i,
    /<totalNetValue>([\d.]+)<\/totalNetValue>/i,
    /<grossValue>([\d.]+)<\/grossValue>/i,
    // JSON / JS state
    /"totalGrossValue"\s*:\s*([\d.]+)/i,
    /"totalAmount"\s*:\s*([\d.]+)/i,
    /"grossValue"\s*:\s*([\d.]+)/i,
    // Greek HTML labels
    /(?:Σύνολο|ΣΥΝΟΛΟ|Αξία|ΑΞΙΑ|Τελικό Ποσό|ΤΕΛΙΚΟ ΠΟΣΟ|Total)[^€\d]{0,20}([\d]+[.,]\d{2})/i,
  ]

  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'))
      if (!isNaN(val) && val > 0) return val
    }
  }

  // Find all €-amounts, pick the largest (likely the total)
  const euroMatches = [...text.matchAll(/([\d]+[.,]\d{2})\s*€/g)]
  const candidates = euroMatches
    .map(m => parseFloat(m[1].replace(',', '.')))
    .filter(v => !isNaN(v) && v > 0)
  if (candidates.length > 0) return Math.max(...candidates)

  return null
}

/**
 * Validates a Greek fiscal receipt QR code.
 * Accepts any HTTP URL (AADE or other fiscal systems).
 * Tries to extract the total amount automatically.
 */
export async function validateReceiptQR(qrContent: string): Promise<ReceiptValidationResult> {
  const takisAFM = process.env.TAKIS_AFM

  // Must be an HTTP URL
  if (!qrContent.startsWith('http')) {
    return {
      valid: false,
      amount: null,
      vatNumber: null,
      isFromTakis: false,
      error: 'Αυτό δεν είναι QR κωδικός φορολογικής απόδειξης. Σκάναρε το QR που υπάρχει στην απόδειξη.',
    }
  }

  const isAADEUrl =
    qrContent.includes('aade.gr') ||
    qrContent.includes('mydata') ||
    qrContent.includes('timologio')

  // Extract Mark parameter for alternative API calls
  let mark: string | null = null
  let uid: string | null = null
  try {
    const url = new URL(qrContent)
    mark = url.searchParams.get('Mark') || url.searchParams.get('mark')
    uid = url.searchParams.get('Uid') || url.searchParams.get('uid')
  } catch {
    // ignore
  }

  // Build list of endpoints to try
  const endpoints: string[] = [qrContent]
  if (isAADEUrl && mark) {
    endpoints.push(
      `https://www.aade.gr/myDATA/invoiceDoc?Mark=${mark}`,
      `https://www.aade.gr/myDATA/doc?Mark=${mark}`,
    )
    if (uid) {
      endpoints.push(`https://www.aade.gr/myDATA/invoiceDoc?Mark=${mark}&Uid=${uid}`)
    }
  }

  let vatNumber: string | null = null
  let amount: number | null = null

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
          Accept: 'application/xml, text/xml, application/json, text/html, */*',
          'Accept-Language': 'el-GR,el;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) continue

      const text = await response.text()

      // Extract ΑΦΜ
      if (!vatNumber) {
        const vatMatch =
          text.match(/<vatNumber>(\d{9})<\/vatNumber>/i) ||
          text.match(/"vatNumber"\s*:\s*"(\d{9})"/i) ||
          text.match(/ΑΦΜ[:\s]+(\d{9})/i) ||
          text.match(/afm["\s:]+["']?(\d{9})/i)
        vatNumber = vatMatch?.[1] || null
      }

      const found = parseAmountFromText(text)
      if (found !== null) {
        amount = found
        break
      }
    } catch {
      // Try next endpoint
    }
  }

  // ΑΦΜ check (only if TAKIS_AFM is configured AND we got a vatNumber)
  const isFromTakis = takisAFM && vatNumber ? vatNumber === takisAFM : true
  if (takisAFM && vatNumber && !isFromTakis) {
    return {
      valid: false,
      amount: null,
      vatNumber,
      isFromTakis: false,
      error: 'Η απόδειξη δεν ανήκει στο ΤΑΚΗΣ. Χρησιμοποίησε μόνο αποδείξεις από το κατάστημά μας.',
    }
  }

  // Valid receipt — amount may or may not have been auto-detected
  return {
    valid: true,
    amount, // null = needs manual entry
    vatNumber,
    isFromTakis,
  }
}

/**
 * Unique hash for anti-fraud duplicate detection.
 */
export function getReceiptHash(qrContent: string): string {
  try {
    const url = new URL(qrContent)
    const mark = url.searchParams.get('Mark') || url.searchParams.get('mark')
    const uid = url.searchParams.get('Uid') || url.searchParams.get('uid')
    if (mark) return `MARK:${mark}${uid ? `:${uid}` : ''}`.substring(0, 255)
    return `QR:${url.pathname}${url.search}`.substring(0, 255)
  } catch {
    return `QR:${qrContent}`.substring(0, 255)
  }
}
