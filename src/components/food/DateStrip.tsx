import clsx from 'clsx'
import { toLocalDateStr } from '@/lib/dates'

interface DateStripProps {
  selectedDate: string
  onSelect: (date: string) => void
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getStripDates(): string[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return toLocalDateStr(d)
  })
}

export function DateStrip({ selectedDate, onSelect }: DateStripProps) {
  const today = toLocalDateStr()
  const dates = getStripDates()

  return (
    <div className="flex gap-1.5">
      {dates.map((dateStr) => {
        const d = new Date(dateStr + 'T12:00:00')
        const dayLetter = DAY_LETTERS[d.getDay()]
        const dayNum = d.getDate()
        const isToday = dateStr === today
        const isSelected = dateStr === selectedDate
        const isFuture = dateStr > today

        return (
          <button
            key={dateStr}
            onClick={() => !isFuture && onSelect(dateStr)}
            disabled={isFuture}
            aria-label={dateStr}
            aria-pressed={isSelected}
            className={clsx(
              'flex flex-1 flex-col items-center gap-0.5 rounded-b-md border py-2 transition-colors',
              isSelected
                ? 'border-transparent bg-b-primary text-b-primary-ink'
                : isFuture
                  ? 'border-b-hairline bg-b-surface text-b-ink-4 opacity-40'
                  : 'border-b-hairline bg-b-surface text-b-ink-2',
            )}
          >
            <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-70">
              {dayLetter}
            </span>
            <span className="text-[15px] font-bold tabular-nums">{dayNum}</span>
            {isToday && !isSelected && (
              <span className="h-1 w-1 rounded-full bg-b-primary" />
            )}
            {isToday && isSelected && (
              <span className="h-1 w-1 rounded-full bg-b-primary-ink/60" />
            )}
          </button>
        )
      })}
    </div>
  )
}
