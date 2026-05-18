import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Btn, Chip } from '@/components/ui'
import { useOnboardingStore } from '@/stores/onboardingStore'

type PcosType = 'confirmed' | 'suspected' | 'managing'

const PCOS_OPTIONS: { value: PcosType; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed diagnosis' },
  { value: 'suspected', label: 'Suspected / undiagnosed' },
  { value: 'managing', label: 'Managing symptoms' },
]

const GOALS = [
  'Weight loss',
  'Steady energy',
  'Fewer cravings',
  'Clearer skin',
  'Regular cycle',
  'Fertility',
  'Mood',
]

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

export function OnboardingPCOSScreen() {
  const navigate = useNavigate()
  const { setFormData, setStep } = useOnboardingStore()

  const [pcosType, setPcosType] = useState<PcosType | null>(null)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [showError, setShowError] = useState(false)

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  const handleContinue = () => {
    if (!pcosType) {
      setShowError(true)
      return
    }
    setFormData({ pcos_type: pcosType, goals: selectedGoals })
    setStep(3)
    navigate('/onboarding/done')
  }

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <AppBar
        title=""
        leading={
          <button
            className="text-b-ink-2 active:opacity-70"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        }
        trailing={<span className="text-xs font-bold text-b-ink-3">Step 3 of 4</span>}
      />
      <ProgressBar active={3} />

      <div className="flex-1 overflow-auto px-5 pb-6">
        <h1 className="font-display text-[30px] leading-tight tracking-tight text-b-ink">
          Tell us about
          <br />your PCOS.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-b-ink-3">
          This helps us calibrate your targets accurately.
        </p>

        {/* PCOS type */}
        <div className="mt-6">
          <p className="pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-b-ink-3">
            PCOS Diagnosis
          </p>
          <div className="flex flex-col gap-2">
            {PCOS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setPcosType(value); setShowError(false) }}
                className={`rounded-b-md border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  pcosType === value
                    ? 'border-b-primary bg-b-primary text-white'
                    : 'border-b-hairline bg-b-surface text-b-ink-2'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {showError && (
            <p className="mt-1.5 text-xs text-red-500">Please select your PCOS diagnosis type</p>
          )}
        </div>

        {/* Goals */}
        <div className="mt-6">
          <p className="pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-b-ink-3">
            What matters most? <span className="normal-case font-normal text-b-ink-4">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => {
              const active = selectedGoals.includes(goal)
              return (
                <Chip
                  key={goal}
                  tone={active ? 'primary' : 'ghost'}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </Chip>
              )
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-b-hairline bg-b-surface px-5 py-3">
        <Btn tone="primary" size="lg" full onClick={handleContinue}>
          Continue
        </Btn>
      </div>
    </div>
  )
}
