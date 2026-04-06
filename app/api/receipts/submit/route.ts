import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateQRCode,
  calculateDiscount,
  calculateExpiryDate,
} from '@/lib/coupon-logic'
import { getReceiptHash } from '@/lib/receipt-validator'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  const { qrContent, amount } = await req.json()
  if (!qrContent || !amount) {
    return NextResponse.json({ error: 'Ελλιπή δεδομένα' }, { status: 400 })
  }

  // Anti-fraud: check if this receipt QR was already used
  const receiptHash = getReceiptHash(qrContent)
  const { data: existing } = await supabase
    .from('receipts')
    .select('id')
    .eq('receipt_hash', receiptHash)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Αυτή η απόδειξη έχει ήδη χρησιμοποιηθεί.' },
      { status: 409 }
    )
  }

  // Validate discount eligibility
  const discount = calculateDiscount(amount)
  if (!discount.eligible) {
    return NextResponse.json({ error: discount.reason }, { status: 422 })
  }

  // Create receipt record (store QR content as image_url since no photo)
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({
      user_id: user.id,
      image_url: qrContent,
      amount,
      receipt_hash: receiptHash,
    })
    .select()
    .single()

  if (receiptError || !receipt) {
    return NextResponse.json({ error: 'Σφάλμα αποθήκευσης απόδειξης' }, { status: 500 })
  }

  // Create coupon
  const qrCode = generateQRCode()
  const expiresAt = calculateExpiryDate()

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      user_id: user.id,
      receipt_id: receipt.id,
      discount_amount: discount.discountAmount,
      qr_code: qrCode,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (couponError || !coupon) {
    return NextResponse.json({ error: 'Σφάλμα δημιουργίας κουπονιού' }, { status: 500 })
  }

  return NextResponse.json({
    couponId: coupon.id,
    discountAmount: discount.discountAmount,
    qrCode,
    expiresAt: expiresAt.toISOString(),
  })
}
