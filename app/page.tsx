import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-center mb-10">
        <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mx-auto mb-5 shadow-2xl">
          <span className="text-5xl font-black text-red-700">T</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight">ΤΑΚΗΣ</h1>
        <p className="text-red-200 mt-1 text-lg">Fast Food · Λάρισα</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Κουπόνια με την αγορά σου
        </h2>
        <div className="space-y-3 text-left text-white/90 text-sm">
          <p>1. Στο ταμείο, αγοράζεις <strong>€10+</strong> ή <strong>€20+</strong></p>
          <p>2. Ο υπάλληλος σε στέλνει να <strong>φτιάξεις λογαριασμό</strong> (σκάναροντας το QR στο μαγαζί)</p>
          <p>3. Μόλις μπεις, σκανάρει το <strong>QR μέλους</strong> από το κινητό σου και σου περνάει κουπόνι <strong>€1</strong> ή <strong>€2</strong></p>
          <p>4. Το κουπόνι έρχεται και στο <strong>email</strong> · ισχύει <strong>1 μήνα</strong></p>
        </div>
        <div className="flex gap-3 mt-6 justify-center">
          <div className="bg-yellow-400 text-red-900 rounded-2xl px-4 py-3 text-center">
            <div className="text-2xl font-black">€1</div>
            <div className="text-xs font-semibold">€10+</div>
          </div>
          <div className="bg-yellow-400 text-red-900 rounded-2xl px-4 py-3 text-center">
            <div className="text-2xl font-black">€2</div>
            <div className="text-xs font-semibold">€20+</div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/register"
          className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold py-4 px-6 rounded-2xl text-lg transition-all shadow-lg"
        >
          Εγγραφή
        </Link>
        <Link
          href="/login"
          className="block w-full text-center bg-white/15 hover:bg-white/25 text-white font-semibold py-4 px-6 rounded-2xl text-lg transition-all border border-white/30"
        >
          Σύνδεση
        </Link>
        <Link
          href="/join"
          className="block w-full text-center text-red-200 text-sm underline py-2"
        >
          QR καταστήματος (για εκτύπωση)
        </Link>
      </div>

      <p className="text-red-300 text-sm mt-8 text-center">
        Βόλου 75, Λάρισα · Δευτ-Σαβ 12:00–01:00
      </p>

      <BottomNav />
    </main>
  )
}
