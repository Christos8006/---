import Link from 'next/link'

export default function HomePage() {
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
              Βάλε το <strong>όνομα</strong> και το <strong>email</strong> σου
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 font-bold text-red-900">
              2
            </div>
            <p className="text-white/90 text-sm pt-2">
              Σκάναρε την απόδειξή σου (<strong>€10+</strong>)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 font-bold text-red-900">
              3
            </div>
            <p className="text-white/90 text-sm pt-2">
              Πάρε το κουπόνι σου <strong>στο email</strong> αμέσως!
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
          href="/scan"
          className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold py-4 px-6 rounded-2xl text-lg transition-all shadow-lg active:scale-95"
        >
          📷 Σκάναρε Απόδειξη
        </Link>
        <Link
          href="/my-coupons"
          className="block w-full text-center bg-white/15 hover:bg-white/25 text-white font-semibold py-4 px-6 rounded-2xl text-lg transition-all border border-white/30"
        >
          🎟️ Τα κουπόνια μου
        </Link>
      </div>

      <p className="text-red-300 text-sm mt-8 text-center">
        Βόλου 75, Λάρισα · Δευτ-Σαβ 12:00–01:00
      </p>
    </main>
  )
}
