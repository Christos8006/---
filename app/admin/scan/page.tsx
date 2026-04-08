'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import AdminNav from '@/components/AdminNav'
import { formatDateGR } from '@/lib/coupon-logic'

type ScanState = 'idle' | 'scanning' | 'found' | 'redeeming' | 'done' | 'error'

interface CouponInfo {
  coupon: {
    id: string
    discount_amount: number
    qr_code: string
    expires_at: string
    is_redeemed: boolean
    profiles?: { name: string; surname?: string; phone?: string; member_code?: string }
  }
  valid: boolean
  reason?: string
}

export default function AdminScanPage() {
  const [state, setState] = useState<ScanState>('idle')
  const [manualCode, setManualCode] = useState('')
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null)
  const [scannerActive, setScannerActive] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<unknown>(null)

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (html5QrCodeRef.current as any).stop().catch(() => {})
      }
    }
  }, [])

  const startScanner = async () => {
    setScannerActive(true)
    setState('scanning')
    
    // Dynamically import to avoid SSR issues
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-reader')
    html5QrCodeRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop()
          setScannerActive(false)
          lookupCoupon(decodedText)
        },
        () => {}
      )
    } catch {
      setScannerActive(false)
      setState('idle')
      toast.error('Δεν ήταν δυνατή η πρόσβαση στην κάμερα')
    }
  }

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html5QrCodeRef.current as any).stop().catch(() => {})
    }
    setScannerActive(false)
    setState('idle')
  }

  const lookupCoupon = async (code: string) => {
    setState('scanning')
    const res = await fetch(`/api/coupons/redeem?qr=${encodeURIComponent(code)}`)
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error)
      setState('error')
      return
    }

    setCouponInfo(data)
    setState('found')
  }

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    lookupCoupon(manualCode.trim().toUpperCase())
  }

  const handleRedeem = async () => {
    if (!couponInfo) return
    setState('redeeming')

    const res = await fetch('/api/coupons/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: couponInfo.coupon.qr_code }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error)
      setState('error')
      return
    }

    setState('done')
    toast.success(data.message)
  }

  const reset = () => {
    setState('idle')
    setCouponInfo(null)
    setManualCode('')
  }

  return (
    <main className="min-h-screen bg-gray-900 pb-24">
      <div className="bg-gray-800 border-b border-gray-700 px-4 pt-12 pb-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-white">Σκάναρε Κουπόνι</h1>
          <p className="text-gray-400 text-sm mt-1">Σκάναρε το QR του πελάτη για εξαργύρωση</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {/* Idle state */}
        {state === 'idle' && (
          <>
            <Button
              onClick={startScanner}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-5 rounded-2xl text-lg"
            >
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Σκάναρε με Κάμερα
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-900 px-3 text-gray-500">ή</span>
              </div>
            </div>

            <form onSubmit={handleManualLookup} className="flex gap-2">
              <Input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Πληκτρολόγησε κωδικό κουπονιού"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
              />
              <Button
                type="submit"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4"
              >
                OK
              </Button>
            </form>
          </>
        )}

        {/* QR Scanner */}
        {scannerActive && (
          <div>
            <div
              id="qr-reader"
              ref={scannerRef}
              className="w-full rounded-2xl overflow-hidden"
            />
            <Button
              onClick={stopScanner}
              variant="outline"
              className="w-full mt-3 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Ακύρωση
            </Button>
          </div>
        )}

        {/* Loading */}
        {state === 'scanning' && !scannerActive && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto animate-pulse">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-400 mt-3">Αναζήτηση κουπονιού...</p>
          </div>
        )}

        {/* Found coupon */}
        {state === 'found' && couponInfo && (
          <div className="space-y-4">
            <div className={`rounded-3xl p-6 ${couponInfo.valid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${couponInfo.valid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {couponInfo.valid ? (
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-bold text-lg ${couponInfo.valid ? 'text-green-300' : 'text-red-300'}`}>
                    {couponInfo.valid ? 'Έγκυρο Κουπόνι' : 'Μη Έγκυρο'}
                  </p>
                  {!couponInfo.valid && (
                    <p className="text-red-400 text-sm">{couponInfo.reason}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Πελάτης</span>
                  <span className="text-white font-medium text-sm">
                    {[couponInfo.coupon.profiles?.name, couponInfo.coupon.profiles?.surname].filter(Boolean).join(' ') || 'Άγνωστος'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Έκπτωση</span>
                  <span className="text-yellow-400 font-black text-xl">
                    €{couponInfo.coupon.discount_amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Λήξη</span>
                  <span className="text-white text-sm">
                    {formatDateGR(couponInfo.coupon.expires_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={reset}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 rounded-2xl py-3"
              >
                Πίσω
              </Button>
              {couponInfo.valid && (
                <Button
                  onClick={handleRedeem}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl py-3"
                >
                  Εξαργύρωση ✓
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Redeeming */}
        {state === 'redeeming' && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center mx-auto animate-pulse">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-300 mt-3">Εξαργύρωση...</p>
          </div>
        )}

        {/* Done */}
        {state === 'done' && couponInfo && (
          <div className="text-center space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded-3xl p-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">Εξαργυρώθηκε!</h2>
              <p className="text-green-400 text-4xl font-black mt-2">
                -€{couponInfo.coupon.discount_amount}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {[couponInfo.coupon.profiles?.name, couponInfo.coupon.profiles?.surname].filter(Boolean).join(' ') || 'Πελάτης'} εξοικονόμησε €{couponInfo.coupon.discount_amount}
              </p>
            </div>
            <Button
              onClick={reset}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-2xl text-lg"
            >
              Επόμενο Κουπόνι
            </Button>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="text-center space-y-4">
            <div className="bg-red-900/30 border border-red-700 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Σφάλμα</h2>
            </div>
            <Button
              onClick={reset}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-2xl"
            >
              Δοκίμασε Ξανά
            </Button>
          </div>
        )}
      </div>

      <AdminNav />
    </main>
  )
}
