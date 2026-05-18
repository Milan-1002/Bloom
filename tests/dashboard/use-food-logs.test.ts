import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase chain: from → select → gte → lte → order
const mockOrder = vi.hoisted(() => vi.fn())
const mockLte = vi.hoisted(() => vi.fn())
const mockGte = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { useFoodLogs } from '@/hooks/useFoodLogs'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ gte: mockGte })
  mockGte.mockReturnValue({ lte: mockLte })
  mockLte.mockReturnValue({ order: mockOrder })
  mockOrder.mockResolvedValue({ data: [], error: null })
})

describe('useFoodLogs', () => {
  it('queries food_logs with gte/lte bounds for the given date', async () => {
    const { result } = renderHook(() => useFoodLogs('2026-05-18'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('food_logs')
    expect(mockGte).toHaveBeenCalledWith('logged_at', expect.any(String))
    expect(mockLte).toHaveBeenCalledWith('logged_at', expect.any(String))
  })

  it('returns entries from query result', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { id: '1', food_name: 'Apple', meal_slot: 'snack', serving_g: 100, kcal: 52,
          protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, sugar_g: 10, gi: 36, gl: 5,
          fdc_id: 'fdc-1', logged_at: '2026-05-18T12:00:00Z', user_id: 'u1', created_at: null },
      ],
      error: null,
    })
    const { result } = renderHook(() => useFoodLogs('2026-05-18'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].food_name).toBe('Apple')
  })
})
