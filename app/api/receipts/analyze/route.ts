import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractAmountFromReceipt } from '@/lib/ocr'
import { calculateDiscount } from '@/lib/coupon-logic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  const { image } = await req.json()
  if (!image) {
    return NextResponse.json({ error: 'Δεν βρέθηκε εικόνα' }, { status: 400 })
  }

  const ocr = await extractAmountFromReceipt(image)

  if (!ocr.isValidReceipt) {
    return NextResponse.json(
      { error: 'Η απόδειξη δεν φαίνεται να είναι από το ΤΑΚΗΣ. Παρακαλώ χρησιμοποίησε αποδείξεις από το κατάστημά μας.' },
      { status: 422 }
    )
  }

  if (ocr.amount === null) {
    return NextResponse.json(
      { error: 'Δεν μπόρεσα να διαβάσω το ποσό. Δοκίμασε ξανά με καλύτερο φωτισμό.' },
      { status: 422 }
    )
  }

  const discount = calculateDiscount(ocr.amount)
  if (!discount.eligible) {
    return NextResponse.json(
      { error: discount.reason },
      { status: 422 }
    )
  }

  return NextResponse.json({
    amount: ocr.amount,
    discount: discount.discountAmount,
    confidence: ocr.confidence,
  })
}
