import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Btn } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const RESEND_COOLDOWN = 60

export function CheckInboxScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = (location.state as { email?: string } | null)?.email ?? ''

  const [cooldown, setCooldown] = useState(0)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    setResendError(null)
    setResendSent(false)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setResendError(error.message)
      return
    }
    setResendSent(true)
    setCooldown(RESEND_COOLDOWN)
  }

  return (
    <div className="flex h-dvh flex-col items-center bg-b-bg px-6 pt-20">
      {/* Mail icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-b-surface">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--b-primary)"
          strokeWidth="1.5"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m2 7 10 7 10-7" />
        </svg>
      </div>

      <h1 className="text-center font-display text-2xl text-b-ink">Check your inbox</h1>

      <p className="mt-3 text-center text-sm leading-relaxed text-b-ink-2">
        We sent a verification link to{' '}
        <span className="font-semibold text-b-ink">{email || 'your email'}</span>.
        <br />
        Click the link to activate your account.
      </p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        {resendSent && (
          <p className="text-center text-sm text-b-primary">Verification email resent!</p>
        )}
        {resendError && (
          <p className="text-center text-sm text-red-500">{resendError}</p>
        )}

        <Btn
          tone="ghost"
          size="lg"
          full
          disabled={cooldown > 0}
          onClick={handleResend}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </Btn>

        <button
          className="w-full text-center text-sm text-b-ink-2 underline"
          onClick={() => navigate('/signup')}
        >
          Change email address
        </button>
      </div>
    </div>
  )
}
