import { useState, useRef } from 'react'

// ── Quick-pick suggestions ─────────────────────────────────────────────────────

const QUICK_PICKS = [
  'Eggs', 'Chicken', 'Salmon', 'Tuna', 'Sardines',
  'Spinach', 'Broccoli', 'Avocado', 'Sweet potato', 'Tomatoes',
  'Chickpeas', 'Lentils', 'Black beans', 'Quinoa', 'Oats',
  'Greek yogurt', 'Walnuts', 'Cauliflower', 'Zucchini', 'Mushrooms',
]

// ── Icon ──────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── FridgeModal ───────────────────────────────────────────────────────────────

export function FridgeModal({
  isOpen,
  onClose,
  onGenerate,
}: {
  isOpen: boolean
  onClose: () => void
  onGenerate: (ingredients: string[]) => void
}) {
  const [input, setInput] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const addIngredient = (item: string) => {
    const trimmed = item.trim()
    if (trimmed && !ingredients.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      setIngredients(prev => [...prev, trimmed])
    }
    setInput('')
    inputRef.current?.focus()
  }

  const removeIngredient = (item: string) => {
    setIngredients(prev => prev.filter(i => i !== item))
  }

  const handleGenerate = () => {
    if (ingredients.length > 0) {
      onGenerate(ingredients)
      setIngredients([])
      setInput('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full rounded-t-3xl bg-b-surface px-5 pb-safe-bottom pt-5 max-h-[88vh] overflow-y-auto">

        {/* Drag pill */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-b-hairline" />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[18px] font-bold text-b-ink">What's in your fridge? 🥦</p>
            <p className="mt-0.5 text-[13px] text-b-ink-3">
              Add ingredients you have on hand
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-b-surface-sunken text-b-ink-2 active:opacity-70"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addIngredient(input)
              }
            }}
            placeholder="Type an ingredient…"
            className="flex-1 rounded-b-pill border border-b-hairline bg-b-bg px-4 py-2.5 text-[14px] text-b-ink placeholder:text-b-ink-4 outline-none focus:border-b-primary"
          />
          <button
            onClick={() => addIngredient(input)}
            disabled={!input.trim()}
            className="rounded-b-pill bg-b-primary px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40 active:opacity-80"
          >
            Add
          </button>
        </div>

        {/* Quick picks */}
        <p className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-b-ink-3">
          Quick picks
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PICKS
            .filter(p => !ingredients.map(i => i.toLowerCase()).includes(p.toLowerCase()))
            .map(pick => (
              <button
                key={pick}
                onClick={() => addIngredient(pick)}
                className="rounded-b-pill border border-b-hairline px-3 py-1.5 text-[12px] font-semibold text-b-ink-2 active:bg-b-surface-sunken transition-colors"
              >
                + {pick}
              </button>
            ))}
        </div>

        {/* Selected ingredients */}
        {ingredients.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-b-ink-3">
              Your ingredients ({ingredients.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map(ing => (
                <button
                  key={ing}
                  onClick={() => removeIngredient(ing)}
                  className="flex items-center gap-1.5 rounded-b-pill bg-b-primary/10 px-3 py-1.5 text-[12px] font-semibold text-b-primary active:bg-b-primary/20"
                >
                  {ing}
                  <span className="text-b-primary/70"><XIcon /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate CTA */}
        <button
          onClick={handleGenerate}
          disabled={ingredients.length === 0}
          className="mt-5 w-full rounded-b-pill bg-b-primary py-3.5 text-[15px] font-bold text-white disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          Generate Recipe →
        </button>

        <p className="mt-3 mb-2 text-center text-[11px] text-b-ink-4">
          Claude AI will create a PCOS-friendly recipe from your ingredients
        </p>

      </div>
    </div>
  )
}
