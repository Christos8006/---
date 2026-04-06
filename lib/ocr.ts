export interface OCRResult {
  amount: number | null
  rawText: string
  confidence: 'high' | 'low' | 'none'
  isValidReceipt: boolean
}

export async function extractAmountFromReceipt(base64Image: string): Promise<OCRResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    throw new Error('Google Vision API key not configured')
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.statusText}`)
  }

  const data = await response.json()
  const rawText: string = data.responses?.[0]?.fullTextAnnotation?.text || ''

  return parseReceiptText(rawText)
}

function parseReceiptText(text: string): OCRResult {
  const normalizedText = text.toLowerCase()

  // Check if receipt belongs to ΤΑΚΗΣ
  const takisKeywords = ['τακησ', 'takis', 'τάκης', 'βόλου', 'volou', '2410289271', 'fast food']
  const isValidReceipt = takisKeywords.some(kw => normalizedText.includes(kw))

  // Extract the total amount - look for common Greek receipt patterns
  // Patterns: "ΣΥΝΟΛΟ", "TOTAL", "ΠΛΗΡΩΤΕΟ", "ΣΥΝΟΛΙΚΟ ΠΟΣΟ", "ΤΕΛΙΚΟ ΠΟΣΟ"
  const totalPatterns = [
    /(?:συνολ[οό]|σύνολο|total|πληρωτέο|πληρωτεο|τελικ[οό]|ολικ[οό])\s*:?\s*(\d+[.,]\d{2})/i,
    /(?:συνολ[οό]|σύνολο|total|πληρωτέο|πληρωτεο|τελικ[οό]|ολικ[οό])\s*€?\s*(\d+[.,]\d{2})/i,
    /€\s*(\d+[.,]\d{2})\s*$/m,
    /(\d+[.,]\d{2})\s*€?\s*(?:ευρω|eur|€)?$/im,
  ]

  let amount: number | null = null
  let confidence: 'high' | 'low' | 'none' = 'none'

  // Try each pattern in order of confidence
  for (let i = 0; i < totalPatterns.length; i++) {
    const match = text.match(totalPatterns[i])
    if (match) {
      const parsed = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        // Find the largest amount that matches (usually the total is the biggest number)
        if (amount === null || (i < 2 && parsed > 0)) {
          amount = parsed
          confidence = i < 2 ? 'high' : 'low'
          if (i < 2) break
        }
      }
    }
  }

  // Fallback: find all currency amounts and pick the largest
  if (amount === null || confidence === 'none') {
    const allAmounts = [...text.matchAll(/(\d+)[.,](\d{2})/g)]
      .map(m => parseFloat(`${m[1]}.${m[2]}`))
      .filter(n => n >= 1 && n <= 999)

    if (allAmounts.length > 0) {
      amount = Math.max(...allAmounts)
      confidence = 'low'
    }
  }

  return {
    amount,
    rawText: text,
    confidence,
    isValidReceipt,
  }
}
