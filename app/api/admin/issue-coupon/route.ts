import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseMemberScanPayload } from '@/lib/member-qr'
import { generateQRCode, calculateExpiryDate } from '@/lib/coupon-logic'
import { sendCouponEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: 'Δεν έχεις δικαίωμα' }, { status: 403 })
  }

  const body = await req.json()
  const scanPayload = typeof body.scanPayload === 'string' ? body.scanPayload : ''
  const discountAmount = Number(body.discountAmount)

  const memberCode = parseMemberScanPayload(scanPayload)
  if (!memberCode) {
    return NextResponse.json({ error: 'Μη έγκυρο QR μέλους' }, { status: 400 })
  }

  if (discountAmount !== 1 && discountAmount !== 2) {
    return NextResponse.json({ error: 'Έκπτωση πρέπει να είναι €1 ή €2' }, { status: 400 })
  }

  const adminSb = await createAdminClient()

  const { data: customerProfile } = await adminSb
    .from('profiles')
    .select('id, name, surname, member_code, is_admin')
    .eq('member_code', memberCode)
    .single()

  if (!customerProfile || customerProfile.is_admin) {
    return NextResponse.json({ error: 'Δεν βρέθηκε πελάτης με αυτόν τον κωδικό' }, { status: 404 })
  }

  const qrCode = generateQRCode()
  const expiresAt = calculateExpiryDate()

  const { data: coupon, error: couponErr } = await adminSb
    .from('coupons')
    .insert({
      user_id: customerProfile.id,
      discount_amount: discountAmount,
      qr_code: qrCode,
      expires_at: expiresAt.toISOString(),
      issued_by: user.id,
    })
    .select()
    .single()

  if (couponErr || !coupon) {
    return NextResponse.json({ error: 'Αποτυχία δημιουργίας κουπονιού' }, { status: 500 })
  }

  const { data: authData } = await adminSb.auth.admin.getUserById(customerProfile.id)
  const email = authData?.user?.email
  const displayName = [customerProfile.name, customerProfile.surname].filter(Boolean).join(' ') || 'Πελάτη'

  if (email) {
    try {
      await sendCouponEmail({
        customerName: displayName,
        customerEmail: email,
        couponCode: qrCode,
        discountAmount,
        expiresAt: expiresAt.toISOString(),
      })
    } catch (e) {
      console.error('issue-coupon email:', e)
    }
  }

  return NextResponse.json({
    ok: true,
    couponId: coupon.id,
    qrCode,
    discountAmount,
    expiresAt: expiresAt.toISOString(),
    customerName: displayName,
    emailSent: Boolean(email),
  })
}
