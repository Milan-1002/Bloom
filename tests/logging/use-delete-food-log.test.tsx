import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase chain: from → delete → eq
const mockEq = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { useDeleteFoodLog } from '@/hooks/useDeleteFoodLog'

let queryClient: QueryClient
const invalidateSpy = vi.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  queryClient.invalidateQueries = invalidateSpy
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

beforeEach(() => {
  mockFrom.mockClear()
  mockDelete.mockClear()
  mockEq.mockClear()
  invalidateSpy.mockClear()
  mockFrom.mockReturnValue({ delete: mockDelete })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockEq.mockResolvedValue({ error: null })
})

describe('useDeleteFoodLog', () => {
  it('calls DELETE with the log id', async () => {
    const { result } = renderHook(() => useDeleteFoodLog(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('log-42')
    })
    expect(mockFrom).toHaveBeenCalledWith('food_logs')
    expect(mockEq).toHaveBeenCalledWith('id', 'log-42')
  })

  it('propagates error from supabase', async () => {
    mockEq.mockResolvedValue({ error: new Error('DB error') })
    const { result } = renderHook(() => useDeleteFoodLog(), { wrapper })
    await expect(
      act(async () => {
        await result.current.mutateAsync('log-x')
      })
    ).rejects.toThrow('DB error')
  })

  it('invalidates food-logs on success', async () => {
    const { result } = renderHook(() => useDeleteFoodLog(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('log-1')
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['food-logs'] })
  })
})
