import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  generateQRCode,
  calculateDiscount,
  calculateExpiryDate,
} from '@/lib/coupon-logic'
import { getReceiptHash } from '@/lib/receipt-validator'
import { sendCouponEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createAdminClient()

  const { qrContent, amount, customerName, customerEmail } = await req.json()

  if (!qrContent || !amount || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Ελλιπή δεδομένα' }, { status: 400 })
  }

  const emailLower = customerEmail.toLowerCase().trim()

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

  // Find or create customer by email
  let customerId: string

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', emailLower)
    .single()

  if (existingCustomer) {
    customerId = existingCustomer.id
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({ name: customerName.trim(), email: emailLower })
      .select()
      .single()

    if (customerError || !newCustomer) {
      return NextResponse.json({ error: 'Σφάλμα αποθήκευσης πελάτη' }, { status: 500 })
    }
    customerId = newCustomer.id
  }

  // Create receipt record
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({
      customer_id: customerId,
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
      customer_id: customerId,
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

  // Send email with coupon
  try {
    await sendCouponEmail({
      customerName: customerName.trim(),
      customerEmail: emailLower,
      couponCode: qrCode,
      discountAmount: discount.discountAmount,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (emailErr) {
    console.error('Email send failed:', emailErr)
    // Don't fail the whole request if email fails
  }

  return NextResponse.json({
    couponId: coupon.id,
    discountAmount: discount.discountAmount,
    qrCode,
    expiresAt: expiresAt.toISOString(),
  })
}
