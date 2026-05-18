import { useQuery } from '@tanstack/react-query'
import { getFoodByBarcode } from '@/lib/usda'

export function useFoodByBarcode(upc: string | null) {
  return useQuery({
    queryKey: ['barcode-food', upc],
    queryFn: () => getFoodByBarcode(upc!),
    enabled: upc !== null && upc.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  })
}
