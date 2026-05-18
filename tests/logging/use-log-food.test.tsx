import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const mockInsert = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

const mockUser = { id: 'user-abc' }
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

import { useLogFood } from '@/hooks/useLogFood'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  mockFrom.mockClear()
  mockInsert.mockClear()
  mockFrom.mockReturnValue({ insert: mockInsert })
  mockInsert.mockReturnValue({ error: null })
})

describe('useLogFood', () => {
  it('calls supabase INSERT with denormalized macros and correct user_id', async () => {
    const { result } = renderHook(() => useLogFood(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        fdc_id: 'fdc-1',
        food_name: 'Brown Rice',
        meal_slot: 'lunch',
        serving_g: 150,
        kcal: 165,
        protein_g: 3.8,
        carbs_g: 34.5,
        fat_g: 1.3,
        fiber_g: 1.8,
        sugar_g: 0.2,
        gi: 68,
        gl: 23.5,
      })
    })
    expect(mockFrom).toHaveBeenCalledWith('food_logs')
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.user_id).toBe('user-abc')
    expect(payload.fdc_id).toBe('fdc-1')
    expect(payload.serving_g).toBe(150)
    expect(payload.meal_slot).toBe('lunch')
    expect(payload.gl).toBe(23.5)
    expect(payload.gi).toBe(68)
    expect(typeof payload.logged_at).toBe('string')
  })

  it('stores gl as null (not 0) when GI is unknown', async () => {
    const { result } = renderHook(() => useLogFood(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        fdc_id: 'fdc-2',
        food_name: 'Mystery food',
        meal_slot: 'snack',
        serving_g: 100,
        kcal: 200,
        protein_g: 5,
        carbs_g: 30,
        fat_g: 8,
        fiber_g: 1,
        sugar_g: null,
        gi: null,
        gl: null,
      })
    })
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.gi).toBeNull()
    expect(payload.gl).toBeNull()
  })

  it('throws when supabase returns an error', async () => {
    mockInsert.mockReturnValue({ error: new Error('DB error') })
    const { result } = renderHook(() => useLogFood(), { wrapper })
    await expect(
      act(async () => {
        await result.current.mutateAsync({
          fdc_id: 'fdc-3',
          food_name: 'X',
          meal_slot: 'breakfast',
          serving_g: 100,
          kcal: null,
          protein_g: null,
          carbs_g: null,
          fat_g: null,
          fiber_g: null,
          sugar_g: null,
          gi: null,
          gl: null,
        })
      })
    ).rejects.toThrow('DB error')
  })
})
