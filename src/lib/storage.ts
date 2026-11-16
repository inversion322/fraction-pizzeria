import { tasks } from '../data/tasks'
import type { MisconceptionCode, StoredProgress, TaskResult } from '../types'

const STORAGE_KEY = 'drob-pizzeria-progress-v2'

export function loadProgress(): StoredProgress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredProgress>
    const validIds = new Set(tasks.map((task) => task.id))
    if (!parsed || typeof parsed !== 'object' || typeof parsed.started !== 'boolean') return null
    const queueIds = Array.isArray(parsed.queueIds) ? parsed.queueIds.filter((id): id is string => typeof id === 'string' && validIds.has(id)) : []
    const results = Array.isArray(parsed.results) ? parsed.results.filter(isTaskResult).filter((result) => validIds.has(result.taskId)).map((result) => ({ ...result, earnedCoins: Math.max(0, result.earnedCoins) })) : []
    const currentTaskId = typeof parsed.currentTaskId === 'string' && validIds.has(parsed.currentTaskId) ? parsed.currentTaskId : tasks[0].id
    return {
      started: parsed.started,
      currentTaskId,
      queueIds: queueIds.length ? queueIds : tasks.map((task) => task.id),
      coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) ? Math.max(0, parsed.coins) : 0,
      results,
      fresh: parsed.fresh !== false,
    }
  } catch {
    return null
  }
}

function isTaskResult(value: unknown): value is TaskResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<TaskResult>
  const earnedCoins = typeof result.earnedCoins === 'number' ? result.earnedCoins : result.correctFirstTry ? 10 : 5
  return typeof result.taskId === 'string' && typeof result.level === 'number' && result.level >= 1 && result.level <= 3 && typeof result.topic === 'string' && typeof result.correctFirstTry === 'boolean' && typeof result.attempts === 'number' && typeof result.usedHint === 'boolean' && Number.isFinite(earnedCoins) && Array.isArray(result.misconceptions) && result.misconceptions.every((code): code is MisconceptionCode => ['DENOM_BIGGER', 'ADD_ACROSS', 'NO_COMMON_DENOM', 'EQUIV', 'WHOLE_PART', 'GENERIC'].includes(code as string))
}

export function saveProgress(progress: StoredProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Progress is a convenience; the app remains usable when storage is unavailable.
  }
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}
