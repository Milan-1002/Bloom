import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RequireProfile } from '@/components/layout/RequireProfile'

const { mockUseAuth, mockUseProfile, mockUseOnboardingStore } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseProfile: vi.fn(),
  mockUseOnboardingStore: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => mockUseProfile() }))
vi.mock('@/stores/onboardingStore', () => ({
  useOnboardingStore: () => mockUseOnboardingStore(),
}))

function renderGuard(initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<RequireProfile />}>
          <Route path="/protected" element={<div>protected content</div>} />
        </Route>
        <Route path="/welcome" element={<div>welcome page</div>} />
        <Route path="/onboarding/welcome" element={<div>onboarding welcome</div>} />
        <Route path="/onboarding/profile" element={<div>onboarding profile</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOnboardingStore.mockReturnValue({ currentStep: 0 })
  })

  it('redirects to /onboarding/welcome when profile is null', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'u1' } } })
    mockUseProfile.mockReturnValue({ data: null, isLoading: false })

    renderGuard()
    await screen.findByText('onboarding welcome')
  })

  it('redirects to /onboarding/welcome when pcos_type is null', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'u1' } } })
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', pcos_type: null },
      isLoading: false,
    })

    renderGuard()
    await screen.findByText('onboarding welcome')
  })

  it('renders Outlet when profile.pcos_type is non-null', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'u1' } } })
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', pcos_type: 'confirmed' },
      isLoading: false,
    })

    renderGuard()
    await screen.findByText('protected content')
  })

  it('renders nothing while isLoading is true', () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'u1' } } })
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true })

    renderGuard()
    expect(screen.queryByText('protected content')).toBeNull()
    expect(screen.queryByText('onboarding welcome')).toBeNull()
    expect(screen.queryByText('welcome page')).toBeNull()
  })

  it('redirects to /onboarding/profile when currentStep is 1', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'u1' } } })
    mockUseProfile.mockReturnValue({ data: null, isLoading: false })
    mockUseOnboardingStore.mockReturnValue({ currentStep: 1 })

    renderGuard()
    await screen.findByText('onboarding profile')
  })
})
