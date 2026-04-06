'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Συμπλήρωσε όλα τα υποχρεωτικά πεδία')
      return
    }
    if (form.password.length < 6) {
      toast.error('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, phone: form.phone },
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      toast.error(error.message === 'User already registered'
        ? 'Αυτό το email χρησιμοποιείται ήδη'
        : error.message)
      setLoading(false)
      return
    }

    // Auto sign in after register (no email confirmation needed)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (signInError) {
      toast.success('Ο λογαριασμός δημιουργήθηκε! Συνδέσου τώρα.')
      router.push('/login')
      return
    }

    toast.success('Καλωσόρισες!')
    router.push('/coupons')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl font-black text-red-700">T</span>
          </div>
          <h1 className="text-2xl font-black text-white">ΤΑΚΗΣ</h1>
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Εγγραφή</h2>
          <p className="text-gray-500 text-sm mb-6">Δημιούργησε λογαριασμό δωρεάν</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Όνομα *</Label>
              <Input
                id="name"
                type="text"
                placeholder="π.χ. Γιώργης Παπαδόπουλος"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Τηλέφωνο (προαιρετικό)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="69XXXXXXXX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Κωδικός *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Τουλάχιστον 6 χαρακτήρες"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-base mt-2"
            >
              {loading ? 'Δημιουργία...' : 'Δημιουργία Λογαριασμού'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Έχεις ήδη λογαριασμό;{' '}
            <Link href="/login" className="text-red-700 font-semibold hover:underline">
              Σύνδεση
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
