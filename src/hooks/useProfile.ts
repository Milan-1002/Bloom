import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('profiles')
        .select(
          'id, display_name, pcos_type, goals, age, height_cm, current_weight_kg, goal_weight_kg, palette, dark_mode, updated_at, last_period_date, cycle_length_days, period_length_days',
        )
        .eq('id', user.id)
        .single()
      return data ?? null
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })
}
