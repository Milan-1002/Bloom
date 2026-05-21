import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Btn } from '@/components/ui'
import { useLogWeight } from '@/hooks/useLogWeight'
import { formatDateLabel } from '@/lib/dates'

const schema = z.object({
  weight_kg: z.number({ error: 'Enter a number' })
    .min(20, 'Weight must be at least 20 kg')
    .max(300, 'Weight must be under 300 kg'),
})

type FormValues = z.infer<typeof schema>

interface WeightEntrySheetProps {
  open: boolean
  onClose: () => void
  todayDate: string
  existingWeight?: number
}

export function WeightEntrySheet({
  open,
  onClose,
  todayDate,
  existingWeight,
}: WeightEntrySheetProps) {
  const logWeight = useLogWeight()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { weight_kg: existingWeight ?? NaN },
  })

  // Re-sync default when existingWeight changes (sheet opened for different day)
  useEffect(() => {
    reset({ weight_kg: existingWeight ?? ('' as unknown as number) })
  }, [existingWeight, reset])

  if (!open) return null

  const onSubmit = async (data: FormValues) => {
    await logWeight.mutateAsync({ log_date: todayDate, weight_kg: data.weight_kg })
    onClose()
  }

  const dayLabel = formatDateLabel(todayDate)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-b-surface pb-safe">
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-b-hairline" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-5 pt-2">
          <h3 className="text-[15px] font-bold text-b-ink">Log weight</h3>
          <p className="mt-0.5 text-[12px] text-b-ink-3">{dayLabel}</p>

          {/* Weight input */}
          <div className="my-5 flex items-baseline justify-center gap-2">
            <input
              {...register('weight_kg', { valueAsNumber: true })}
              type="number"
              step="0.1"
              min="20"
              max="300"
              placeholder="—"
              inputMode="decimal"
              className="w-32 bg-transparent text-center text-[40px] font-bold tabular-nums text-b-ink outline-none placeholder:text-b-ink-4"
            />
            <span className="text-[20px] font-semibold text-b-ink-3">kg</span>
          </div>

          {errors.weight_kg && (
            <p className="mb-3 text-center text-[12px] text-b-coral">
              {errors.weight_kg.message}
            </p>
          )}

          <Btn
            type="submit"
            tone="primary"
            size="lg"
            full
            disabled={logWeight.isPending}
          >
            {logWeight.isPending ? 'Saving…' : existingWeight ? 'Update weight' : 'Save weight'}
          </Btn>
        </form>
      </div>
    </>
  )
}
