import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useOnboardingStore } from '@/stores/onboardingStore'

function ProgressBar({ active }: { active: number }) {
  return (
    <div className="flex gap-1.5 px-5 pb-4 pt-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i < active ? 'bg-b-primary' : 'bg-b-surface-sunken'}`}
        />
      ))}
    </div>
  )
}

export function OnboardingDoneScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { formData, reset } = useOnboardingStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const save = async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          age: formData.age,
          height_cm: formData.height_cm,
          current_weight_kg: formData.current_weight_kg,
          goal_weight_kg: formData.goal_weight_kg ?? null,
          pcos_type: formData.pcos_type,
          goals: formData.goals ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        setError(error.message)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['profile'] })
      reset()
      navigate('/home', { replace: true })
    }

    save()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-b-bg px-6">
        <p className="text-center text-sm text-red-500">{error}</p>
        <button
          className="mt-4 text-sm text-b-primary underline"
          onClick={() => { setError(null); navigate(0) }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <div className="pt-14">
        <ProgressBar active={4} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-b-primary/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--b-primary)" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-display text-3xl text-b-ink">You're all set!</h1>
        <p className="mt-3 text-sm text-b-ink-2">Setting up your personalized plan…</p>
        <div className="mt-6 h-5 w-5 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
      </div>
    </div>
  )
}
