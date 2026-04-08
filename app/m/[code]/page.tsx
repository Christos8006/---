import Link from 'next/link'

export default async function MemberCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-700 flex items-center justify-center mb-4">
        <span className="text-2xl font-black text-white">T</span>
      </div>
      <h1 className="text-white font-bold text-lg mb-2">Κωδικός μέλους ΤΑΚΗΣ</h1>
      <p className="font-mono text-amber-400 text-2xl font-black tracking-widest mb-6">{code.toUpperCase()}</p>
      <p className="text-gray-400 text-sm max-w-xs mb-8">
        Αυτή η σελίδα είναι για έλεγχο. Στο κατάστημα δείχνεις τον QR από τον λογαριασμό σου στο κινητό.
      </p>
      <Link href="/account" className="text-red-400 underline text-sm">
        Ο λογαριασμός μου
      </Link>
    </main>
  )
}
