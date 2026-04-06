import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isCouponValid } from '@/lib/coupon-logic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  // Only admins can redeem coupons
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Δεν έχεις δικαίωμα' }, { status: 403 })
  }

  const { qrCode } = await req.json()
  if (!qrCode) {
    return NextResponse.json({ error: 'Λείπει ο κωδικός κουπονιού' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()

  // Fetch coupon by QR code (join customers)
  const { data: coupon } = await adminSupabase
    .from('coupons')
    .select('*, customers(name, email)')
    .eq('qr_code', qrCode)
    .single()

  if (!coupon) {
    return NextResponse.json({ error: 'Το κουπόνι δεν βρέθηκε' }, { status: 404 })
  }

  // Validate coupon
  const validity = isCouponValid(coupon)
  if (!validity.valid) {
    return NextResponse.json({ error: validity.reason }, { status: 409 })
  }

  // Mark as redeemed
  const { error: updateError } = await adminSupabase
    .from('coupons')
    .update({
      is_redeemed: true,
      redeemed_at: new Date().toISOString(),
    })
    .eq('id', coupon.id)

  if (updateError) {
    return NextResponse.json({ error: 'Σφάλμα εξαργύρωσης' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    discountAmount: coupon.discount_amount,
    customerName: coupon.customers?.name || 'Πελάτης',
    message: `Κουπόνι €${coupon.discount_amount} εξαργυρώθηκε επιτυχώς!`,
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Δεν έχεις δικαίωμα' }, { status: 403 })
  }

  const qrCode = new URL(req.url).searchParams.get('qr')
  if (!qrCode) {
    return NextResponse.json({ error: 'Λείπει ο κωδικός' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()

  const { data: coupon } = await adminSupabase
    .from('coupons')
    .select('*, customers(name, email)')
    .eq('qr_code', qrCode)
    .single()

  if (!coupon) {
    return NextResponse.json({ error: 'Κουπόνι δεν βρέθηκε' }, { status: 404 })
  }

  const validity = isCouponValid(coupon)

  return NextResponse.json({
    coupon,
    valid: validity.valid,
    reason: validity.reason,
  })
}
