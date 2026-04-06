'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Badge } from '@/components/ui/badge'
import { formatDateGR, daysUntilExpiry } from '@/lib/coupon-logic'

interface Coupon {
  id: string
  discount_amount: number
  qr_code: string
  created_at: string
  expires_at: string
  is_redeemed: boolean
  redeemed_at: string | null
}

interface CouponCardProps {
  coupon: Coupon
  inactive?: boolean
}

export default function CouponCard({ coupon, inactive = false }: CouponCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const days = daysUntilExpiry(coupon.expires_at)
  const isExpired = new Date(coupon.expires_at) <= new Date()

  useEffect(() => {
    if (canvasRef.current && !inactive) {
      QRCode.toCanvas(canvasRef.current, coupon.qr_code, {
        width: 160,
        margin: 1,
        color: { dark: '#7f1d1d', light: '#ffffff' },
      })
    }
  }, [coupon.qr_code, inactive])

  if (inactive) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 opacity-60 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-xl font-black text-gray-400">€{coupon.discount_amount}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-600">Κουπόνι €{coupon.discount_amount}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {coupon.is_redeemed
              ? `Χρησιμοποιήθηκε ${coupon.redeemed_at ? formatDateGR(coupon.redeemed_at) : ''}`
              : `Έληξε ${formatDateGR(coupon.expires_at)}`}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {coupon.is_redeemed ? 'Εξαργυρώθηκε' : 'Ληγμένο'}
        </Badge>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden">
      {/* Top strip */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-red-200 text-xs font-medium uppercase tracking-wide">Έκπτωση</p>
          <p className="text-white text-3xl font-black">€{coupon.discount_amount}</p>
        </div>
        <div className="text-right">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-lg">T</span>
          </div>
        </div>
      </div>

      {/* Dashed divider */}
      <div className="relative flex items-center px-4">
        <div className="absolute -left-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-100" />
        <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-3" />
        <div className="absolute -right-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-100" />
      </div>

      {/* QR Code section */}
      <div className="px-5 py-4 flex items-center gap-4">
        <canvas ref={canvasRef} className="rounded-xl" width={160} height={160} />
        <div className="flex-1 space-y-2">
          <p className="text-sm text-gray-500 font-medium">Δείξε αυτό στον ταμία</p>
          <p className="font-mono text-xs text-gray-400 break-all">{coupon.qr_code}</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            days <= 5
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {days === 0 ? 'Λήγει σήμερα!' : `Λήγει σε ${days} μέρες`}
          </div>
          <p className="text-xs text-gray-400">
            Έως {formatDateGR(coupon.expires_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
