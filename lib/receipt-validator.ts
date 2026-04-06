export interface ReceiptValidationResult {
  valid: boolean
  amount: number | null
  vatNumber: string | null
  isFromTakis: boolean
  error?: string
}

/**
 * Tries to extract a monetary amount from raw text (HTML or XML).
 * Returns the most likely "total" amount found.
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
    // Amount followed by € sign
    /([\d]+[.,]\d{2})\s*€/g,
  ]

  const candidates: number[] = []

  for (const pattern of patterns) {
    if (pattern.global) {
      const matches = [...text.matchAll(pattern as RegExp)]
      for (const m of matches) {
        const val = parseFloat(m[1].replace(',', '.'))
        if (!isNaN(val) && val > 0) candidates.push(val)
      }
    } else {
      const m = text.match(pattern)
      if (m) {
        const val = parseFloat(m[1].replace(',', '.'))
        if (!isNaN(val) && val > 0) return val
      }
    }
  }

  // From all €-amounts found, the total is usually the largest one
  if (candidates.length > 0) {
    return Math.max(...candidates)
  }

  return null
}

/**
 * Validates a Greek fiscal receipt QR code.
 * Tries multiple AADE endpoints to extract the total amount.
 */
export async function validateReceiptQR(qrContent: string): Promise<ReceiptValidationResult> {
  const takisAFM = process.env.TAKIS_AFM

  // Must be an HTTP URL (AADE receipt links are always URLs)
  if (!qrContent.startsWith('http')) {
    return {
      valid: false,
      amount: null,
      vatNumber: null,
      isFromTakis: false,
      error: 'Αυτό δεν είναι QR κωδικός ελληνικής φορολογικής απόδειξης.',
    }
  }

  const isAADEUrl =
    qrContent.includes('aade.gr') ||
    qrContent.includes('mydata') ||
    qrContent.includes('timologio')

  if (!isAADEUrl) {
    return {
      valid: false,
      amount: null,
      vatNumber: null,
      isFromTakis: false,
      error: 'Αυτό δεν είναι QR κωδικός ελληνικής φορολογικής απόδειξης.',
    }
  }

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
  if (mark) {
    endpoints.push(
      `https://www.aade.gr/myDATA/invoiceDoc?Mark=${mark}`,
      `https://www.aade.gr/myDATA/doc?Mark=${mark}`,
    )
    if (uid) {
      endpoints.push(
        `https://www.aade.gr/myDATA/invoiceDoc?Mark=${mark}&Uid=${uid}`,
      )
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

      // Extract amount
      const found = parseAmountFromText(text)
      if (found !== null) {
        amount = found
        break
      }
    } catch {
      // Try next endpoint
    }
  }

  // If still no amount found, reject (prevents fraud via manual entry)
  if (amount === null) {
    return {
      valid: false,
      amount: null,
      vatNumber,
      isFromTakis: false,
      error:
        'Δεν ήταν δυνατή η ανάγνωση του ποσού από την απόδειξη. Δοκίμασε ξανά σε λίγο ή ζήτα βοήθεια από τον ταμία.',
    }
  }

  const isFromTakis = takisAFM ? vatNumber === takisAFM : true

  if (vatNumber && !isFromTakis) {
    return {
      valid: false,
      amount: null,
      vatNumber,
      isFromTakis: false,
      error: 'Η απόδειξη δεν ανήκει στο ΤΑΚΗΣ. Χρησιμοποίησε μόνο αποδείξεις από το κατάστημά μας.',
    }
  }

  return {
    valid: true,
    amount,
    vatNumber,
    isFromTakis,
  }
}

/**
 * Extracts a unique hash from the QR code content for anti-fraud.
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
