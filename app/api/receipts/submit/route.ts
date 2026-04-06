import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  hashReceiptImage,
  generateQRCode,
  calculateDiscount,
  calculateExpiryDate,
} from '@/lib/coupon-logic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  const { image, amount } = await req.json()
  if (!image || !amount) {
    return NextResponse.json({ error: 'Ελλιπή δεδομένα' }, { status: 400 })
  }

  // 1. Anti-fraud: check if this receipt was already used
  const receiptHash = hashReceiptImage(image)
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

  // 2. Validate discount eligibility
  const discount = calculateDiscount(amount)
  if (!discount.eligible) {
    return NextResponse.json({ error: discount.reason }, { status: 422 })
  }

  // 3. Upload receipt image to Supabase Storage
  const imageBuffer = Buffer.from(image, 'base64')
  const fileName = `${user.id}/${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, imageBuffer, { contentType: 'image/jpeg' })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Σφάλμα αποθήκευσης εικόνας' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName)

  // 4. Create receipt record
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      amount,
      receipt_hash: receiptHash,
    })
    .select()
    .single()

  if (receiptError || !receipt) {
    return NextResponse.json({ error: 'Σφάλμα αποθήκευσης απόδειξης' }, { status: 500 })
  }

  // 5. Create coupon
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
