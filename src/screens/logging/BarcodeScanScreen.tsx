import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Html5Qrcode } from 'html5-qrcode'
import { useFoodByBarcode } from '@/hooks/useFoodByBarcode'

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type ScanStatus = 'starting' | 'scanning' | 'looking-up' | 'not-found' | 'error'

function normalizeUpc(raw: string): string {
  return raw.replace(/\D/g, '').padStart(14, '0')
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function Reticle() {
  const corner = 'absolute w-8 h-8'
  const borderW = 'border-[3px] border-white'
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[54%]"
      style={{ width: 280, height: 168 }}
    >
      {/* Corner brackets */}
      <div className={`${corner} top-0 left-0 rounded-tl-xl border-t border-l ${borderW}`} />
      <div className={`${corner} top-0 right-0 rounded-tr-xl border-t border-r ${borderW}`} />
      <div className={`${corner} bottom-0 left-0 rounded-bl-xl border-b border-l ${borderW}`} />
      <div className={`${corner} bottom-0 right-0 rounded-br-xl border-b border-r ${borderW}`} />
      {/* Scan line */}
      <div
        className="absolute left-2 right-2"
        style={{
          top: '50%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--b-coral), transparent)',
          boxShadow: '0 0 10px var(--b-coral)',
          animation: 'bloom-scan 2s ease-in-out infinite',
        }}
      />
      {/* Tip */}
      <div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white/85"
        style={{ background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)' }}
      >
        Align barcode within frame
      </div>
    </div>
  )
}

function SpinnerOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      <p className="text-[13px] font-semibold text-white/80">{label}</p>
    </div>
  )
}

function NotFoundOverlay({ onSearch, onScanAgain }: { onSearch: () => void; onScanAgain: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <div>
        <p className="text-[18px] font-bold text-white">Product not found</p>
        <p className="mt-1 text-[13px] text-white/60">This barcode isn't in our database yet.</p>
      </div>
      <button
        onClick={onSearch}
        className="w-full rounded-b-pill bg-white py-3 text-[15px] font-bold text-b-ink active:opacity-80"
      >
        Search by name
      </button>
      <button
        onClick={onScanAgain}
        className="text-[14px] font-semibold text-white/70 underline active:opacity-70"
      >
        Scan again
      </button>
    </div>
  )
}

function ErrorOverlay({ msg, onSearch }: { msg: string; onSearch: () => void }) {
  const isPermission = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="text-[18px] font-bold text-white">
          {isPermission ? 'Camera access denied' : 'Camera unavailable'}
        </p>
        <p className="mt-1 text-[13px] text-white/60">
          {isPermission
            ? 'Allow camera access in your browser settings, then try again.'
            : msg}
        </p>
      </div>
      <button
        onClick={onSearch}
        className="w-full rounded-b-pill bg-white py-3 text-[15px] font-bold text-b-ink active:opacity-80"
      >
        Search by name instead
      </button>
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function BarcodeScanScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const slot = (searchParams.get('slot') ?? 'lunch') as MealSlot

  const [status, setStatus] = useState<ScanStatus>('starting')
  const [scannedUpc, setScannedUpc] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasScannedRef = useRef(false)

  const { data: food, isFetching } = useFoodByBarcode(scannedUpc)

  // Navigate or show not-found after lookup completes
  useEffect(() => {
    if (scannedUpc === null || isFetching) return
    if (food) {
      navigate(`/log/detail/${food.fdc_id}?slot=${slot}`, { replace: true })
    } else {
      setStatus('not-found')
    }
  }, [food, isFetching, scannedUpc, navigate, slot])

  // Camera init + cleanup
  useEffect(() => {
    let mounted = true
    let isStarted = false

    const onScanSuccess = (rawText: string) => {
      if (!hasScannedRef.current) {
        hasScannedRef.current = true
        setScannedUpc(normalizeUpc(rawText))
        setStatus('looking-up')
        scannerRef.current?.stop().catch(() => {})
      }
    }

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mounted) return
      const scanner = new Html5Qrcode('barcode-reader', { verbose: false })
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 } },
          onScanSuccess,
          () => {},
        )
        .then(() => {
          isStarted = true
          if (mounted) setStatus('scanning')
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Camera unavailable'
          if (mounted) {
            setStatus('error')
            setErrorMsg(msg)
          }
        })
    })

    return () => {
      mounted = false
      const scanner = scannerRef.current
      if (scanner) {
        if (isStarted) {
          scanner.stop().catch(() => {}).finally(() => scanner.clear())
        } else {
          scanner.clear()
        }
      }
    }
  }, [])

  const goToSearch = () => navigate(`/log?slot=${slot}`)

  const handleScanAgain = () => {
    hasScannedRef.current = false
    setScannedUpc(null)
    navigate(`/log/scan?slot=${slot}`, { replace: true })
  }

  return (
    <div className="flex h-dvh flex-col" style={{ background: '#0E1620', color: 'white' }}>
      {/* Keyframe for scan line animation */}
      <style>{`
        @keyframes bloom-scan {
          0%, 100% { transform: translateY(-20px); opacity: 0.7; }
          50% { transform: translateY(20px); opacity: 1; }
        }
        #barcode-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #barcode-reader canvas { display: none !important; }
      `}</style>

      {/* Custom dark header */}
      <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="text-white active:opacity-70"
        >
          <BackArrow />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">LOGGING</div>
          <div className="truncate text-[17px] font-semibold text-white">Scan barcode</div>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {/* html5-qrcode renders video here */}
        <div id="barcode-reader" className="absolute inset-0 overflow-hidden" />

        {/* Gradient vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,rgba(14,22,32,.55) 0%,transparent 25%,transparent 70%,rgba(14,22,32,.8) 100%)',
          }}
        />

        {/* Reticle — only during active scanning */}
        {status === 'scanning' && <Reticle />}

        {/* Status overlays */}
        {(status === 'starting' || status === 'looking-up') && (
          <SpinnerOverlay
            label={status === 'starting' ? 'Initializing camera…' : 'Looking up product…'}
          />
        )}
        {status === 'not-found' && (
          <NotFoundOverlay onSearch={goToSearch} onScanAgain={handleScanAgain} />
        )}
        {status === 'error' && (
          <ErrorOverlay msg={errorMsg} onSearch={goToSearch} />
        )}
      </div>

      {/* Bottom strip — always visible (first-class manual fallback) */}
      <div
        className="shrink-0 px-5 py-4 pb-safe"
        style={{ background: 'rgba(14,22,32,0.85)' }}
      >
        <button
          onClick={goToSearch}
          className="w-full text-center text-[14px] font-semibold text-white/60 underline underline-offset-2 active:opacity-70"
        >
          Search by name instead
        </button>
      </div>
    </div>
  )
}
