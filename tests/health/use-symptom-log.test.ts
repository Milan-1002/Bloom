import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// useSymptomLog chain: from → select → eq → maybeSingle
const mockMaybySingle = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
// useUpsertSymptomLog chain: from → upsert
const mockUpsert = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

const mockUser = { id: 'user-abc' }
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

import { useSymptomLog } from '@/hooks/useSymptomLog'
import { useUpsertSymptomLog } from '@/hooks/useUpsertSymptomLog'

const invalidateSpy = vi.fn()

function makeWrapper(invalidate = invalidateSpy) {
  return function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    qc.invalidateQueries = invalidate
    return createElement(QueryClientProvider, { client: qc }, children)
  }
}

const wrapper = makeWrapper()

const SAVED_ROW = {
  id: 'sym-1', user_id: 'user-abc', log_date: '2026-05-18',
  logged_at: '2026-05-18T10:00:00Z', created_at: null,
  energy: 4, mood: 3, sleep: 3, bloating: 2, skin: 1,
}

const PAYLOAD = { log_date: '2026-05-18', energy: 4, mood: 5, sleep: 3, bloating: 2, skin: 1 }

beforeEach(() => {
  mockFrom.mockClear()
  mockSelect.mockClear()
  mockEq.mockClear()
  mockMaybySingle.mockClear()
  mockUpsert.mockClear()
  invalidateSpy.mockClear()

  // Default: query chain returns null
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ maybeSingle: mockMaybySingle })
  mockMaybySingle.mockResolvedValue({ data: null, error: null })
  mockUpsert.mockResolvedValue({ error: null })
})

// ── useSymptomLog ────────────────────────────────────────────────────────────

describe('useSymptomLog', () => {
  it('queries symptom_logs by log_date and returns the row', async () => {
    mockMaybySingle.mockResolvedValue({ data: SAVED_ROW, error: null })
    const { result } = renderHook(() => useSymptomLog('2026-05-18'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('symptom_logs')
    expect(mockEq).toHaveBeenCalledWith('log_date', '2026-05-18')
    expect(result.current.data?.energy).toBe(4)
  })

  it('returns null when no entry exists for the date', async () => {
    const { result } = renderHook(() => useSymptomLog('2026-05-17'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})

// ── useUpsertSymptomLog ──────────────────────────────────────────────────────

describe('useUpsertSymptomLog', () => {
  it('calls upsert with all 5 symptoms + user_id + log_date + onConflict', async () => {
    const { result } = renderHook(() => useUpsertSymptomLog(), { wrapper })
    await act(async () => { await result.current.mutateAsync(PAYLOAD) })
    expect(mockFrom).toHaveBeenCalledWith('symptom_logs')
    const [payload, opts] = mockUpsert.mock.calls[0]
    expect(payload.user_id).toBe('user-abc')
    expect(payload.log_date).toBe('2026-05-18')
    expect(payload.energy).toBe(4)
    expect(payload.mood).toBe(5)
    expect(payload.bloating).toBe(2)
    expect(opts.onConflict).toBe('user_id,log_date')
  })

  it('invalidates [symptom-log, dateStr] on success', async () => {
    const { result } = renderHook(() => useUpsertSymptomLog(), { wrapper })
    await act(async () => { await result.current.mutateAsync(PAYLOAD) })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['symptom-log', '2026-05-18'] })
  })

  it('propagates error from supabase', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('DB error') })
    const { result } = renderHook(() => useUpsertSymptomLog(), { wrapper })
    await expect(
      act(async () => { await result.current.mutateAsync(PAYLOAD) })
    ).rejects.toThrow('DB error')
  })
})
