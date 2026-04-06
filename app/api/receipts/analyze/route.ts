import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateReceiptQR, getReceiptHash } from '@/lib/receipt-validator'
import { calculateDiscount } from '@/lib/coupon-logic'

export async function POST(req: NextRequest) {
  const { qrContent } = await req.json()

  if (!qrContent) {
    return NextResponse.json({ error: 'Δεν βρέθηκε QR κωδικός' }, { status: 400 })
  }

  // Check immediately if this receipt was already used
  const receiptHash = getReceiptHash(qrContent)
  try {
    const supabase = await createAdminClient()
    const { data: existing } = await supabase
      .from('receipts')
      .select('id')
      .eq('receipt_hash', receiptHash)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Αυτή η απόδειξη έχει ήδη σκαναριστεί και χρησιμοποιηθεί. Κάθε απόδειξη ισχύει μόνο μία φορά.' },
        { status: 409 }
      )
    }
  } catch {
    // If DB check fails, continue to validation
  }

  // Validate via ΑΑΔΕ — automatically extracts amount
  const validation = await validateReceiptQR(qrContent)

  if (!validation.valid || validation.amount === null) {
    return NextResponse.json(
      { error: validation.error || 'Μη έγκυρη απόδειξη' },
      { status: 422 }
    )
  }

  const discount = calculateDiscount(validation.amount)
  if (!discount.eligible) {
    return NextResponse.json({ error: discount.reason }, { status: 422 })
  }

  return NextResponse.json({
    amount: validation.amount,
    discount: discount.discountAmount,
    autoDetected: true,
  })
}
