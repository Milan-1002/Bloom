import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppBar, Btn } from '@/components/ui'
import { useOnboardingStore } from '@/stores/onboardingStore'

const schema = z.object({
  display_name: z.string().min(1, 'Name is required').max(50),
  age: z.coerce.number().int().min(13, 'Age must be 13–100').max(100, 'Age must be 13–100'),
  height_cm: z.coerce.number().min(100, 'Enter a valid height').max(250),
  current_weight_kg: z.coerce.number().min(20, 'Enter a valid weight').max(500),
  goal_weight_kg: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(20).max(500).optional()
  ),
})

function ProgressBar({ active }: { active: number }) {
  return (
    <div className="flex gap-1.5 px-5 pb-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i < active ? 'bg-b-primary' : 'bg-b-surface-sunken'}`}
        />
      ))}
    </div>
  )
}

export function OnboardingProfileScreen() {
  const navigate = useNavigate()
  const { setFormData, setStep } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onBlur' })

  const onSubmit = (data: z.infer<typeof schema>) => {
    setFormData({
      display_name: data.display_name,
      age: data.age,
      height_cm: data.height_cm,
      current_weight_kg: data.current_weight_kg,
      goal_weight_kg: data.goal_weight_kg,
    })
    setStep(2)
    navigate('/onboarding/pcos')
  }

  return (
    <form
      className="flex h-dvh flex-col bg-b-bg"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <AppBar
        title=""
        leading={
          <button
            type="button"
            className="text-b-ink-2 active:opacity-70"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        }
        trailing={
          <span className="text-xs font-bold text-b-ink-3">Step 2 of 4</span>
        }
      />
      <ProgressBar active={2} />

      <div className="flex-1 overflow-auto px-5 pb-6">
        <h1 className="font-display text-[30px] leading-tight tracking-tight text-b-ink">
          Let's get your
          <br />basics down.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-b-ink-3">
          We'll personalize targets to your body.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Preferred name" error={errors.display_name?.message}>
            <input
              type="text"
              aria-label="Preferred name"
              className="w-full bg-transparent text-base font-bold text-b-ink outline-none"
              {...register('display_name')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Age" suffix="years" error={errors.age?.message}>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Age"
                className="w-full bg-transparent text-base font-bold tabular-nums text-b-ink outline-none"
                {...register('age')}
              />
            </Field>
            <Field label="Height" suffix="cm" error={errors.height_cm?.message}>
              <input
                type="number"
                inputMode="decimal"
                aria-label="Height (cm)"
                className="w-full bg-transparent text-base font-bold tabular-nums text-b-ink outline-none"
                {...register('height_cm')}
              />
            </Field>
          </div>

          <Field label="Current weight" suffix="kg" error={errors.current_weight_kg?.message}>
            <input
              type="number"
              inputMode="decimal"
              aria-label="Current weight (kg)"
              className="w-full bg-transparent text-base font-bold tabular-nums text-b-ink outline-none"
              {...register('current_weight_kg')}
            />
          </Field>

          <Field label="Goal weight" suffix="kg" optional error={errors.goal_weight_kg?.message}>
            <input
              type="number"
              inputMode="decimal"
              aria-label="Goal weight (kg, optional)"
              className="w-full bg-transparent text-base font-bold tabular-nums text-b-ink outline-none"
              {...register('goal_weight_kg')}
            />
          </Field>
        </div>
      </div>

      <div className="shrink-0 border-t border-b-hairline bg-b-surface px-5 py-3">
        <Btn type="submit" tone="primary" size="lg" full disabled={isSubmitting}>
          Continue
        </Btn>
      </div>
    </form>
  )
}

function Field({
  label,
  suffix,
  optional,
  error,
  children,
}: {
  label: string
  suffix?: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between pb-1.5 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-b-ink-3">{label}</span>
        {optional && <span className="text-[10px] font-semibold text-b-ink-4">OPTIONAL</span>}
      </div>
      <div className="flex items-baseline gap-2 rounded-b-md border border-b-hairline bg-b-surface px-3.5 py-3">
        <div className="flex-1">{children}</div>
        {suffix && <span className="text-xs font-semibold text-b-ink-3">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
