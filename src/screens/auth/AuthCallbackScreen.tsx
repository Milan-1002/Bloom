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

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)

      // Supabase sometimes redirects back with an error (e.g. expired link, invalid token)
      const urlError = params.get('error_description') ?? params.get('error')
      if (urlError) {
        clearTimeout(timeout)
        setError(urlError.replace(/\+/g, ' '))
        return
      }

      // PKCE flow (default in supabase-js v2): verification link lands with ?code=XXXX.
      // We must exchange it for a session — without this call the SDK never fires
      // onAuthStateChange and the user sees a timeout error.
      const code = params.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          clearTimeout(timeout)
          // PKCE requires the code_verifier stored in the browser that started sign-up.
          // If the link is opened in a different browser/device the verifier is missing.
          const isPkceVerifierMissing =
            exchangeError.message.includes('code verifier') ||
            exchangeError.message.includes('code_verifier')
          setError(
            isPkceVerifierMissing
              ? 'Please open this verification link in the same browser you used to sign up, then try again.'
              : exchangeError.message,
          )
          return
        }
        // Exchange succeeded → onAuthStateChange fires below → navigate() runs there
        return
      }

      // Fallback: session already in storage (implicit flow token in hash, or re-visit)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        clearTimeout(timeout)
        navigate('/onboarding/welcome', { replace: true })
      }
    }

    // Fires after exchangeCodeForSession resolves with a valid session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        clearTimeout(timeout)
        navigate('/onboarding/welcome', { replace: true })
      }
    })

    handleCallback()

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
