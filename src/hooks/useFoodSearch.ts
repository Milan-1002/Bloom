import { useQuery } from '@tanstack/react-query'
import { searchFoods } from '@/lib/usda'

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['usda-search', query.trim()],
    queryFn: () => searchFoods(query.trim()),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,  // 5 min — search results don't change fast
    retry: 1,
  })
}
