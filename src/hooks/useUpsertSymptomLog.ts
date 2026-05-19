import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface SymptomPayload {
  log_date: string
  energy: number
  mood: number
  sleep: number
  bloating: number
  skin: number
}

export function useUpsertSymptomLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SymptomPayload) => {
      // DB has check (field between 1 and 5) — coerce 0 (untouched) to null
      const n = (v: number) => (v > 0 ? v : null)
      const { error } = await supabase.from('symptom_logs').upsert(
        {
          user_id: user!.id,
          log_date: payload.log_date,
          energy: n(payload.energy),
          mood: n(payload.mood),
          sleep: n(payload.sleep),
          bloating: n(payload.bloating),
          skin: n(payload.skin),
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date' },
      )
      if (error) throw error
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['symptom-log', payload.log_date] })
    },
  })
}
