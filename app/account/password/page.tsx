'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Τουλάχιστον 6 χαρακτήρες')
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
    router.push('/account')
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Νέος κωδικός</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Νέος κωδικός</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-red-700 text-white">
            Αποθήκευση
          </Button>
        </form>
        <Link href="/account" className="block text-center text-sm text-gray-500 mt-4">
          ← Πίσω
        </Link>
      </div>
    </main>
  )
}
