'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      toast.error('Λάθος email ή κωδικός')
      setLoading(false)
      return
    }

    router.push('/coupons')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl font-black text-red-700">T</span>
          </div>
          <h1 className="text-2xl font-black text-white">ΤΑΚΗΣ</h1>
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Σύνδεση</h2>
          <p className="text-gray-500 text-sm mb-6">Καλωσόρισες πίσω!</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Κωδικός</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
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
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Δεν έχεις λογαριασμό;{' '}
            <Link href="/register" className="text-red-700 font-semibold hover:underline">
              Εγγραφή
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
