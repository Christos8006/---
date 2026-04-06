'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: 'ΤΑΚΗΣ Admin',
    secret: '',
  })
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/admin/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setResult(JSON.stringify(data, null, 2))
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8">
          <h1 className="text-xl font-black text-white mb-1">Δημιουργία Admin</h1>
          <p className="text-gray-400 text-sm mb-6">Εφάπαξ setup λογαριασμού ταμία</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-300">Email Admin</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@takis.gr"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Κωδικός Admin</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Τουλάχιστον 6 χαρακτήρες"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Secret Key</Label>
              <Input
                type="password"
                value={form.secret}
                onChange={e => setForm({ ...form, secret: e.target.value })}
                placeholder="takis-admin-2024"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl"
            >
              {loading ? 'Δημιουργία...' : 'Δημιούργησε Admin'}
            </Button>
          </form>

          {result && (
            <div className="mt-4 bg-gray-900 rounded-xl p-4">
              <pre className="text-green-400 text-xs whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
