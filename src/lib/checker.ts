import { getMisconception } from '../data/misconceptions'
import type { MisconceptionCode, Task } from '../types'
import { fractionEquals, parseFraction } from './fractions'

export interface CheckResult {
  correct: boolean
  misconception?: MisconceptionCode
  feedback?: string
}

function genericFeedback(task: Task, code?: CheckResult['misconception']): string {
  const misconception = getMisconception(code)
  return `${misconception.explanation} ${task.hint}`
}

export function checkChoice(task: Task, answer: string): CheckResult {
  const option = task.options?.find((item) => item.id === answer)
  if (option?.correct) return { correct: true }
  const misconception = option?.misconception ?? 'GENERIC'
  return { correct: false, misconception, feedback: option?.feedback ?? genericFeedback(task, misconception) }
}

export function checkSlice(task: Task, answer: { cuts: number; selected: number[] }): CheckResult {
  const expected = task.sliceAnswer
  if (!expected) return { correct: false, misconception: 'GENERIC', feedback: task.hint }
  if (answer.cuts !== expected.cuts) {
    return { correct: false, misconception: 'GENERIC', feedback: 'Знаменатель показывает, на сколько равных частей резать пиццу.' }
  }
  if (answer.selected.length === expected.selected) return { correct: true }
  if (task.id === 'task-3' && answer.selected.length === 2) {
    return { correct: false, misconception: 'EQUIV', feedback: '2/8 — это четверть пиццы, а тебе нужна половина. Половина от 8 кусочков — это 4 кусочка.' }
  }
  return { correct: false, misconception: 'GENERIC', feedback: `Сейчас выбрано ${answer.selected.length} кусочков. Подумай, сколько частей нужно взять.` }
}

export function checkFraction(task: Task, answer: { numerator: number; denominator: number }): CheckResult {
  const expected = task.fractionAnswer
  if (!expected || !Number.isFinite(answer.numerator) || !Number.isFinite(answer.denominator) || answer.denominator === 0) {
    return { correct: false, misconception: 'GENERIC', feedback: 'Введи числитель и знаменатель, а затем проверь размер кусочка.' }
  }
  if (fractionEquals(answer, expected)) return { correct: true }
  const typed = `${answer.numerator}/${answer.denominator}`
  const pattern = task.fractionPatterns?.find((item) => item.answer === typed)
  if (pattern) return { correct: false, misconception: pattern.misconception, feedback: genericFeedback(task, pattern.misconception) }
  if (task.baseFractions && answer.numerator === task.baseFractions[0].numerator + task.baseFractions[1].numerator && answer.denominator === task.baseFractions[0].denominator + task.baseFractions[1].denominator) {
    return { correct: false, misconception: 'ADD_ACROSS', feedback: genericFeedback(task, 'ADD_ACROSS') }
  }
  return { correct: false, misconception: 'GENERIC', feedback: `Проверь, одинакового ли размера кусочки в обеих дробях. ${task.hint}` }
}

export function checkTask(task: Task, answer: string | { cuts: number; selected: number[] } | { numerator: number; denominator: number }): CheckResult {
  if (task.type === 'choice' && typeof answer === 'string') return checkChoice(task, answer)
  if (task.type === 'slice' && typeof answer !== 'string' && 'cuts' in answer) return checkSlice(task, answer)
  if (task.type === 'fraction' && typeof answer !== 'string' && 'numerator' in answer) return checkFraction(task, answer)
  return { correct: false, misconception: 'GENERIC', feedback: task.hint }
}

export function answerToFraction(value: string): { numerator: number; denominator: number } | null {
  return parseFraction(value)
}
