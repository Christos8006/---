import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  if (profile?.is_admin) {
    return NextResponse.json({ coupons: [] })
  }

  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, discount_amount, qr_code, created_at, expires_at, is_redeemed, redeemed_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ coupons: coupons || [] })
}
