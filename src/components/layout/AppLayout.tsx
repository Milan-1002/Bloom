import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const tabs = [
  { path: '/home', label: 'Home', Icon: HomeIcon },
  { path: '/profile', label: 'Profile', Icon: PersonIcon },
]

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-b-border bg-b-surface pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map(({ path, label, Icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                aria-label={label}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-8 py-3 text-[11px] font-medium transition-colors',
                  active ? 'text-b-primary' : 'text-b-ink-3'
                )}
              >
                <Icon />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
