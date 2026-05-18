import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const mockGetFoodByBarcode = vi.hoisted(() => vi.fn())
vi.mock('@/lib/usda', () => ({
  getFoodByBarcode: mockGetFoodByBarcode,
}))

import { useFoodByBarcode } from '@/hooks/useFoodByBarcode'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useFoodByBarcode', () => {
  it('does not call getFoodByBarcode when upc is null', () => {
    renderHook(() => useFoodByBarcode(null), { wrapper })
    expect(mockGetFoodByBarcode).not.toHaveBeenCalled()
  })

  it('calls getFoodByBarcode with the provided upc and returns the food', async () => {
    const mockFood = { fdc_id: 'fdc-1', description: 'Greek Yogurt', gtin_upc: '00012345678901' }
    mockGetFoodByBarcode.mockResolvedValue(mockFood)
    const { result } = renderHook(() => useFoodByBarcode('00012345678901'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetFoodByBarcode).toHaveBeenCalledWith('00012345678901')
    expect(result.current.data?.fdc_id).toBe('fdc-1')
  })

  it('returns null when barcode not found in cache (cache miss)', async () => {
    mockGetFoodByBarcode.mockResolvedValue(null)
    const { result } = renderHook(() => useFoodByBarcode('00099999999999'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
