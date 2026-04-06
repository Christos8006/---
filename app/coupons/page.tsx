import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import CouponCard from '@/components/CouponCard'
import Link from 'next/link'

export default async function CouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeCoupons = (coupons || []).filter(
    c => !c.is_redeemed && new Date(c.expires_at) > new Date()
  )
  const usedCoupons = (coupons || []).filter(
    c => c.is_redeemed || new Date(c.expires_at) <= new Date()
  )

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <p className="text-red-200 text-sm">Γεια σου,</p>
          <h1 className="text-2xl font-black text-white">
            {profile?.name || 'Πελάτη'} 👋
          </h1>
          <p className="text-red-200 text-sm mt-1">
            {activeCoupons.length > 0
              ? `Έχεις ${activeCoupons.length} ενεργό κουπόνι${activeCoupons.length > 1 ? 'α' : ''}!`
              : 'Δεν έχεις κουπόνια ακόμα'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Active coupons */}
        {activeCoupons.length > 0 ? (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Ενεργά Κουπόνια</h2>
            <div className="space-y-3">
              {activeCoupons.map(coupon => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700 text-lg">Δεν έχεις κουπόνια</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              Κάνε παραγγελία €10+ στο ΤΑΚΗΣ και σκάναρε την απόδειξή σου για να κερδίσεις έκπτωση!
            </p>
            <Link
              href="/scan"
              className="inline-block mt-5 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
            >
              Σκάναρε Απόδειξη
            </Link>
          </div>
        )}

        {/* Past coupons */}
        {usedCoupons.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Ιστορικό</h2>
            <div className="space-y-3">
              {usedCoupons.map(coupon => (
                <CouponCard key={coupon.id} coupon={coupon} inactive />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
