import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase chain: from → select → order → limit (useWeightLogs)
//               & from → upsert             (useLogWeight)
const mockLimit  = vi.hoisted(() => vi.fn())
const mockOrder  = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockUpsert = vi.hoisted(() => vi.fn())
const mockFrom   = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

const mockUser = { id: 'user-abc' }
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

import { rollingAverage } from '@/lib/rolling-average'
import { useWeightLogs }  from '@/hooks/useWeightLogs'
import { useLogWeight }   from '@/hooks/useLogWeight'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  mockFrom.mockClear()
  mockSelect.mockClear()
  mockOrder.mockClear()
  mockLimit.mockClear()
  mockUpsert.mockClear()

  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
  mockSelect.mockReturnValue({ order: mockOrder })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockLimit.mockResolvedValue({ data: [], error: null })
  mockUpsert.mockResolvedValue({ error: null })
})

// ── rollingAverage ────────────────────────────────────────────────────────────

describe('rollingAverage', () => {
  it('returns the single value for a 1-element array', () => {
    expect(rollingAverage([65.0], 7)).toEqual([65.0])
  })

  it('averages all available when window is larger than array', () => {
    expect(rollingAverage([60, 62, 64], 7)).toEqual([60, 61, 62])
  })

  it('applies 7-day window correctly over 10 values', () => {
    const data = [64, 64, 63, 63, 62, 62, 61, 61, 60, 60]
    const result = rollingAverage(data, 7)
    // index 6: avg of [64,64,63,63,62,62,61] = 62.71… → rounded to 62.7
    expect(result[6]).toBe(62.7)
    // index 9: avg of [63,62,62,61,61,60,60] = 61.28… → rounded to 61.3
    expect(result[9]).toBe(61.3)
  })
})

// ── useWeightLogs ─────────────────────────────────────────────────────────────

describe('useWeightLogs', () => {
  it('queries weight_logs ordered ascending with limit 30', async () => {
    const { result } = renderHook(() => useWeightLogs(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('weight_logs')
    expect(mockOrder).toHaveBeenCalledWith('log_date', { ascending: true })
    expect(mockLimit).toHaveBeenCalledWith(30)
  })

  it('returns empty array when no logs exist', async () => {
    const { result } = renderHook(() => useWeightLogs(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

// ── useLogWeight ──────────────────────────────────────────────────────────────

describe('useLogWeight', () => {
  it('calls upsert with user_id + log_date + weight_kg and onConflict', async () => {
    const { result } = renderHook(() => useLogWeight(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ log_date: '2026-05-18', weight_kg: 63.5 })
    })
    expect(mockFrom).toHaveBeenCalledWith('weight_logs')
    const [payload, opts] = mockUpsert.mock.calls[0]
    expect(payload.user_id).toBe('user-abc')
    expect(payload.log_date).toBe('2026-05-18')
    expect(payload.weight_kg).toBe(63.5)
    expect(opts.onConflict).toBe('user_id,log_date')
  })
})
