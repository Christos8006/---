'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateGR, daysUntilExpiry } from '@/lib/coupon-logic'

interface Profile {
  name: string
  surname: string | null
  phone: string | null
  member_code: string | null
  is_admin: boolean
}

interface Coupon {
  id: string
  discount_amount: number
  qr_code: string
  created_at: string
  expires_at: string
  is_redeemed: boolean
  redeemed_at: string | null
}

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [origin, setOrigin] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  const loadCoupons = useCallback(async () => {
    const cr = await fetch('/api/coupons/mine', { cache: 'no-store' })
    const cj = await cr.json()
    if (cj.coupons) setCoupons(cj.coupons)
  }, [])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      if (cancelled) return
      setUserId(user.id)
      const res = await fetch('/api/profile/me')
      const data = await res.json()
      if (cancelled) return
      if (data.profile?.is_admin) {
        router.replace('/admin/scan')
        return
      }
      setProfile(data.profile)
      setEmail(data.email || '')
      await loadCoupons()
      if (!cancelled) setReady(true)
    })()
    return () => { cancelled = true }
  }, [router, supabase.auth, loadCoupons])

  /** Αυτόματη ανανέωση κουπονιών όταν ο ταμίας στέλνει κουπόνι */
  useEffect(() => {
    if (!userId || !ready) return

    loadCoupons()
    const interval = setInterval(loadCoupons, 7000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadCoupons()
    }
    document.addEventListener('visibilitychange', onVisible)

    const channel = supabase
      .channel(`coupons-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coupons',
          filter: `user_id=eq.${userId}`,
        },
        () => loadCoupons()
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [userId, ready, loadCoupons, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!ready || !profile?.member_code) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Φόρτωση...</p>
      </main>
    )
  }

  const memberUrl = `${origin}/m/${profile.member_code}`
  const active = coupons.filter(c => !c.is_redeemed && new Date(c.expires_at) > new Date())
  const used = coupons.filter(c => c.is_redeemed)
  const expired = coupons.filter(c => !c.is_redeemed && new Date(c.expires_at) <= new Date())

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-black text-white">
            Γεια σου, {profile.name}!
          </h1>
          <p className="text-red-200 text-sm mt-1">{email}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 text-center border-2 border-amber-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">Δείξε αυτό στον ταμία για να σου περάσει κουπόνι</p>
          <div className="bg-gray-50 rounded-2xl p-4 inline-block mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(memberUrl)}&size=200x200&margin=4&color=111827`}
              alt="QR μέλους"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
          <p className="font-mono text-lg font-bold text-red-800 tracking-widest">{profile.member_code}</p>
          <p className="text-xs text-gray-400 mt-2 break-all px-2">{memberUrl}</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/account/password"
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Αλλαγή κωδικού
          </Link>
          <Button variant="ghost" className="flex-1 text-red-700" onClick={handleLogout}>
            Έξοδος
          </Button>
        </div>

        <div className="flex items-center justify-between px-1 gap-2">
          <h2 className="text-lg font-bold text-gray-800">Τα κουπόνια μου</h2>
          <span className="text-xs text-gray-400 shrink-0">Ανανέωση αυτόματα</span>
        </div>

        {active.map(c => (
          <div key={c.id} className="bg-white rounded-3xl border-2 border-green-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-300 px-5 py-5 text-center">
              <p className="text-yellow-900 text-xs font-bold uppercase">Ενεργό · €{c.discount_amount}</p>
              <div className="bg-white rounded-2xl p-2 inline-block my-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${c.qr_code}&size=120x120&margin=2&color=111827`}
                  alt=""
                  width={120}
                  height={120}
                />
              </div>
              <p className="font-mono text-2xl font-black text-red-800 tracking-[0.2em]">{c.qr_code}</p>
              <p className="text-yellow-900 text-xs mt-2">
                Λήξη {formatDateGR(c.expires_at)} · {daysUntilExpiry(c.expires_at)} μέρες
              </p>
            </div>
          </div>
        ))}

        {used.map(c => (
          <div key={c.id} className="bg-gray-100 rounded-2xl p-4 opacity-70">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm">{c.qr_code}</span>
              <Badge>Εξαργυρώθηκε</Badge>
            </div>
          </div>
        ))}

        {expired.map(c => (
          <div key={c.id} className="bg-orange-50 rounded-2xl p-4 opacity-80">
            <span className="font-mono text-sm">{c.qr_code}</span>
            <span className="text-orange-700 text-xs ml-2">Έληξε</span>
          </div>
        ))}

        {coupons.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            Δεν έχεις κουπόνια ακόμα. Μετά την αγορά σου, ο ταμίας θα σου περάσει κουπόνι σκανάροντας το QR πάνω.
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
