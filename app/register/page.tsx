'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    surname: '',
    phone: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          surname: form.surname.trim(),
          phone: form.phone.trim(),
        },
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (signErr) {
        toast.success('Έλεγξε το email για επιβεβαίωση λογαριασμού')
        router.push('/login')
        setLoading(false)
        return
      }
      toast.success('Ο λογαριασμός σου είναι έτοιμος!')
      router.push('/account')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-black text-red-700">T</span>
          </div>
          <h1 className="text-2xl font-black text-white">ΤΑΚΗΣ</h1>
          <p className="text-red-200 text-sm">Δημιούργησε λογαριασμό</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-red-100">Όνομα</Label>
              <Input
                required
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 bg-white/90"
              />
            </div>
            <div>
              <Label className="text-red-100">Επίθετο</Label>
              <Input
                required
                value={form.surname}
                onChange={e => setForm({ ...form, surname: e.target.value })}
                className="mt-1 bg-white/90"
              />
            </div>
          </div>
          <div>
            <Label className="text-red-100">Κινητό τηλέφωνο</Label>
            <Input
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="mt-1 bg-white/90"
              placeholder="π.χ. 6912345678"
            />
          </div>
          <div>
            <Label className="text-red-100">Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="mt-1 bg-white/90"
            />
          </div>
          <div>
            <Label className="text-red-100">Κωδικός</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="mt-1 bg-white/90"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold py-6 rounded-2xl text-lg"
          >
            {loading ? 'Περιμένε...' : 'Δημιουργία λογαριασμού'}
          </Button>
        </form>

        <p className="text-center text-red-200 text-sm mt-6">
          Έχεις ήδη λογαριασμό;{' '}
          <Link href="/login" className="text-white font-semibold underline">
            Σύνδεση
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-red-300 text-sm">
            ← Αρχική
          </Link>
        </p>
      </div>
    </main>
  )
}
