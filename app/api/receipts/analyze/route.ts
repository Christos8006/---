import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateReceiptQR, getReceiptHash } from '@/lib/receipt-validator'
import { calculateDiscount } from '@/lib/coupon-logic'

export async function POST(req: NextRequest) {
  const { qrContent, manualAmount } = await req.json()

  if (!qrContent) {
    return NextResponse.json({ error: 'Δεν βρέθηκε QR κωδικός' }, { status: 400 })
  }

  // Immediate duplicate check
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
        { error: 'Αυτή η απόδειξη έχει ήδη σκαναριστεί. Κάθε απόδειξη ισχύει μόνο μία φορά.' },
        { status: 409 }
      )
    }
  } catch {
    // If DB check fails, continue
  }

  // If manual amount was provided (fallback when AADE auto-detect fails)
  if (manualAmount !== undefined) {
    const discount = calculateDiscount(manualAmount)
    if (!discount.eligible) {
      return NextResponse.json({ error: discount.reason }, { status: 422 })
    }
    return NextResponse.json({
      amount: manualAmount,
      discount: discount.discountAmount,
      autoDetected: false,
    })
  }

  // Validate via AADE — auto-detect amount
  const validation = await validateReceiptQR(qrContent)

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || 'Μη έγκυρη απόδειξη' },
      { status: 422 }
    )
  }

  // Amount auto-detected
  if (validation.amount !== null) {
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

  // Amount not auto-detected — ask customer to enter it manually
  return NextResponse.json({ needsManualAmount: true })
}
