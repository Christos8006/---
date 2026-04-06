'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Step = 'capture' | 'confirming' | 'processing' | 'success' | 'error'

export default function ScanPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('capture')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<{ amount: number; discount: number; confidence: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      // Strip the data URL prefix to get base64 only
      const base64 = result.split(',')[1]
      setImageBase64(base64)
      setStep('confirming')
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!imageBase64) return
    setStep('processing')

    try {
      const res = await fetch('/api/receipts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Κάτι πήγε στραβά')
        setStep('error')
        return
      }

      setOcrResult(data)
      setStep('success')
    } catch {
      setErrorMsg('Σφάλμα σύνδεσης. Δοκίμασε ξανά.')
      setStep('error')
    }
  }

  const handleSubmitCoupon = async () => {
    if (!imageBase64 || !ocrResult) return

    const res = await fetch('/api/receipts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, amount: ocrResult.amount }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Αδύνατη η δημιουργία κουπονιού')
      return
    }

    toast.success(`Κουπόνι €${ocrResult.discount} δημιουργήθηκε!`)
    router.push('/coupons')
  }

  const reset = () => {
    setStep('capture')
    setImagePreview(null)
    setImageBase64(null)
    setOcrResult(null)
    setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-white">Σκάναρε Απόδειξη</h1>
          <p className="text-red-200 text-sm mt-1">Φωτογράφισε την απόδειξή σου από το ΤΑΚΗΣ</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Step: Capture */}
        {step === 'capture' && (
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-red-200 rounded-3xl p-10 text-center bg-white cursor-pointer hover:bg-red-50 transition-colors active:scale-98"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-bold text-gray-700 text-lg">Τράβηξε φωτογραφία</p>
              <p className="text-gray-400 text-sm mt-1">ή επέλεξε από τη γκαλερί</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
              <p className="font-semibold text-yellow-800 text-sm">Συμβουλές για καλύτερα αποτελέσματα:</p>
              <ul className="text-yellow-700 text-xs space-y-1">
                <li>• Βεβαιώσου ότι φαίνεται καθαρά το σύνολο</li>
                <li>• Φωτογράφισε σε καλό φωτισμό</li>
                <li>• Κράτα σταθερό το χέρι σου</li>
                <li>• Ισχύει μόνο για αποδείξεις ΤΑΚΗΣ</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Confirming */}
        {step === 'confirming' && imagePreview && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <img
                src={imagePreview}
                alt="Απόδειξη"
                className="w-full max-h-80 object-contain"
              />
            </div>
            <p className="text-center text-gray-600 text-sm">
              Φαίνεται καλά η απόδειξη; Πάτα Ανάλυση για να συνεχίσεις.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={reset}
                variant="outline"
                className="flex-1 rounded-2xl py-3"
              >
                Ξανά
              </Button>
              <Button
                onClick={handleAnalyze}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-2xl py-3 font-bold"
              >
                Ανάλυση →
              </Button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700 text-xl">Ανάλυση απόδειξης...</h3>
            <p className="text-gray-400 text-sm mt-2">Παρακαλώ περίμενε λίγα δευτερόλεπτα</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && ocrResult && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Βρέθηκε ποσό</p>
              <p className="text-5xl font-black text-gray-900 my-2">€{ocrResult.amount.toFixed(2)}</p>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
                <p className="text-green-800 font-semibold">
                  Κερδίζεις κουπόνι <span className="text-2xl font-black">€{ocrResult.discount}</span> έκπτωση!
                </p>
                <p className="text-green-600 text-xs mt-1">Ισχύει για 30 μέρες</p>
              </div>

              {ocrResult.confidence === 'low' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-3">
                  <p className="text-orange-700 text-xs">
                    Βεβαιώσου ότι το ποσό €{ocrResult.amount.toFixed(2)} είναι σωστό πριν συνεχίσεις.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={reset}
                variant="outline"
                className="flex-1 rounded-2xl py-3"
              >
                Ακύρωση
              </Button>
              <Button
                onClick={handleSubmitCoupon}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-2xl py-3 font-bold"
              >
                Δημιούργησε Κουπόνι!
              </Button>
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700 text-xl">Κάτι πήγε στραβά</h3>
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
