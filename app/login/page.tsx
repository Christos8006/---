'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      toast.error('Λάθος email ή κωδικός')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (profile?.is_admin) {
        router.push('/admin/scan')
      } else {
        router.push('/account')
      }
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">Σύνδεση</h1>
          <p className="text-red-200 text-sm mt-1">ΤΑΚΗΣ · Λάρισα</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 space-y-4">
          <div>
            <Label className="text-red-100">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 bg-white/90"
            />
          </div>
          <div>
            <Label className="text-red-100">Κωδικός</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 bg-white/90"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-yellow-400 text-red-900 font-bold py-6 rounded-2xl">
            {loading ? '...' : 'Είσοδος'}
          </Button>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-red-100 underline">
              Ξέχασες τον κωδικό;
            </Link>
          </p>
        </form>

        <p className="text-center text-red-200 text-sm mt-6">
          Δεν έχεις λογαριασμό;{' '}
          <Link href="/register" className="text-white font-semibold underline">
            Εγγραφή
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-red-300 text-sm">← Αρχική</Link>
        </p>
      </div>
    </main>
  )
}
