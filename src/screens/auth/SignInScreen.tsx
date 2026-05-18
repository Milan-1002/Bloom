import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppBar, Btn } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function SignInScreen() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setServerError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <AppBar
        title="Sign in"
        leading={
          <button
            className="text-b-ink-2 active:opacity-70"
            onClick={() => navigate('/welcome')}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        }
      />

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
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-b-ink" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
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
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Btn>

          <button
            type="button"
            className="text-center text-sm text-b-ink-2 underline"
            onClick={() => navigate('/reset-password')}
          >
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  )
}
