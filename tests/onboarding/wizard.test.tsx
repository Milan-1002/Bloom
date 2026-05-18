import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnboardingProfileScreen } from '@/screens/onboarding/OnboardingProfileScreen'
import { OnboardingDoneScreen } from '@/screens/onboarding/OnboardingDoneScreen'

const { mockSetFormData, mockSetStep, mockReset, mockUseAuth, mockUpdate, mockEq } = vi.hoisted(() => {
  const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  return {
    mockSetFormData: vi.fn(),
    mockSetStep: vi.fn(),
    mockReset: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUpdate,
    mockEq,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({ update: mockUpdate }),
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))

vi.mock('@/stores/onboardingStore', () => ({
  useOnboardingStore: () => ({
    currentStep: 2,
    formData: {
      display_name: 'Maya',
      age: 28,
      height_cm: 165,
      current_weight_kg: 65,
      pcos_type: 'confirmed' as const,
      goals: ['Weight loss'],
    },
    setFormData: mockSetFormData,
    setStep: mockSetStep,
    reset: mockReset,
  }),
}))

function withProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('OnboardingProfileScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows validation error when display_name is empty on submit', async () => {
    const user = userEvent.setup()
    withProviders(<OnboardingProfileScreen />)

    await user.click(screen.getByRole('button', { name: /continue/i }))

    await screen.findByText('Name is required')
  })

  it('calls setFormData with form values on valid submit', async () => {
    const user = userEvent.setup()
    withProviders(<OnboardingProfileScreen />)

    await user.type(screen.getByLabelText(/preferred name/i), 'Maya')
    await user.type(screen.getByLabelText(/age/i), '28')
    await user.type(screen.getByLabelText(/height/i), '165')
    await user.type(screen.getByLabelText(/current weight/i), '65')

    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Maya' })
      )
    })
  })
})

describe('OnboardingDoneScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls supabase profiles update on mount', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    withProviders(<OnboardingDoneScreen />)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Maya', pcos_type: 'confirmed' })
      )
    })
  })

  it('calls reset() after successful update', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    withProviders(<OnboardingDoneScreen />)

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled()
    })
  })
})
