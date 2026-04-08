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
    .select('id, name, surname, phone, member_code, is_admin')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    profile,
    email: user.email,
  })
}
