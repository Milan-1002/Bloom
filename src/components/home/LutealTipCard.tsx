import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui'
import { LUTEAL_SWAPS } from '@/lib/cycleContent'

export function LutealTipCard({ className }: { className?: string }) {
  const navigate = useNavigate()

  return (
    <Card className={className}>
      <p className="text-[15px] font-bold text-b-ink">Luteal phase cravings incoming</p>
      <p className="mt-1 text-[12px] text-b-ink-3">
        Progesterone-driven cravings? Try these low-GL swaps:
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {LUTEAL_SWAPS.map((item) => (
          <div key={item.craving} className="flex items-center gap-2">
            <span className="w-[72px] shrink-0 text-[12px] font-semibold text-b-ink">
              {item.craving}
            </span>
            <span className="text-[11px] text-b-ink-3">→</span>
            <span className="flex-1 text-[12px] text-b-ink-2">{item.swap}</span>
            <span className="text-[10px] font-semibold text-b-mint bg-b-mint-soft rounded-full px-1.5 py-0.5">
              {item.glNote}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/recipes?phase=luteal')}
        className="mt-4 w-full rounded-b-pill border border-b-primary py-2.5 text-[13px] font-bold text-b-primary active:opacity-70"
      >
        Explore PCOS-friendly recipes →
      </button>
    </Card>
  )
}
