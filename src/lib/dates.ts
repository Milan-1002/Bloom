export function toLocalDateStr(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function dateBounds(dateStr: string): { gte: string; lte: string } {
  const start = new Date(dateStr + 'T00:00:00')
  const end = new Date(dateStr + 'T23:59:59.999')
  return { gte: start.toISOString(), lte: end.toISOString() }
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
