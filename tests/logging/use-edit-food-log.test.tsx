import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase chain: from → update → eq
const mockEq = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { useEditFoodLog } from '@/hooks/useEditFoodLog'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

const baseEntry = {
  serving_g: 100,
  kcal: 89,
  protein_g: 1.1,
  carbs_g: 23.0,
  fat_g: 0.3,
  fiber_g: 2.6,
  sugar_g: 12.0,
  food_name: 'Banana',
}

beforeEach(() => {
  mockFrom.mockClear()
  mockUpdate.mockClear()
  mockEq.mockClear()
  mockFrom.mockReturnValue({ update: mockUpdate })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockEq.mockResolvedValue({ error: null })
})

describe('useEditFoodLog', () => {
  it('calls UPDATE with proportionally recalculated macros', async () => {
    const { result } = renderHook(() => useEditFoodLog(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        id: 'log-1',
        entry: baseEntry,
        newServingG: 200,
        newSlot: 'breakfast',
      })
    })
    expect(mockFrom).toHaveBeenCalledWith('food_logs')
    const payload = mockUpdate.mock.calls[0][0]
    expect(payload.serving_g).toBe(200)
    expect(payload.meal_slot).toBe('breakfast')
    expect(payload.kcal).toBe(178)        // 89 × 2
    expect(payload.protein_g).toBe(2.2)   // 1.1 × 2
    expect(payload.carbs_g).toBe(46)      // 23 × 2
    expect(payload.fat_g).toBe(0.6)       // 0.3 × 2
    expect(payload.fiber_g).toBe(5.2)     // 2.6 × 2
    expect(payload.sugar_g).toBe(24)      // 12 × 2
    expect(mockEq).toHaveBeenCalledWith('id', 'log-1')
  })

  it('propagates error from supabase', async () => {
    mockEq.mockResolvedValue({ error: new Error('DB error') })
    const { result } = renderHook(() => useEditFoodLog(), { wrapper })
    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: 'log-x',
          entry: baseEntry,
          newServingG: 100,
          newSlot: 'lunch',
        })
      })
    ).rejects.toThrow('DB error')
  })
})
