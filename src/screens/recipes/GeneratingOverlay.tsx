import { useEffect, useState } from 'react'

// ── Funny food phrases that rotate while Claude thinks ───────────────────────

const PHRASES = [
  'Sprinkling turmeric on your algorithm 🌿',
  'Consulting the ancient grain scrolls 📜',
  'Teaching salmon to jump into your bowl 🐟',
  'Your hormones deserve delicious food 🌸',
  'Crunching the glycemic numbers 🥦',
  'Summoning the PCOS kitchen goddess ✨',
  'Making friends with your insulin resistance 💪',
  'Turning fridge chaos into culinary art 🎨',
  'Calculating anti-inflammatory magic 🌙',
  'Asking the nutrition wizard nicely… 🧙‍♀️',
  'Balancing your macros with love 💗',
  'Whisking together science and deliciousness 🥄',
]

// ── Component ─────────────────────────────────────────────────────────────────

export function GeneratingOverlay({ onCancel }: { onCancel: () => void }) {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % PHRASES.length)
        setFade(true)
      }, 300)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-b-bg/96 px-8">
      {/* Bouncing emoji */}
      <div
        className="text-[52px] animate-bounce"
        style={{ animationDuration: '1.2s' }}
      >
        🍳
      </div>

      {/* Rotating phrase */}
      <p
        className="mt-6 text-center text-[16px] font-bold leading-snug text-b-ink transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {PHRASES[phraseIdx]}
      </p>

      <p className="mt-2 text-[13px] text-b-ink-3">
        Creating your personalised recipe…
      </p>

      {/* Pulsing dots */}
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-b-primary animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        className="mt-10 text-[13px] font-semibold text-b-ink-3 active:opacity-70"
      >
        Cancel
      </button>
    </div>
  )
}
