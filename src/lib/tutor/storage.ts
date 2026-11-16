import type { TaskResult } from '../../types'
import type { ShiftSnapshot, TutorState } from './engine'
import type { TutorTask } from './generator'

/** One line of the chat. Task cards are structured so fractions and pizzas render properly. */
export type ChatMessage =
  | { id: string; kind: 'chef'; text: string }
  | { id: string; kind: 'student'; text: string; verdict?: 'correct' | 'almost' | 'wrong' }
  | { id: string; kind: 'task'; task: TutorTask; number: number }

export interface TutorStore {
  shifts: ShiftSnapshot[]          // newest last, at most 5
  chat: { state: TutorState; messages: ChatMessage[] } | null
}

const KEY = 'drob-pizzeria-tutor-v1'
const EMPTY: TutorStore = { shifts: [], chat: null }

export function loadTutor(): TutorStore {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<TutorStore>
    return { shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [], chat: parsed.chat && Array.isArray(parsed.chat.messages) ? parsed.chat : null }
  } catch {
    return EMPTY
  }
}

export function saveTutor(store: TutorStore): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* storage is optional */ }
}

/** Records a fully finished shift; the chat will start over around it. */
export function recordShift(store: TutorStore, results: TaskResult[], coins: number): TutorStore {
  // The same finished shift must never be recorded twice (effects can re-run).
  const last = store.shifts[store.shifts.length - 1]
  if (last && Date.now() - Date.parse(last.finishedAt) < 10_000 && JSON.stringify(last.results) === JSON.stringify(results)) return store
  const shift: ShiftSnapshot = {
    id: `shift-${Date.now()}`,
    finishedAt: new Date().toISOString(),
    firstTry: results.filter((r) => r.correctFirstTry).length,
    total: results.length,
    coins,
    results,
  }
  return { shifts: [...store.shifts, shift].slice(-5), chat: null }
}

let counter = 0
export const messageId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`
