'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="w-full rounded-2xl py-3 text-red-700 border-red-200 hover:bg-red-50 font-semibold"
    >
      Αποσύνδεση
    </Button>
  )
}
