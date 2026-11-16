import { getMisconception } from '../data/misconceptions'
import type { ExplainResult, FinalReport, MisconceptionCode, TaskResult } from '../types'

export type { ExplainResult, FinalReport, MisconceptionCode, TaskResult }

export interface ExplainRequest {
  taskId: string
  question: string
  referenceIdea: string
  studentAnswer: string
}

const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined

function localExplanation(req: ExplainRequest): ExplainResult {
  const answer = req.studentAnswer.toLowerCase()
  const keywords = req.taskId === 'task-4'
    ? ['част', 'меньше', 'больше']
    : ['общ', 'знаменат', '5/6', '6']
  const matches = keywords.filter((keyword) => answer.includes(keyword)).length
  if (matches >= 2) {
    return {
      verdict: 'correct',
      feedback: req.taskId === 'task-4'
        ? 'Да, именно так: больше частей — меньше каждый кусочек, поэтому 1/3 больше 1/4.'
        : 'Верно: знаменатели нельзя складывать, сначала приводим дроби к общему знаменателю 6 и получаем 5/6.',
      source: 'fallback',
    }
  }
  if (matches === 1) {
    return {
      verdict: 'partial',
      feedback: req.taskId === 'task-4'
        ? 'Ты заметил важную часть. Добавь, почему при большем числе частей каждый кусочек становится меньше.'
        : 'Ты на верном пути. Объясни, почему нужен общий знаменатель 6 и что получится после сложения.',
      misconception: req.taskId === 'task-4' ? 'DENOM_BIGGER' : 'ADD_ACROSS',
      source: 'fallback',
    }
  }
  return {
    verdict: 'incorrect',
    feedback: req.taskId === 'task-4'
      ? 'Сравни не цифры снизу, а размер кусочков одной пиццы: на 3 части или на 4.'
      : 'Знаменатели показывают размер кусочков. Приведи дроби к общему знаменателю и посчитай ещё раз.',
    misconception: req.taskId === 'task-4' ? 'DENOM_BIGGER' : 'ADD_ACROSS',
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

export async function evaluateExplanation(req: ExplainRequest): Promise<ExplainResult> {
  try {
    const response = await postWithTimeout('/explain', req)
    if (!response.ok) throw new Error('AI request failed')
    return { ...(await response.json() as ExplainResult), source: 'ai' }
  } catch {
    return localExplanation(req)
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
      summary: firstTry === results.length ? 'Отличная смена! Ты уверенно управляешь дробями и объясняешь свои решения.' : `Ты выполнил смену и с каждым заказом становился увереннее. С первого раза получилось ${firstTry} из ${results.length}.`,
      strengths: firstTry >= 8 ? ['сравнение размеров кусочков', 'аккуратное сложение дробей'] : ['не сдаёшься после ошибки', 'умеешь работать с рисунком пиццы'],
      focus,
      nextSteps: unique.includes('ADD_ACROSS') ? ['Потренируй общий знаменатель на парах 1/2 и 1/3.', 'Перед сложением проверь размер кусочков.'] : ['Реши ещё несколько задач на сокращение.', 'Объясняй каждый шаг словами или рисунком.'],
      source: 'fallback',
    }
  }
}
