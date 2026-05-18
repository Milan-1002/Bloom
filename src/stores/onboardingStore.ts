import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface OnboardingFormData {
  display_name?: string
  age?: number
  height_cm?: number
  current_weight_kg?: number
  goal_weight_kg?: number
  pcos_type?: 'confirmed' | 'suspected' | 'managing'
  goals?: string[]
}

interface OnboardingState {
  currentStep: number
  formData: OnboardingFormData
  setStep: (step: number) => void
  setFormData: (data: Partial<OnboardingFormData>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      formData: {},
      setStep: (step) => set({ currentStep: step }),
      setFormData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      reset: () => set({ currentStep: 0, formData: {} }),
    }),
    {
      name: 'bloom-onboarding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
