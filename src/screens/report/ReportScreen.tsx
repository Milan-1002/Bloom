import { useNavigate } from 'react-router-dom'
import { AppBar, IconBtn } from '@/components/ui'

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function ReportScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col bg-b-bg">
      <AppBar
        title="Health Report"
        leading={
          <IconBtn
            icon={<BackIcon />}
            ariaLabel="Go back"
            onClick={() => navigate(-1)}
          />
        }
      />
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
      </div>
    </div>
  )
}
