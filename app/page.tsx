import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/coupons')
  } catch {
    // Supabase not configured yet - show landing page
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="text-center mb-10">
        <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mx-auto mb-5 shadow-2xl">
          <span className="text-5xl font-black text-red-700">T</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight">ΤΑΚΗΣ</h1>
        <p className="text-red-200 mt-1 text-lg">Fast Food · Λάρισα</p>
      </div>

      {/* Value proposition */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Κέρδισε εκπτώσεις!
        </h2>
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 font-bold text-red-900">
              1
            </div>
            <p className="text-white/90 text-sm pt-2">
              Κάνε παραγγελία <strong>€10+</strong> στο κατάστημά μας
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 font-bold text-red-900">
              2
            </div>
            <p className="text-white/90 text-sm pt-2">
              Σκάναρε την απόδειξή σου εδώ
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 font-bold text-red-900">
              3
            </div>
            <p className="text-white/90 text-sm pt-2">
              Πάρε κουπόνι <strong>€1 ή €2</strong> έκπτωση για την επόμενη παραγγελία!
            </p>
          </div>
        </div>

        {/* Discount badges */}
        <div className="flex gap-3 mt-6 justify-center">
          <div className="bg-yellow-400 text-red-900 rounded-2xl px-4 py-3 text-center">
            <div className="text-2xl font-black">€1</div>
            <div className="text-xs font-semibold">για €10+</div>
          </div>
          <div className="bg-yellow-400 text-red-900 rounded-2xl px-4 py-3 text-center">
            <div className="text-2xl font-black">€2</div>
            <div className="text-xs font-semibold">για €20+</div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/register"
          className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold py-4 px-6 rounded-2xl text-lg transition-all shadow-lg active:scale-95"
        >
          Ξεκίνα τώρα — Δωρεάν!
        </Link>
        <Link
          href="/login"
          className="block w-full text-center bg-white/15 hover:bg-white/25 text-white font-semibold py-4 px-6 rounded-2xl text-lg transition-all border border-white/30"
        >
          Έχω ήδη λογαριασμό
        </Link>
      </div>

      <p className="text-red-300 text-sm mt-8 text-center">
        Βόλου 75, Λάρισα · Δευτ-Σαβ 12:00–01:00
      </p>
    </main>
  )
}
