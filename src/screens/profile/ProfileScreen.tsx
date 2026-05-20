import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Avatar, Btn, Card, Chip } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { saveTheme, loadTheme } from '@/lib/theme'

type Palette = 'slate' | 'warm' | 'sage'

const PALETTE_COLORS: Record<Palette, string> = {
  slate: '#1F3A4D',
  warm: '#C16D4A',
  sage: '#4D6A47',
}

const PCOS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed diagnosis',
  suspected: 'Suspected / undiagnosed',
  managing: 'Managing symptoms',
}

export function ProfileScreen() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()

  const { palette: currentPalette, dark: currentDark } = loadTheme()
  const [palette, setPalette] = useState<Palette>(currentPalette as Palette)
  const [dark, setDark] = useState(currentDark)

  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // My Cycle state
  const [lastPeriodDate, setLastPeriodDate] = useState('')
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [cycleSaving, setCycleSaving] = useState(false)
  const [cycleSaved, setCycleSaved] = useState(false)

  // Sync cycle fields from profile
  useEffect(() => {
    if (profile) {
      setLastPeriodDate(profile.last_period_date ?? '')
      setCycleLength(profile.cycle_length_days ?? 28)
      setPeriodLength(profile.period_length_days ?? 5)
    }
  }, [profile])

  const handlePaletteChange = (p: Palette) => {
    setPalette(p)
    saveTheme(p, dark)
  }

  const handleDarkToggle = () => {
    const next = !dark
    setDark(next)
    saveTheme(palette, next)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/welcome', { replace: true })
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      setDeleteError('Type DELETE to confirm')
      return
    }
    setDeleteStep('deleting')
    setDeleteError(null)
    const { error } = await supabase.functions.invoke('delete-account')
    if (error) {
      setDeleteError(error.message)
      setDeleteStep('confirm')
      return
    }
    await signOut()
    navigate('/welcome', { replace: true })
  }

  const handleSaveCycle = async () => {
    setCycleSaving(true)
    await supabase.from('profiles').update({
      last_period_date: lastPeriodDate || null,
      cycle_length_days: cycleLength,
      period_length_days: periodLength,
      updated_at: new Date().toISOString(),
    }).eq('id', user!.id)
    setCycleSaving(false)
    setCycleSaved(true)
    setTimeout(() => setCycleSaved(false), 2000)
  }

  const displayName = profile?.display_name ?? user?.email ?? 'You'
  const bioLine = [
    profile?.age ? `${profile.age} yrs` : null,
    profile?.pcos_type ? PCOS_LABELS[profile.pcos_type] : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col bg-b-bg pb-6">
      <AppBar
        title="Profile"
        trailing={
          <button
            className="text-sm font-semibold text-b-ink-2 active:opacity-70"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        }
      />

      {/* Profile header */}
      <div className="flex items-center gap-4 border-b border-b-hairline bg-b-surface px-5 py-4">
        <Avatar name={displayName} size={64} />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-b-ink">{displayName}</p>
          {bioLine && <p className="mt-0.5 text-xs text-b-ink-3">{bioLine}</p>}
          {profile?.goals && profile.goals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.goals.slice(0, 3).map((g) => (
                <Chip key={g} tone="primary" className="text-xs">
                  {g}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5">
        {/* Theme picker */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
            Appearance
          </p>
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-b-ink">Color palette</p>
            <div className="flex gap-3">
              {(Object.keys(PALETTE_COLORS) as Palette[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePaletteChange(p)}
                  aria-label={`${p} palette`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`h-10 w-10 rounded-full transition-all ${
                      palette === p ? 'ring-2 ring-offset-2 ring-b-primary' : ''
                    }`}
                    style={{ backgroundColor: PALETTE_COLORS[p] }}
                  />
                  <span className="text-[10px] capitalize text-b-ink-3">{p}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-b-hairline pt-4">
              <p className="text-sm font-semibold text-b-ink">Dark mode</p>
              <button
                onClick={handleDarkToggle}
                aria-label="Toggle dark mode"
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  dark ? 'bg-b-primary' : 'bg-b-surface-sunken'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    dark ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* My Cycle */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
            My Cycle
          </p>
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-b-ink">Last period start date</p>
            <input
              type="date"
              value={lastPeriodDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setLastPeriodDate(e.target.value)}
              className="w-full rounded-b-md border border-b-hairline bg-b-bg px-3 py-2 text-sm text-b-ink outline-none focus:border-b-primary"
            />
            {!lastPeriodDate && (
              <p className="mt-2 text-xs text-b-ink-3">
                Add your last period date to unlock cycle-synced targets.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-b-hairline pt-4">
              <p className="text-sm font-semibold text-b-ink">Cycle length</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCycleLength((v) => Math.max(21, v - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 active:opacity-70"
                  aria-label="Decrease cycle length"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-b-ink">{cycleLength}</span>
                <button
                  onClick={() => setCycleLength((v) => Math.min(45, v + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 active:opacity-70"
                  aria-label="Increase cycle length"
                >
                  +
                </button>
                <span className="text-xs text-b-ink-3">days</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-b-hairline pt-4">
              <p className="text-sm font-semibold text-b-ink">Period length</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeriodLength((v) => Math.max(3, v - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 active:opacity-70"
                  aria-label="Decrease period length"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-b-ink">{periodLength}</span>
                <button
                  onClick={() => setPeriodLength((v) => Math.min(8, v + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 active:opacity-70"
                  aria-label="Increase period length"
                >
                  +
                </button>
                <span className="text-xs text-b-ink-3">days</span>
              </div>
            </div>

            <div className="mt-4 border-t border-b-hairline pt-4">
              <Btn
                tone="primary"
                size="md"
                full
                disabled={cycleSaving}
                onClick={handleSaveCycle}
              >
                {cycleSaved ? 'Saved ✓' : cycleSaving ? 'Saving…' : 'Save cycle info'}
              </Btn>
            </div>
          </Card>
        </div>

        {/* Danger zone */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
            Account
          </p>
          <Card className="border border-red-200 p-4">
            <p className="text-sm font-semibold text-b-ink">Delete account</p>
            <p className="mt-1 text-xs text-b-ink-3">
              Permanently deletes your account and all data. This cannot be undone.
            </p>

            {deleteStep === 'idle' && (
              <button
                className="mt-3 text-sm font-semibold text-red-500 active:opacity-70"
                onClick={() => setDeleteStep('confirm')}
              >
                Delete my account
              </button>
            )}

            {(deleteStep === 'confirm' || deleteStep === 'deleting') && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-b-ink-2">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="rounded-b-md border border-b-hairline bg-b-bg px-3 py-2 text-sm text-b-ink outline-none focus:border-red-400"
                  placeholder="DELETE"
                  disabled={deleteStep === 'deleting'}
                />
                {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    className="text-sm text-b-ink-3 active:opacity-70"
                    onClick={() => { setDeleteStep('idle'); setDeleteInput(''); setDeleteError(null) }}
                    disabled={deleteStep === 'deleting'}
                  >
                    Cancel
                  </button>
                  <button
                    className="text-sm font-semibold text-red-500 active:opacity-70 disabled:opacity-50"
                    onClick={handleDeleteAccount}
                    disabled={deleteStep === 'deleting'}
                  >
                    {deleteStep === 'deleting' ? 'Deleting…' : 'Confirm delete'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <p className="text-center text-[11px] text-b-ink-4">Bloom · v1.0.0</p>
      </div>
    </div>
  )
}
