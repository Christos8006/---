'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Ο κωδικός άλλαξε')
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black text-white text-center mb-8">Νέος κωδικός</h1>
        <form onSubmit={handleSubmit} className="bg-white/10 border border-white/20 rounded-3xl p-8 space-y-4">
          <div>
            <Label className="text-red-100">Νέος κωδικός</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 bg-white/90"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-yellow-400 text-red-900 font-bold py-6 rounded-2xl">
            Αποθήκευση
          </Button>
        </form>
        <p className="text-center mt-6">
          <Link href="/login" className="text-red-200 underline text-sm">Σύνδεση</Link>
        </p>
      </div>
    </main>
  )
}
