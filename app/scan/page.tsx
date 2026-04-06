'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatDateGR } from '@/lib/coupon-logic'
// Input kept for the name/email form step

type Step = 'info' | 'scanning' | 'processing' | 'success' | 'done' | 'error'

interface CouponResult {
  discountAmount: number
  qrCode: string
  expiresAt: string
}

export default function ScanPage() {
  const [step, setStep] = useState<Step>('info')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [scannedQR, setScannedQR] = useState('')
  const [analyzed, setAnalyzed] = useState<{ amount: number; discount: number; autoDetected: boolean } | null>(null)
  const [coupon, setCoupon] = useState<CouponResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const html5QrRef = useRef<unknown>(null)
  const scannedRef = useRef(false)

  useEffect(() => {
    if (step === 'scanning') {
      startScanner()
    }
    return () => {
      if (step !== 'scanning') stopScanner()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    return () => { stopScanner() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanner = async () => {
    scannedRef.current = false
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('receipt-qr-reader')
    html5QrRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (scannedRef.current) return
          scannedRef.current = true
          stopScanner()
          handleQRScanned(decodedText)
        },
        () => {}
      )
    } catch {
      toast.error('Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Δώσε άδεια κάμερας.')
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html5QrRef.current as any).stop().catch(() => {})
      html5QrRef.current = null
    }
  }

  const handleInfoSubmit = () => {
    if (!customerName.trim()) { toast.error('Βάλε το όνομά σου'); return }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast.error('Βάλε έγκυρο email')
      return
    }
    setStep('scanning')
  }

  const handleQRScanned = async (qrContent: string) => {
    setScannedQR(qrContent)
    setStep('processing')

    const res = await fetch('/api/receipts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrContent }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error || 'Μη έγκυρη απόδειξη')
      setStep('error')
      return
    }

    setAnalyzed(data)
    setStep('success')
  }

  const handleCreateCoupon = async () => {
    if (!analyzed || !scannedQR) return
    setStep('processing')

    const res = await fetch('/api/receipts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrContent: scannedQR,
        amount: analyzed.amount,
        customerName,
        customerEmail,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Αδύνατη η δημιουργία κουπονιού')
      setStep('success')
      return
    }

    setCoupon(data)
    setStep('done')
  }

  const reset = () => {
    setStep('info')
    setScannedQR('')
    setAnalyzed(null)
    setCoupon(null)
    setErrorMsg('')
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-white">Σκάναρε Απόδειξη</h1>
          <p className="text-red-200 text-sm mt-1">Κέρδισε κουπόνι έκπτωσης!</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Step 0: Name + Email */}
        {step === 'info' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-bold text-gray-800 text-xl text-center mb-1">Στοιχεία σου</h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Θα στείλουμε το κουπόνι σου στο email
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Όνομα</label>
                  <Input
                    type="text"
                    placeholder="π.χ. Γιώργης"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="rounded-xl text-base"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="π.χ. giorgos@gmail.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="rounded-xl text-base"
                    onKeyDown={e => e.key === 'Enter' && handleInfoSubmit()}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleInfoSubmit}
              className="w-full bg-red-700 hover:bg-red-600 text-white rounded-2xl py-4 font-bold text-base"
            >
              Συνέχεια → Σκάναρε την Απόδειξη
            </Button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-yellow-800 font-semibold text-sm mb-1">💡 Χρειάζεσαι:</p>
              <ul className="text-yellow-700 text-xs space-y-1">
                <li>• Απόδειξη <strong>ΤΑΚΗΣ</strong> αξίας <strong>€10+</strong></li>
                <li>• Να σκανάρεις το QR code στην απόδειξη</li>
                <li>• Το κουπόνι θα σταλεί στο email σου αμέσως!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 1: QR Scanner */}
        {step === 'scanning' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-blue-800 text-sm font-medium">Το κουπόνι θα σταλεί στο <strong>{customerEmail}</strong></p>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <div id="receipt-qr-reader" className="w-full" />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="font-semibold text-yellow-800 text-sm mb-2">Οδηγίες:</p>
              <ul className="text-yellow-700 text-xs space-y-1">
                <li>• Βρες το <strong>QR code</strong> στην απόδειξή σου</li>
                <li>• Σκάναρέ το με την κάμερα</li>
                <li>• Ισχύει μόνο για αποδείξεις ΤΑΚΗΣ άνω των €10</li>
              </ul>
            </div>

            <Button onClick={reset} variant="outline" className="w-full rounded-2xl py-3">
              ← Πίσω
            </Button>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700 text-xl">Έλεγχος απόδειξης...</h3>
            <p className="text-gray-400 text-sm mt-2">Παρακαλώ περίμενε</p>
          </div>
        )}

        {/* Confirmed amount - waiting for coupon creation */}
        {step === 'success' && analyzed && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                {analyzed.autoDetected ? 'Αναγνωρίστηκε αυτόματα' : 'Επιβεβαιωμένο ποσό'}
              </p>
              <p className="text-5xl font-black text-gray-900 my-2">€{analyzed.amount.toFixed(2)}</p>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
                <p className="text-green-800 font-semibold">
                  Κερδίζεις κουπόνι{' '}
                  <span className="text-2xl font-black">€{analyzed.discount}</span> έκπτωση!
                </p>
                <p className="text-green-600 text-xs mt-1">Ισχύει για 30 μέρες · Θα σταλεί στο {customerEmail}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline" className="flex-1 rounded-2xl py-3">Ακύρωση</Button>
              <Button
                onClick={handleCreateCoupon}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-2xl py-3 font-bold"
              >
                Δημιούργησε & Στείλε! 📧
              </Button>
            </div>
          </div>
        )}

        {/* Done - coupon created */}
        {step === 'done' && coupon && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-black text-gray-800 text-2xl">Μπράβο! 🎉</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4">Το κουπόνι σου δημιουργήθηκε!</p>

              {/* Coupon card */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-3xl p-6 my-4">
                <p className="text-yellow-900 text-sm font-semibold mb-1">Κουπόνι Έκπτωσης</p>
                <div className="text-6xl font-black text-red-800 mb-4">€{coupon.discountAmount}</div>

                {/* QR Code */}
                <div className="bg-white rounded-2xl p-3 inline-block mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${coupon.qrCode}&size=140x140&margin=4&color=111827`}
                    alt="QR Κουπόνι"
                    width={140}
                    height={140}
                    className="block"
                  />
                </div>

                {/* 6-digit code */}
                <div className="bg-white rounded-xl px-5 py-3 inline-block">
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest">Κωδικός</p>
                  <p className="font-mono text-3xl font-black text-red-700 tracking-[0.3em]">{coupon.qrCode}</p>
                </div>

                <p className="text-yellow-900 text-xs mt-3 font-medium">
                  Λήξη: {formatDateGR(coupon.expiresAt)}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-blue-800 text-sm font-semibold">📧 Στάλθηκε και στο email σου!</p>
                <p className="text-blue-600 text-xs mt-1">{customerEmail}</p>
              </div>

              <p className="text-gray-500 text-xs mt-3">
                Δείξε τον κωδικό ή το QR στον ταμία κατά την επόμενη παραγγελία σου.
              </p>
            </div>

            <Button
              onClick={reset}
              className="w-full bg-red-700 hover:bg-red-600 text-white rounded-2xl py-4 font-bold"
            >
              Νέο Σκάναρισμα
            </Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700 text-xl">Μη έγκυρη Απόδειξη</h3>
            <p className="text-gray-500 text-sm">{errorMsg}</p>
            <Button
              onClick={reset}
              className="bg-red-700 hover:bg-red-600 text-white rounded-2xl px-8 py-3 font-bold"
            >
              Δοκίμασε Ξανά
            </Button>
          </div>
        )}

      </div>

      <BottomNav />
    </main>
  )
}
