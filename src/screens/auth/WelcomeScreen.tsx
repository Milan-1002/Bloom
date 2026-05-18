import { useNavigate } from 'react-router-dom'
import { Btn } from '@/components/ui'

function BloomMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <g fill="#fff">
        <ellipse cx="16" cy="9" rx="4" ry="6" />
        <ellipse cx="23" cy="16" rx="6" ry="4" />
        <ellipse cx="16" cy="23" rx="4" ry="6" />
        <ellipse cx="9" cy="16" rx="6" ry="4" />
        <circle cx="16" cy="16" r="3" fill="var(--b-primary)" />
      </g>
    </svg>
  )
}

export function WelcomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-b-primary">
      {/* Hero image + gradient overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=80&auto=format&fit=crop)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(31,58,77,.4) 0%, rgba(31,58,77,.6) 45%, rgba(31,58,77,.95) 85%, rgba(31,58,77,1) 100%)',
          }}
        />
      </div>

      {/* Wordmark */}
      <div className="absolute left-0 right-0 top-7 flex justify-center">
        <div className="flex items-center gap-2 text-white">
          <BloomMark size={26} />
          <span className="font-display text-[22px] tracking-wide">Bloom</span>
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 text-white">
        <h1 className="font-display text-[38px] leading-tight tracking-tight">
          Nourish your
          <br />
          <em className="opacity-90">cycle</em>, gently.
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
          A PCOS-aware nutrition companion built around your body's signals.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Btn
            tone="base"
            size="lg"
            full
            className="bg-white text-b-primary hover:bg-white/90"
            onClick={() => navigate('/signup')}
          >
            Start my journey
          </Btn>
          <button
            className="text-center text-[13px] font-semibold text-white/75"
            onClick={() => navigate('/signin')}
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  )
}
