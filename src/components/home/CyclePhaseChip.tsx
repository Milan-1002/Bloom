import { useState } from 'react'
import type { CyclePhaseResult } from '@/lib/cycle'
import { PHASE_CONTENT } from '@/lib/cycleContent'

interface CyclePhaseChipProps {
  result: CyclePhaseResult
  className?: string
}

export function CyclePhaseChip({ result, className }: CyclePhaseChipProps) {
  const [open, setOpen] = useState(false)
  const content = PHASE_CONTENT[result.phase]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full border border-b-hairline bg-b-surface px-3 py-1 text-[11px] font-semibold text-b-ink-2 active:opacity-70 ${className ?? ''}`}
      >
        {content.title} · Day {result.cycleDay}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-screen-sm mx-auto bg-b-surface rounded-t-2xl px-5 pt-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag indicator */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-b-surface-sunken" />

            <h2 className="text-[17px] font-bold text-b-ink">{content.title}</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-b-ink-2">{content.explanation}</p>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full py-3 rounded-b-pill bg-b-primary text-b-primary-ink text-[14px] font-bold active:opacity-80"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
