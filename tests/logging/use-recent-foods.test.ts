import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase chain: from → select → order → limit
const mockLimit = vi.hoisted(() => vi.fn())
const mockOrder = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { deduplicateByFdcId, useRecentFoods } from '@/hooks/useRecentFoods'
import type { Tables } from '@/lib/database.types'

type FoodLog = Tables<'food_logs'>

function makeLog(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'id-1', fdc_id: 'fdc-1', food_name: 'Apple', serving_g: 100,
    meal_slot: 'snack', logged_at: '2026-05-18T12:00:00Z', kcal: 52,
    protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, sugar_g: 10,
    gi: 36, gl: 5, created_at: null,
    ...overrides,
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ order: mockOrder })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockLimit.mockResolvedValue({ data: [], error: null })
})

// ── Pure function tests ──────────────────────────────────────────────────────

describe('deduplicateByFdcId', () => {
  it('keeps first occurrence (most recent) when fdc_id is repeated', () => {
    const logs = [
      makeLog({ id: '1', fdc_id: 'a', serving_g: 100 }),
      makeLog({ id: '2', fdc_id: 'b', serving_g: 150 }),
      makeLog({ id: '3', fdc_id: 'a', serving_g: 80 }),
    ]
    const result = deduplicateByFdcId(logs, 20)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('2')
  })

  it('limits output to N items', () => {
    const logs = Array.from({ length: 25 }, (_, i) =>
      makeLog({ id: String(i), fdc_id: `food-${i}` })
    )
    expect(deduplicateByFdcId(logs, 20)).toHaveLength(20)
  })

  it('filters out entries with null fdc_id', () => {
    const logs = [
      makeLog({ id: '1', fdc_id: null }),
      makeLog({ id: '2', fdc_id: 'b' }),
    ]
    const result = deduplicateByFdcId(logs, 20)
    expect(result).toHaveLength(1)
    expect(result[0].fdc_id).toBe('b')
  })
})

// ── Hook test ────────────────────────────────────────────────────────────────

describe('useRecentFoods', () => {
  it('returns deduplicated foods from food_logs query', async () => {
    mockLimit.mockResolvedValue({
      data: [
        makeLog({ id: '1', fdc_id: 'a' }),
        makeLog({ id: '2', fdc_id: 'a', serving_g: 80 }),
      ],
      error: null,
    })
    const { result } = renderHook(() => useRecentFoods(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('1')
  })
})
