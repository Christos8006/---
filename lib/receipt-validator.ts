export interface ReceiptValidationResult {
  valid: boolean
  amount: number | null
  vatNumber: string | null
  isFromTakis: boolean
  error?: string
  rawData?: string
}

/**
 * Validates a Greek fiscal receipt by fetching the ΑΑΔΕ myDATA URL
 * embedded in the receipt's QR code.
 *
 * Greek fiscal receipts (ταμειακές αποδείξεις) contain a QR code
 * that links to ΑΑΔΕ myDATA with receipt details including ΑΦΜ and total amount.
 */
export async function validateReceiptQR(qrContent: string): Promise<ReceiptValidationResult> {
  const takisAFM = process.env.TAKIS_AFM

  // Check if QR content is a valid ΑΑΔΕ URL
  const isAADEUrl = qrContent.includes('aade.gr') || qrContent.includes('mydata') || qrContent.includes('timologio')

  if (!isAADEUrl && !qrContent.startsWith('http')) {
    return {
      valid: false,
      amount: null,
      vatNumber: null,
      isFromTakis: false,
      error: 'Αυτό δεν φαίνεται να είναι QR κωδικός ελληνικής απόδειξης',
    }
  }

  try {
    // Fetch the ΑΑΔΕ receipt data
    const response = await fetch(qrContent, {
      headers: { 'Accept': 'application/xml, text/xml, application/json, text/html' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return {
        valid: false,
        amount: null,
        vatNumber: null,
        isFromTakis: false,
        error: 'Η απόδειξη δεν βρέθηκε στο σύστημα ΑΑΔΕ',
      }
    }

    const text = await response.text()

    // Try to extract ΑΦΜ and amount from XML (myDATA format)
    const vatMatch = text.match(/<vatNumber>(\d{9})<\/vatNumber>/) ||
                     text.match(/vatNumber["\s:]+["']?(\d{9})/) ||
                     text.match(/afm["\s:]+["']?(\d{9})/i) ||
                     text.match(/ΑΦΜ[:\s]+(\d{9})/i)

    const amountMatch = text.match(/<totalGrossValue>([\d.]+)<\/totalGrossValue>/) ||
                        text.match(/<totalNetValue>([\d.]+)<\/totalNetValue>/) ||
                        text.match(/totalGrossValue["\s:]+["']?([\d.]+)/) ||
                        text.match(/Σύνολο[:\s]+([\d,]+(?:\.\d{2})?)/) ||
                        text.match(/ΣΥΝΟΛΟ[:\s]+([\d,]+(?:\.\d{2})?)/) ||
                        text.match(/([\d]+[.,]\d{2})\s*€?\s*(?:Σύνολο|ΣΥΝΟΛΟ|Total)/i)

    const vatNumber = vatMatch?.[1] || null
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null
    const isFromTakis = takisAFM ? vatNumber === takisAFM : true // if no AFM configured, skip check

    return {
      valid: true,
      amount,
      vatNumber,
      isFromTakis,
      rawData: text.substring(0, 500),
    }
  } catch {
    // If ΑΑΔΕ fetch fails, return partial result — QR is still valid as unique receipt ID
    return {
      valid: true,
      amount: null,
      vatNumber: null,
      isFromTakis: true, // assume valid if we can't verify
      error: 'Δεν ήταν δυνατή η αυτόματη ανάγνωση ποσού. Θα χρειαστεί χειροκίνητη επιβεβαίωση.',
    }
  }
}

/**
 * Extracts a unique hash from the QR code content for anti-fraud.
 * Uses the full QR content as the unique receipt identifier.
 */
export function getReceiptHash(qrContent: string): string {
  // Normalize URL — remove tracking params
  try {
    const url = new URL(qrContent)
    // Keep only the meaningful params
    const uid = url.searchParams.get('uid') || url.searchParams.get('mark') || url.pathname
    return `QR:${uid || qrContent}`.substring(0, 255)
  } catch {
    return `QR:${qrContent}`.substring(0, 255)
  }
}
