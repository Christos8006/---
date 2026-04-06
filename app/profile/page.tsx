import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import LogoutButton from '@/components/LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { count: totalCoupons } = await supabase
    .from('coupons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: usedCoupons } = await supabase
    .from('coupons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_redeemed', true)

  const { data: savingsData } = await supabase
    .from('coupons')
    .select('discount_amount')
    .eq('user_id', user.id)
    .eq('is_redeemed', true)

  const totalSaved = (savingsData || []).reduce((sum, c) => sum + c.discount_amount, 0)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-4xl font-black text-white">
              {(profile?.name || user.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">{profile?.name || 'Πελάτης'}</h1>
          <p className="text-red-200 text-sm mt-1">{user.email}</p>
          {profile?.phone && (
            <p className="text-red-200 text-sm">{profile.phone}</p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-red-700">{totalCoupons || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Κουπόνια</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-green-600">{usedCoupons || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Χρησιμ.</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-yellow-600">€{totalSaved.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Εξοικ/ση</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-900">Στοιχεία Λογαριασμού</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Τηλέφωνο</span>
                <span className="font-medium text-gray-900">{profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Μέλος από</span>
              <span className="font-medium text-gray-900">
                {new Date(user.created_at).toLocaleDateString('el-GR')}
              </span>
            </div>
          </div>
        </div>

        {/* Store info */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <h2 className="font-bold text-red-900 mb-2">ΤΑΚΗΣ Fast Food</h2>
          <div className="space-y-1 text-sm text-red-700">
            <p>📍 Βόλου 75, Λάρισα</p>
            <p>📞 2410 289271</p>
            <p>🕐 Δευτ-Σαβ: 12:00 – 01:00</p>
          </div>
        </div>

        <LogoutButton />
      </div>

      <BottomNav />
    </main>
  )
}
