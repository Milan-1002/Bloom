import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface LogWeightPayload {
  log_date: string
  weight_kg: number
}

export function useLogWeight() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ log_date, weight_kg }: LogWeightPayload) => {
      const { error } = await supabase.from('weight_logs').upsert(
        {
          user_id: user!.id,
          log_date,
          weight_kg,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date' },
      )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] })
    },
  })
}
