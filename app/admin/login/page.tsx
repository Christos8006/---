'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminLoginPage() {
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

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      await supabase.auth.signOut()
      toast.error('Δεν έχεις δικαίωμα πρόσβασης στο admin panel')
      setLoading(false)
      return
    }

    router.push('/admin/scan')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-700 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-black text-white">T</span>
          </div>
          <h1 className="text-2xl font-black text-white">ΤΑΚΗΣ</h1>
          <p className="text-gray-400 text-sm mt-1">Πάνελ Υπαλλήλου</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Είσοδος Admin</h2>
          <p className="text-gray-400 text-sm mb-6">Μόνο για εξουσιοδοτημένο προσωπικό</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                placeholder="admin@takis.gr"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-300">Κωδικός</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-base mt-2"
            >
              {loading ? 'Σύνδεση...' : 'Είσοδος'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
