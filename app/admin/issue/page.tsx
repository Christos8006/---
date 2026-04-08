'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import AdminNav from '@/components/AdminNav'

type Step = 'scan' | 'found' | 'done'

export default function AdminIssuePage() {
  const [step, setStep] = useState<Step>('scan')
  const [manualPayload, setManualPayload] = useState('')
  const [memberLabel, setMemberLabel] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const html5QrRef = useRef<unknown>(null)

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(html5QrRef.current as any).stop().catch(() => {})
      }
    }
  }, [])

  const stopScanner = async () => {
    if (html5QrRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html5QrRef.current as any).stop().catch(() => {})
    }
    html5QrRef.current = null
    setScannerActive(false)
  }

  const startScanner = async () => {
    await stopScanner()
    setScannerActive(true)
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('issue-qr-reader')
    html5QrRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          stopScanner()
          setManualPayload(text)
          setMemberLabel(text.slice(0, 40))
          setStep('found')
        },
        () => {}
      )
    } catch {
      setScannerActive(false)
      toast.error('Δεν ήταν δυνατή η πρόσβαση στην κάμερα')
    }
  }

  const issue = async (discountAmount: 1 | 2) => {
    const res = await fetch('/api/admin/issue-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanPayload: manualPayload, discountAmount }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Σφάλμα')
      return
    }
    if (data.emailSent) {
      toast.success(`Κουπόνι €${discountAmount} — στάλθηκε email στον πελάτη`)
    } else {
      toast.warning(`Κουπόνι €${discountAmount} δημιουργήθηκε, αλλά όχι email: ${data.emailError || 'άγνωστο'}`, {
        duration: 8000,
      })
    }
    setStep('done')
  }

  const reset = () => {
    setStep('scan')
    setManualPayload('')
    setMemberLabel('')
  }

  return (
    <main className="min-h-screen bg-gray-900 pb-24">
      <div className="bg-gray-800 border-b border-gray-700 px-4 pt-12 pb-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-white">Έκδοση κουπονιού</h1>
          <p className="text-gray-400 text-sm mt-1">Σκάναρε το QR μέλους του πελάτη (από τον λογαριασμό του)</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {step === 'scan' && !scannerActive && (
          <>
            <Button
              onClick={startScanner}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-5 rounded-2xl text-lg"
            >
              Σκάναρε QR πελάτη
            </Button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-900 px-3 text-gray-500">ή</span>
              </div>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault()
                if (!manualPayload.trim()) return
                setMemberLabel(manualPayload.trim())
                setStep('found')
              }}
              className="space-y-2"
            >
              <Input
                value={manualPayload}
                onChange={e => setManualPayload(e.target.value)}
                placeholder="Επικόλλησε URL ή κωδικό μέλους"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button type="submit" className="w-full bg-gray-700 text-white">
                Συνέχεια
              </Button>
            </form>
          </>
        )}

        {scannerActive && (
          <div>
            <div id="issue-qr-reader" className="w-full rounded-2xl overflow-hidden" />
            <Button
              onClick={() => stopScanner()}
              variant="outline"
              className="w-full mt-3 border-gray-600 text-gray-300"
            >
              Ακύρωση
            </Button>
          </div>
        )}

        {step === 'found' && (
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6">
              <p className="text-gray-400 text-sm mb-2">Σκάναρισμα / κωδικός</p>
              <p className="text-white font-mono text-xs break-all">{memberLabel}</p>
              <p className="text-amber-200 text-sm mt-4">
                Παραγγελία <strong>€10–€19,99</strong> → κουπόνι <strong>€1</strong>
                <br />
                Παραγγελία <strong>€20+</strong> → κουπόνι <strong>€2</strong>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => issue(1)}
                className="bg-green-700 hover:bg-green-600 text-white font-black py-6 rounded-2xl text-lg"
              >
                Κουπόνι €1
              </Button>
              <Button
                onClick={() => issue(2)}
                className="bg-green-800 hover:bg-green-700 text-white font-black py-6 rounded-2xl text-lg"
              >
                Κουπόνι €2
              </Button>
            </div>
            <Button onClick={reset} variant="outline" className="w-full border-gray-600 text-gray-300">
              Πίσω
            </Button>
          </div>
        )}

        {step === 'done' && (
          <Button onClick={reset} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-2xl">
            Νέα έκδοση
          </Button>
        )}
      </div>

      <AdminNav />
    </main>
  )
}
