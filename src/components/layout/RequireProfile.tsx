import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useOnboardingStore } from '@/stores/onboardingStore'

const onboardingStepRoutes = [
  '/onboarding/welcome',
  '/onboarding/profile',
  '/onboarding/pcos',
  '/onboarding/done',
]

export function RequireProfile() {
  const { session } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { currentStep } = useOnboardingStore()

  if (!session) return <Navigate to="/welcome" replace />
  if (isLoading) return null
  if (!profile || !profile.pcos_type) {
    return <Navigate to={onboardingStepRoutes[currentStep] ?? '/onboarding/welcome'} replace />
  }
  return <Outlet />
}
