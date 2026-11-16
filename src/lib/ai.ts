import { getMisconception } from '../data/misconceptions'
import type { FinalReport, MisconceptionCode, PuzzleReview, TaskResult } from '../types'

export type { FinalReport, MisconceptionCode, PuzzleReview, TaskResult }

const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined

export interface PuzzleReviewRequest {
  taskId: string
  puzzle: 'order' | 'whole' | 'boxes'
  task: string        // what the student was asked to do
  mistakes: number
  moves: string[]     // the student's moves in plain words
  misconceptions: MisconceptionCode[]
}

const TOPIC_TIP: Record<PuzzleReviewRequest['puzzle'], string> = {
  order: 'Помни: чем на большее число частей режут пиццу, тем меньше каждый кусок.',
  whole: 'Перед сложением приводи куски к одному размеру — к общему знаменателю.',
  boxes: 'Сокращай дробь, деля числитель и знаменатель на одно число, а смешанное число переводи в неправильную дробь.',
}

/** Local review when the AI is unavailable: still names what went wrong. */
function localReview(req: PuzzleReviewRequest): PuzzleReview {
  if (req.mistakes === 0) {
    const tip = TOPIC_TIP[req.puzzle].replace('Помни: ', '')
    return { feedback: `Без единой ошибки — шеф доволен! ${tip[0].toUpperCase()}${tip.slice(1)}`, source: 'fallback' }
  }
  const lastSlip = req.moves.filter((move) => move.startsWith('ошибка')).slice(-1)[0]
  return {
    feedback: `${lastSlip ? `Была заминка: ${lastSlip.replace(/^ошибка: /, '').replace(/^(первая|вторая) попытка: /, '')}. ` : ''}${TOPIC_TIP[req.puzzle]}`,
    misconception: req.misconceptions[0],
    source: 'fallback',
  }
}

async function postWithTimeout(path: string, body: unknown): Promise<Response> {
  if (!endpoint) throw new Error('AI endpoint is not configured')
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  try {
    return await fetch(`${endpoint.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

/** The AI chef looks at how the puzzle was solved and comments on it. */
export async function reviewPuzzle(req: PuzzleReviewRequest): Promise<PuzzleReview> {
  try {
    const response = await postWithTimeout('/puzzle', req)
    if (!response.ok) throw new Error('AI request failed')
    return { ...(await response.json() as PuzzleReview), source: 'ai' }
  } catch {
    return localReview(req)
  }
}

export async function getFinalReport(results: TaskResult[]): Promise<FinalReport> {
  try {
    const response = await postWithTimeout('/report', results)
    if (!response.ok) throw new Error('AI request failed')
    return { ...(await response.json() as FinalReport), source: 'ai' }
  } catch {
    const firstTry = results.filter((result) => result.correctFirstTry).length
    const mistakes = results.flatMap((result) => result.misconceptions).filter((code) => code !== 'GENERIC')
    const unique = [...new Set(mistakes)]
    const focus = unique.length ? unique.slice(0, 2).map((code) => getMisconception(code).name) : ['смешанные числа и общий знаменатель']
    return {
      summary: firstTry === results.length ? 'Отличная смена! Ты уверенно сравниваешь, складываешь и сокращаешь дроби.' : `Смена выполнена, и с каждым заказом получалось увереннее. С первого раза получилось ${firstTry} из ${results.length}.`,
      strengths: firstTry >= 8 ? ['сравнение размеров кусочков', 'аккуратное сложение дробей'] : ['не сдаёшься после ошибки', 'умеешь работать с рисунком пиццы'],
      focus,
      nextSteps: unique.includes('ADD_ACROSS') ? ['Потренируй общий знаменатель на парах 1/2 и 1/3.', 'Перед сложением проверь размер кусочков.'] : ['Реши ещё несколько задач на сокращение.', 'Проверяй ответ рисунком пиццы.'],
      source: 'fallback',
    }
  }
}

// ---------- Chef chat (after a finished shift) ----------
export type TutorEvent = 'start' | 'correct' | 'almost' | 'wrong' | 'reveal' | 'question' | 'next'

export interface TutorTurnRequest {
  event: TutorEvent
  /** Summary of the last finished shift: what the student struggled with. */
  shift: { firstTry: number; total: number; weakTopics: string[]; misconceptions: string[]; previousFirstTry?: number }
  /** The task on the board. The answer is sent so the chef can explain — the AI must not reveal it on 'wrong'/'almost'. */
  task?: { text: string; topic: string; level: number; answer: string; hint: string; solution: string }
  studentMessage?: string
  history: Array<{ role: 'chef' | 'student'; text: string }>
  /** What the chef would say without AI; the model may rephrase it but must keep its meaning. */
  fallback: string
}

/** One chef reply. Falls back to the locally composed text when the AI is unavailable. */
export async function tutorTurn(req: TutorTurnRequest): Promise<{ reply: string; source: 'ai' | 'fallback' }> {
  if (!endpoint) return { reply: req.fallback, source: 'fallback' }
  try {
    const response = await postWithTimeout('/chat', req)
    if (!response.ok) throw new Error('AI request failed')
    const data = await response.json() as { reply?: string }
    if (!data.reply?.trim()) throw new Error('Empty reply')
    return { reply: data.reply.trim(), source: 'ai' }
  } catch {
    return { reply: req.fallback, source: 'fallback' }
  }
}
