import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const TIMEOUT_MS = 10_000

export function AuthCallbackScreen() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setError('Verification timed out. Please try again.')
    }, TIMEOUT_MS)

    // onAuthStateChange fires after the SDK exchanges the email link token
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        clearTimeout(timeout)
        navigate('/onboarding/welcome', { replace: true })
      }
    })

    // Also check if session already exists (user re-visited the callback URL)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email_confirmed_at) {
        clearTimeout(timeout)
        navigate('/onboarding/welcome', { replace: true })
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [navigate])

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-b-bg px-6">
        <p className="text-center text-sm text-red-500">{error}</p>
        <button
          className="mt-4 text-sm text-b-primary underline"
          onClick={() => navigate('/welcome')}
        >
          Back to start
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-b-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
      <p className="mt-4 text-sm text-b-ink-2">Verifying your email…</p>
    </div>
  )
}
