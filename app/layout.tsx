import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ΤΑΚΗΣ Fast Food - Κουπόνια Επιβράβευσης',
  description: 'Σκάναρε την απόδειξή σου και κέρδισε έκπτωση στην επόμενη παραγγελία σου στο ΤΑΚΗΣ!',
}

export const viewport: Viewport = {
  themeColor: '#c0392b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body className={geist.className}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
