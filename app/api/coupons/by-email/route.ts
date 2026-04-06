import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Λείπει το email' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!customer) {
    return NextResponse.json({ coupons: [], customerName: null })
  }

  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, discount_amount, qr_code, created_at, expires_at, is_redeemed, redeemed_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ coupons: coupons || [], customerName: customer.name })
}
