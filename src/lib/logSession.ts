/**
 * Lightweight sessionStorage helper for the multi-food logging flow.
 *
 * A "log session" begins when the user picks a meal slot and ends when they
 * tap "Done". Items are appended as each food is confirmed in FoodDetailScreen.
 * The session survives the Search → Detail → back navigation cycle because
 * both screens run in the same browser tab (sessionStorage persists across
 * React-Router navigations within a tab).
 */

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface LogSessionItem {
  food_name: string
  serving_g: number
  kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  gl: number | null
}

export interface LogSession {
  slot: MealSlot
  items: LogSessionItem[]
}

const KEY = 'bloom_log_session'

export function getLogSession(): LogSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LogSession) : null
  } catch {
    return null
  }
}

export function startLogSession(slot: MealSlot): LogSession {
  const session: LogSession = { slot, items: [] }
  sessionStorage.setItem(KEY, JSON.stringify(session))
  return session
}

/** Append one confirmed food to the running session. No-op if no session exists. */
export function appendLogSessionItem(item: LogSessionItem): void {
  const session = getLogSession()
  if (!session) return
  session.items.push(item)
  sessionStorage.setItem(KEY, JSON.stringify(session))
}

export function clearLogSession(): void {
  sessionStorage.removeItem(KEY)
}
