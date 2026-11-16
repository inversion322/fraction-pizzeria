import type { FractionValue, MisconceptionCode, TaskResult } from '../../types'
import { getMisconception } from '../../data/misconceptions'
import { compareFractions, gcd, reduceFraction } from '../fractions'
import { asMixed, generateTask, MAX_LEVEL, TOPICS, type TopicId, type TutorTask } from './generator'

// ---------- the finished shift the chat is based on ----------
export interface ShiftSnapshot {
  id: string
  finishedAt: string
  firstTry: number
  total: number
  coins: number
  results: TaskResult[]
}

export interface TopicState {
  id: TopicId
  mistakes: number   // mistakes in the shift for this topic
  level: number      // 1..5, grows with every correct answer
  solved: number
  missed: number
  mastered: boolean
}

export interface TutorState {
  shiftId: string
  topics: TopicState[]
  current: TutorTask | null
  attempts: number
  asked: string[]
  taskCount: number
}

const MISCONCEPTION_TOPIC: Partial<Record<MisconceptionCode, TopicId>> = {
  DENOM_BIGGER: 'compare', EQUIV: 'equiv', ADD_ACROSS: 'add', NO_COMMON_DENOM: 'add', WHOLE_PART: 'mixed',
}

function topicOfResult(result: TaskResult): TopicId {
  const fromCode = result.misconceptions.map((code) => MISCONCEPTION_TOPIC[code]).find(Boolean)
  if (fromCode) return fromCode
  const t = result.topic
  if (/смешан/.test(t)) return 'mixed'
  if (/равн|сокращ/.test(t)) return 'equiv'
  if (/сложен|вычитан/.test(t)) return 'add'
  return 'compare'
}

/** Weak topics first (most mistakes), the rest follow as «закрепление» at a higher level. */
export function planTopics(results: TaskResult[]): TopicState[] {
  const mistakes = new Map<TopicId, number>()
  results.filter((r) => !r.correctFirstTry || r.usedHint).forEach((r) => {
    const topic = topicOfResult(r)
    mistakes.set(topic, (mistakes.get(topic) ?? 0) + 1)
  })
  return (Object.keys(TOPICS) as TopicId[])
    .map((id) => {
      const count = mistakes.get(id) ?? 0
      return { id, mistakes: count, level: count >= 2 ? 1 : count === 1 ? 2 : 3, solved: 0, missed: 0, mastered: false }
    })
    .sort((a, b) => b.mistakes - a.mistakes)
}

export function newTutorState(shift: ShiftSnapshot): TutorState {
  return { shiftId: shift.id, topics: planTopics(shift.results), current: null, attempts: 0, asked: [], taskCount: 0 }
}

/** Rotate through unmastered weak topics; when they are done, through everything else. */
export function nextTask(state: TutorState, sameTopic?: TopicId): TutorState {
  const open = state.topics.filter((t) => !t.mastered)
  const weak = open.filter((t) => t.mistakes > 0)
  const pool = weak.length ? weak : open
  if (!pool.length) return { ...state, current: null, attempts: 0 }
  const topic = (sameTopic && pool.find((t) => t.id === sameTopic)) || pool[state.taskCount % pool.length]
  const current = generateTask(topic.id, topic.level, new Set(state.asked))
  return { ...state, current, attempts: 0, asked: [...state.asked, current.key], taskCount: state.taskCount + 1 }
}

// ---------- reading and checking answers ----------
export interface ParsedAnswer { value: FractionValue; typed: FractionValue; mixed: boolean; integer: boolean }

/** Accepts "3/4", "3 / 4", "1 1/2", "1 целая 1/2", "2", "3:4". Returns null for anything else (a question). */
export function parseAnswer(raw: string): ParsedAnswer | null {
  const text = raw.trim().toLowerCase().replace(/[⁄∕:]/g, '/').replace(/,/g, ' ').replace(/\s*\/\s*/g, '/').replace(/\s+цел(ая|ых|ые)?\s+/g, ' ').replace(/\s+/g, ' ').replace(/[.!]$/, '')
  let m = text.match(/^(\d{1,3}) (\d{1,3})\/(\d{1,3})$/)
  if (m) {
    const w = +m[1]; const n = +m[2]; const d = +m[3]
    if (!d) return null
    return { value: { numerator: w * d + n, denominator: d }, typed: { numerator: n, denominator: d }, mixed: true, integer: false }
  }
  m = text.match(/^(\d{1,3})\/(\d{1,3})$/)
  if (m) {
    const n = +m[1]; const d = +m[2]
    if (!d) return null
    return { value: { numerator: n, denominator: d }, typed: { numerator: n, denominator: d }, mixed: false, integer: false }
  }
  m = text.match(/^(\d{1,3})$/)
  if (m) return { value: { numerator: +m[1], denominator: 1 }, typed: { numerator: +m[1], denominator: 1 }, mixed: false, integer: true }
  return null
}

export type Verdict = { kind: 'correct'; note?: string } | { kind: 'almost'; note: string } | { kind: 'wrong'; note?: string }

export function checkAnswer(task: TutorTask, input: ParsedAnswer): Verdict {
  const form = task.form
  // A bare number answers "write the fraction with denominator d / numerator n".
  let value = input.value
  if (input.integer && typeof form === 'object') {
    value = 'denominator' in form ? { numerator: input.value.numerator, denominator: form.denominator } : { numerator: form.numerator, denominator: input.value.numerator || 1 }
  }
  const equal = compareFractions(value, task.answer) === 0
  if (!equal) {
    const trap = task.traps?.find((t) => compareFractions(t.value, value) === 0)
    return { kind: 'wrong', note: trap?.note }
  }
  const typed = input.integer && typeof form === 'object' ? value : input.typed
  if (form === 'lowest' && gcd(typed.numerator, typed.denominator) > 1) return { kind: 'almost', note: `Значение верное, но ${typed.numerator}/${typed.denominator} ещё можно сократить.` }
  if (form === 'improper' && input.mixed) return { kind: 'almost', note: 'Это то же число, но здесь нужна неправильная дробь — без целой части.' }
  if (form === 'mixed' && !input.mixed && value.numerator > value.denominator) return { kind: 'almost', note: 'Число верное, но запиши его смешанным: целая часть и дробь.' }
  if (typeof form === 'object' && 'denominator' in form && typed.denominator !== form.denominator) return { kind: 'almost', note: `Дробь равная, но нужен знаменатель ${form.denominator}.` }
  if (typeof form === 'object' && 'numerator' in form && typed.numerator !== form.numerator) return { kind: 'almost', note: `Дробь равная, но нужен числитель ${form.numerator}.` }
  if (form === 'any' && !input.mixed && gcd(typed.numerator, typed.denominator) > 1) {
    const r = reduceFraction(typed)
    return { kind: 'correct', note: `Можно ещё сократить: ${r.numerator}/${r.denominator}.` }
  }
  return { kind: 'correct' }
}

/** Updates levels after a task ends: solved moves the topic up, a revealed answer moves it down. */
export function settleTask(state: TutorState, solved: boolean): { state: TutorState; mastered?: TopicId; levelUp?: number } {
  const id = state.current?.topic
  if (!id) return { state }
  let mastered: TopicId | undefined
  let levelUp: number | undefined
  const topics = state.topics.map((t) => {
    if (t.id !== id) return t
    if (!solved) return { ...t, missed: t.missed + 1, level: Math.max(1, t.level - 1) }
    if (t.level >= MAX_LEVEL) { mastered = t.id; return { ...t, solved: t.solved + 1, mastered: true } }
    levelUp = t.level + 1
    return { ...t, solved: t.solved + 1, level: t.level + 1 }
  })
  return { state: { ...state, topics }, mastered, levelUp }
}

// ---------- the chef's own words (used when the AI is offline, and as a hint to the AI) ----------
const PRAISE = ['Верно!', 'Точно!', 'Так и есть!', 'Отлично!', 'В яблочко!', 'Чистая работа!']

export function greeting(shift: ShiftSnapshot, previous: ShiftSnapshot | undefined, topics: TopicState[]): string {
  const weak = topics.filter((t) => t.mistakes > 0)
  const progress = previous ? ` В прошлую смену было ${previous.firstTry} из ${previous.total}${shift.firstTry > previous.firstTry ? ` — плюс ${shift.firstTry - previous.firstTry}, здорово!` : '.'}` : ''
  const counts = new Map<MisconceptionCode, number>()
  shift.results.flatMap((r) => r.misconceptions).filter((c) => c !== 'GENERIC').forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const slip = top ? ` Чаще всего мешала ошибка «${getMisconception(top).name}».` : ''
  const plan = weak.length
    ? `Потренируем ${weak.length === 1 ? 'тему' : 'темы'}: ${weak.map((t) => `«${TOPICS[t.id].name}»`).join(', ')}. С каждым верным ответом задачи будут сложнее.`
    : 'Слабых мест почти нет, поэтому сразу возьмём задачи посложнее.'
  return `Привет! Я шеф Тоша. Посмотрел твою смену: с первой попытки — ${shift.firstTry} из ${shift.total}.${progress}${slip} ${plan} Отвечай дробью, например 3/4 или 1 1/2, а если что-то непонятно — просто спроси.`
}

export function correctReply(verdict: Verdict, topic: TopicId, levelUp?: number, mastered?: TopicId): string {
  const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)]
  const note = verdict.kind === 'correct' && verdict.note ? ` ${verdict.note}` : ''
  if (mastered) return `${praise}${note} Тема «${TOPICS[mastered].name}» пройдена на максимальной сложности!`
  return `${praise}${note}${levelUp ? ` Задачи на тему «${TOPICS[topic].short}» становятся сложнее — уровень ${levelUp}.` : ''}`
}

export function wrongReply(task: TutorTask, verdict: Verdict): string {
  if (verdict.kind === 'almost') return `Почти! ${verdict.note}`
  return `${verdict.note ? `${verdict.note} ` : 'Пока не сходится. '}Подсказка: ${task.hint[0].toLowerCase()}${task.hint.slice(1)}`
}

export function revealReply(task: TutorTask): string {
  return `Разберём вместе: ${task.solution} Ответ: ${task.answer.numerator >= task.answer.denominator ? asMixed(task.answer) : `${task.answer.numerator}/${task.answer.denominator}`}. Следующую задачу этой темы дам чуть проще.`
}

export function questionReply(task: TutorTask | null): string {
  return task
    ? `Я лучше всего помогаю с задачами. Напиши ответ дробью — например, 3/4 или 1 1/2. Подсказка к этой задаче: ${task.hint}`
    : 'Напиши «дальше», и я дам новую задачу.'
}

export const ALL_DONE = 'Ты прокачал все темы до максимальной сложности! Самое время пройти смену заново и посмотреть, насколько вырос результат.'
