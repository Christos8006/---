import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Create an admin account.
 * Call once to set up the store admin user.
 * POST /api/admin/create
 * Body: { email, password, name, secret }
 */
export async function POST(req: NextRequest) {
  const { email, password, name, secret } = await req.json()

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Μη εξουσιοδοτημένο' }, { status: 403 })
  }

  const supabase = await createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Σφάλμα δημιουργίας' }, { status: 500 })
  }

  // Set as admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_admin: true, name })
    .eq('id', authData.user.id)

  if (profileError) {
    return NextResponse.json({ error: 'Σφάλμα ενημέρωσης προφίλ' }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}
