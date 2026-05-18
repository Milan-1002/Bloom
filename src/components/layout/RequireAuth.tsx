import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/welcome" replace />
  return <Outlet />
}
