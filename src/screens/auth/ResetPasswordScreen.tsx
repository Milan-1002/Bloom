import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppBar, Btn } from '@/components/ui'
import { supabase } from '@/lib/supabase'

// Supabase puts access_token in the URL hash after the reset link is clicked
const isTokenMode = () => window.location.hash.includes('access_token')

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type EmailValues = z.infer<typeof emailSchema>
type PasswordValues = z.infer<typeof passwordSchema>

function RequestResetForm() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({ resolver: zodResolver(emailSchema) })

  const onSubmit = async ({ email }: EmailValues) => {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center px-6 pt-12">
        <p className="text-center text-sm leading-relaxed text-b-ink-2">
          Check your inbox for a password reset link.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-b-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="rounded-b-md border border-b-border bg-b-surface px-4 py-3 text-b-ink outline-none focus:border-b-primary"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {serverError && (
          <p className="rounded-b-sm bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}

        <Btn type="submit" tone="primary" size="lg" full disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Btn>
      </form>
    </div>
  )
}

function UpdatePasswordForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  const onSubmit = async ({ password }: PasswordValues) => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setServerError(error.message)
      return
    }
    navigate('/signin')
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-b-ink" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="rounded-b-md border border-b-border bg-b-surface px-4 py-3 text-b-ink outline-none focus:border-b-primary"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-b-sm bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}

        <Btn type="submit" tone="primary" size="lg" full disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Set new password'}
        </Btn>
      </form>
    </div>
  )
}

export function ResetPasswordScreen() {
  const navigate = useNavigate()
  const tokenMode = isTokenMode()

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <AppBar
        title={tokenMode ? 'Set new password' : 'Reset password'}
        leading={
          <button
            className="text-b-ink-2 active:opacity-70"
            onClick={() => navigate('/signin')}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        }
      />
      {tokenMode ? <UpdatePasswordForm /> : <RequestResetForm />}
    </div>
  )
}
