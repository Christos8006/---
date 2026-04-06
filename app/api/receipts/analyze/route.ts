import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateReceiptQR } from '@/lib/receipt-validator'
import { calculateDiscount } from '@/lib/coupon-logic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  const { qrContent, manualAmount } = await req.json()
  if (!qrContent) {
    return NextResponse.json({ error: 'Δεν βρέθηκε QR κωδικός' }, { status: 400 })
  }

  // If manual amount provided, skip ΑΑΔΕ validation
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

  // Validate via ΑΑΔΕ myDATA
  const validation = await validateReceiptQR(qrContent)

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  // Check if receipt is from ΤΑΚΗΣ (if ΑΦΜ validation is configured)
  if (validation.vatNumber && !validation.isFromTakis) {
    return NextResponse.json(
      { error: 'Η απόδειξη δεν ανήκει στο ΤΑΚΗΣ. Χρησιμοποίησε μόνο αποδείξεις από το κατάστημά μας.' },
      { status: 422 }
    )
  }

  // If amount could not be auto-detected, ask for manual entry
  if (validation.amount === null) {
    return NextResponse.json({ needsManualAmount: true })
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
