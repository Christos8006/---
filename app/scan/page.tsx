'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Step = 'scanning' | 'confirming' | 'processing' | 'success' | 'needsAmount' | 'error'

interface OCRResult {
  amount: number
  discount: number
  autoDetected: boolean
}

export default function ScanPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('scanning')
  const [scannedQR, setScannedQR] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [result, setResult] = useState<OCRResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [scannerReady, setScannerReady] = useState(false)
  const html5QrRef = useRef<unknown>(null)
  const scannedRef = useRef(false)

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanner = async () => {
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('receipt-qr-reader')
    html5QrRef.current = scanner
    setScannerReady(true)

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
      toast.error('Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Δοκίμασε να δώσεις άδεια κάμερας.')
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html5QrRef.current as any).stop().catch(() => {})
      html5QrRef.current = null
    }
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

    if (data.needsManualAmount) {
      setStep('needsAmount')
      return
    }

    setResult(data)
    setStep('success')
  }

  const handleManualAmount = async () => {
    const amount = parseFloat(manualAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      toast.error('Βάλε έγκυρο ποσό')
      return
    }
    if (amount < 10) {
      toast.error('Η παραγγελία πρέπει να είναι τουλάχιστον €10')
      return
    }
    setStep('processing')

    const res = await fetch('/api/receipts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrContent: scannedQR, manualAmount: amount }),
    })

    const data = await res.json()
    if (!res.ok) {
      setErrorMsg(data.error || 'Σφάλμα')
      setStep('error')
      return
    }

    setResult(data)
    setStep('success')
  }

  const handleCreateCoupon = async () => {
    if (!result || !scannedQR) return

    const res = await fetch('/api/receipts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrContent: scannedQR, amount: result.amount }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Αδύνατη η δημιουργία κουπονιού')
      return
    }

    toast.success(`Κουπόνι €${result.discount} δημιουργήθηκε!`)
    router.push('/coupons')
  }

  const reset = async () => {
    scannedRef.current = false
    setStep('scanning')
    setScannedQR('')
    setResult(null)
    setErrorMsg('')
    setManualAmount('')
    await startScanner()
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-white">Σκάναρε Απόδειξη</h1>
          <p className="text-red-200 text-sm mt-1">Σκάναρε το QR code στην απόδειξη του ΤΑΚΗΣ</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">

        {/* QR Scanner */}
        {step === 'scanning' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <div id="receipt-qr-reader" className="w-full" />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="font-semibold text-yellow-800 text-sm mb-2">Οδηγίες:</p>
              <ul className="text-yellow-700 text-xs space-y-1">
                <li>• Βρες το <strong>QR code</strong> στην απόδειξή σου</li>
                <li>• Σκάναρέ το με την κάμερα</li>
                <li>• Ισχύει μόνο για αποδείξεις ΤΑΚΗΣ άνω των €10</li>
                <li>• Κάθε απόδειξη μπορεί να σκαναριστεί μόνο <strong>μία φορά</strong></li>
              </ul>
            </div>
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
            <p className="text-gray-400 text-sm mt-2">Επαλήθευση μέσω ΑΑΔΕ</p>
          </div>
        )}

        {/* Needs manual amount */}
        {step === 'needsAmount' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-xl text-center mb-2">
                Βάλε το ποσό της απόδειξης
              </h3>
              <p className="text-gray-500 text-sm text-center mb-5">
                Το QR σκαναρίστηκε επιτυχώς. Βρες το σύνολο στην απόδειξή σου και πληκτρολόγησέ το.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-600">€</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="π.χ. 14.50"
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                  className="text-xl font-bold"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={reset} variant="outline" className="flex-1 rounded-2xl py-3">
                Ακύρωση
              </Button>
              <Button
                onClick={handleManualAmount}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-2xl py-3 font-bold"
              >
                Επιβεβαίωση →
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && result && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                {result.autoDetected ? 'Αναγνωρίστηκε αυτόματα' : 'Επιβεβαιωμένο ποσό'}
              </p>
              <p className="text-5xl font-black text-gray-900 my-2">€{result.amount.toFixed(2)}</p>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
                <p className="text-green-800 font-semibold">
                  Κερδίζεις κουπόνι{' '}
                  <span className="text-2xl font-black">€{result.discount}</span> έκπτωση!
                </p>
                <p className="text-green-600 text-xs mt-1">Ισχύει για 30 μέρες</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline" className="flex-1 rounded-2xl py-3">
                Ακύρωση
              </Button>
              <Button
                onClick={handleCreateCoupon}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-2xl py-3 font-bold"
              >
                Δημιούργησε Κουπόνι!
              </Button>
            </div>
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
