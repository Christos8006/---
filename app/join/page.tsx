'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function JoinPage() {
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const registerUrl = origin ? `${origin}/register` : '/register'

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-800 to-red-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl font-black text-red-700">T</span>
        </div>
        <h1 className="text-3xl font-black text-white">ΤΑΚΗΣ</h1>
        <p className="text-red-200 mt-2">Κέρδισε κουπόνια με τις αγορές σου</p>
      </div>

      {origin && (
        <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center mb-8">
          <p className="text-gray-600 text-sm font-semibold mb-4">Σκάναρε με το κινητό σου</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(registerUrl)}&size=220x220&margin=4`}
            alt="QR εγγραφής"
            width={220}
            height={220}
            className="mx-auto"
          />
          <p className="text-xs text-gray-400 mt-4 break-all">{registerUrl}</p>
        </div>
      )}

      <Link
        href="/register"
        className="block w-full max-w-sm text-center bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold py-4 rounded-2xl text-lg"
      >
        Άνοιγμα εγγραφής
      </Link>
      <Link href="/login" className="text-red-200 text-sm mt-4 underline">
        Έχω ήδη λογαριασμό
      </Link>

      <BottomNav />
    </main>
  )
}
