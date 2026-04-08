'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
    toast.success('Έλεγξε το email σου για σύνδεσμο αλλαγής κωδικού')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-700 to-red-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black text-white text-center mb-2">Αλλαγή κωδικού</h1>
        <p className="text-red-200 text-sm text-center mb-8">
          Θα σου στείλουμε σύνδεσμο στο email
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="bg-white/10 border border-white/20 rounded-3xl p-8 space-y-4">
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
            <Button type="submit" disabled={loading} className="w-full bg-yellow-400 text-red-900 font-bold py-6 rounded-2xl">
              Αποστολή συνδέσμου
            </Button>
          </form>
        ) : (
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 text-center text-white">
            Έλεγξε τα εισερχόμενα (και spam).
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/login" className="text-red-200 underline text-sm">← Σύνδεση</Link>
        </p>
      </div>
    </main>
  )
}
