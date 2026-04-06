import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/AdminNav'
import { Badge } from '@/components/ui/badge'
import { formatDateGR } from '@/lib/coupon-logic'

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/admin/login')

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*, customers(name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  const active = (coupons || []).filter(c => !c.is_redeemed && new Date(c.expires_at) > new Date())
  const redeemed = (coupons || []).filter(c => c.is_redeemed)
  const expired = (coupons || []).filter(c => !c.is_redeemed && new Date(c.expires_at) <= new Date())

  return (
    <main className="min-h-screen bg-gray-900 pb-24">
      <div className="bg-gray-800 border-b border-gray-700 px-4 pt-12 pb-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-white">Κουπόνια</h1>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-green-400 font-semibold">{active.length} Ενεργά</span>
            <span className="text-gray-500">{redeemed.length} Χρησιμοπ.</span>
            <span className="text-orange-400">{expired.length} Ληγμένα</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-2">
        {(coupons || []).map(coupon => {
          const isActive = !coupon.is_redeemed && new Date(coupon.expires_at) > new Date()
          const isExpired = !coupon.is_redeemed && new Date(coupon.expires_at) <= new Date()

          return (
            <div
              key={coupon.id}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg ${
                isActive ? 'bg-green-900/50 text-green-400' :
                coupon.is_redeemed ? 'bg-gray-700 text-gray-500' :
                'bg-orange-900/50 text-orange-400'
              }`}>
                €{coupon.discount_amount}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {coupon.customers?.name || coupon.customers?.email || 'Άγνωστος'}
                </p>
                <p className="text-gray-500 font-mono text-xs truncate">{coupon.qr_code}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {coupon.is_redeemed
                    ? `Εξαργ. ${coupon.redeemed_at ? formatDateGR(coupon.redeemed_at) : ''}`
                    : `Λήξη: ${formatDateGR(coupon.expires_at)}`}
                </p>
              </div>

              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`text-xs shrink-0 ${
                  isActive ? 'bg-green-700 text-green-100' :
                  coupon.is_redeemed ? 'bg-gray-700 text-gray-400' :
                  'bg-orange-900/50 text-orange-400'
                }`}
              >
                {isActive ? 'Ενεργό' : coupon.is_redeemed ? 'Εξαργυρ.' : 'Ληγμένο'}
              </Badge>
            </div>
          )
        })}

        {(!coupons || coupons.length === 0) && (
          <div className="text-center py-16">
            <p className="text-gray-500">Δεν υπάρχουν κουπόνια ακόμα</p>
          </div>
        )}
      </div>

      <AdminNav />
    </main>
  )
}
