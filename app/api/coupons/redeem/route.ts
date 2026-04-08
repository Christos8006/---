import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isCouponValid } from '@/lib/coupon-logic'
import { normalizeCouponCodeFromScan } from '@/lib/scan-normalize'

async function fetchCouponWithProfile(
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  qrRaw: string
) {
  const normalized = normalizeCouponCodeFromScan(String(qrRaw))
  if (!normalized) return { coupon: null as null | Record<string, unknown> }

  const { data: coupon, error } = await adminSupabase
    .from('coupons')
    .select('*')
    .eq('qr_code', normalized)
    .maybeSingle()

  if (error || !coupon) return { coupon: null as null | Record<string, unknown> }

  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('name, surname, phone, member_code')
    .eq('id', coupon.user_id)
    .maybeSingle()

  return { coupon: { ...coupon, profiles } }
}

export async function POST(req: NextRequest) {
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

  const body = await req.json()
  const qrRaw = body.qrCode
  if (!qrRaw) {
    return NextResponse.json({ error: 'Λείπει ο κωδικός κουπονιού' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()
  const { coupon } = await fetchCouponWithProfile(adminSupabase, qrRaw)

  if (!coupon) {
    return NextResponse.json({ error: 'Το κουπόνι δεν βρέθηκε' }, { status: 404 })
  }

  const validity = isCouponValid({
    is_redeemed: Boolean(coupon.is_redeemed),
    expires_at: String(coupon.expires_at),
  })
  if (!validity.valid) {
    return NextResponse.json({ error: validity.reason }, { status: 409 })
  }

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

  const p = coupon.profiles as { name?: string; surname?: string } | null
  const customerName = [p?.name, p?.surname].filter(Boolean).join(' ') || 'Πελάτης'

  return NextResponse.json({
    success: true,
    discountAmount: coupon.discount_amount,
    customerName,
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

  const qrParam = new URL(req.url).searchParams.get('qr')
  if (!qrParam) {
    return NextResponse.json({ error: 'Λείπει ο κωδικός' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()
  const { coupon } = await fetchCouponWithProfile(adminSupabase, qrParam)

  if (!coupon) {
    return NextResponse.json({ error: 'Κουπόνι δεν βρέθηκε' }, { status: 404 })
  }

  const validity = isCouponValid({
    is_redeemed: Boolean(coupon.is_redeemed),
    expires_at: String(coupon.expires_at),
  })

  return NextResponse.json({
    coupon,
    valid: validity.valid,
    reason: validity.reason,
  })
}
