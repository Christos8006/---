'use client'

import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDateGR, daysUntilExpiry } from '@/lib/coupon-logic'

interface Coupon {
  id: string
  discount_amount: number
  qr_code: string
  created_at: string
  expires_at: string
  is_redeemed: boolean
  redeemed_at: string | null
}

export default function MyCouponsPage() {
  const [email, setEmail] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])

  const handleSearch = async () => {
    if (!email.trim() || !email.includes('@')) return
    setLoading(true)
    setSearched(false)

    const res = await fetch(`/api/coupons/by-email?email=${encodeURIComponent(email.trim())}`)
    const data = await res.json()

    setCoupons(data.coupons || [])
    setCustomerName(data.customerName || null)
    setSearched(true)
    setLoading(false)
  }

  const active = coupons.filter(c => !c.is_redeemed && new Date(c.expires_at) > new Date())
  const used = coupons.filter(c => c.is_redeemed)
  const expired = coupons.filter(c => !c.is_redeemed && new Date(c.expires_at) <= new Date())

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-white">Τα Κουπόνια μου</h1>
          <p className="text-red-200 text-sm mt-1">Δες όλα τα κουπόνια σου</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">

        {/* Email search */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 mb-3">Βάλε το email σου για να δεις τα κουπόνια σου:</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email σου..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="rounded-xl flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-red-700 hover:bg-red-600 text-white rounded-xl px-5"
            >
              {loading ? '...' : 'Αναζήτηση'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <>
            {customerName && (
              <p className="text-gray-600 text-sm px-1">
                Γεια <strong>{customerName}</strong>! Βρήκαμε {coupons.length} κουπόνι{coupons.length !== 1 ? 'α' : ''}.
              </p>
            )}

            {coupons.length === 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Δεν βρέθηκαν κουπόνια</p>
                <p className="text-gray-400 text-sm mt-1">Σκάναρε μια απόδειξη για να κερδίσεις!</p>
              </div>
            )}

            {/* Active coupons */}
            {active.map(coupon => (
              <div key={coupon.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border-2 border-green-200">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-yellow-900 text-xs font-semibold uppercase tracking-wide">Ενεργό Κουπόνι</p>
                    <p className="text-red-800 text-3xl font-black">€{coupon.discount_amount} έκπτωση</p>
                  </div>
                  <Badge className="bg-green-600 text-white text-xs">ΕΝΕΡΓΟ</Badge>
                </div>
                <div className="px-5 py-4">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                    <p className="text-gray-400 text-xs mb-1">Κωδικός κουπονιού</p>
                    <p className="font-mono font-bold text-gray-800 text-sm tracking-widest">{coupon.qr_code}</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Εκδόθηκε: {formatDateGR(coupon.created_at)}</span>
                    <span className="text-orange-600 font-semibold">
                      {daysUntilExpiry(coupon.expires_at)} μέρες ακόμα
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Used coupons */}
            {used.map(coupon => (
              <div key={coupon.id} className="bg-white rounded-3xl overflow-hidden shadow-sm opacity-60">
                <div className="bg-gray-100 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Χρησιμοποιήθηκε</p>
                    <p className="text-gray-600 text-2xl font-black">€{coupon.discount_amount} έκπτωση</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">ΧΡΗΣΙΜ.</Badge>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-xs text-gray-400 tracking-widest">{coupon.qr_code}</p>
                  {coupon.redeemed_at && (
                    <p className="text-xs text-gray-400 mt-1">Εξαργυρώθηκε: {formatDateGR(coupon.redeemed_at)}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Expired coupons */}
            {expired.map(coupon => (
              <div key={coupon.id} className="bg-white rounded-3xl overflow-hidden shadow-sm opacity-50">
                <div className="bg-orange-50 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-xs font-semibold uppercase tracking-wide">Ληγμένο</p>
                    <p className="text-orange-700 text-2xl font-black">€{coupon.discount_amount} έκπτωση</p>
                  </div>
                  <Badge className="bg-orange-200 text-orange-700 text-xs">ΛΗΓΜΕΝΟ</Badge>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-xs text-gray-400 tracking-widest">{coupon.qr_code}</p>
                  <p className="text-xs text-gray-400 mt-1">Έληξε: {formatDateGR(coupon.expires_at)}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
