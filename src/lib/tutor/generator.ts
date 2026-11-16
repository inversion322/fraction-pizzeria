import type { FractionValue } from '../../types'
import { addFractions, compareFractions, formatFraction, gcd, reduceFraction } from '../fractions'

export type TopicId = 'compare' | 'equiv' | 'add' | 'mixed'
export const MAX_LEVEL = 5

export const TOPICS: Record<TopicId, { name: string; short: string }> = {
  compare: { name: 'Сравнение дробей', short: 'Сравнение' },
  equiv: { name: 'Равные дроби и сокращение', short: 'Равные дроби' },
  add: { name: 'Сложение и вычитание', short: 'Сложение' },
  mixed: { name: 'Смешанные числа', short: 'Смешанные числа' },
}

/** How the student's answer must be written, beyond having the right value. */
export type AnswerForm = 'any' | 'lowest' | 'improper' | 'mixed' | { denominator: number } | { numerator: number }

export interface TutorTask {
  key: string            // identity, so the same task is never asked twice
  topic: TopicId
  level: number
  text: string           // fractions written as "a/b" or "w a/b"; rendered stacked in the chat
  answer: FractionValue
  form: AnswerForm
  hint: string
  solution: string
  visual?: string[]      // fractions to draw as mini pizzas (level 1 only)
  traps?: Trap[]         // typical wrong answers with a targeted explanation
}

export interface Trap { value: FractionValue; note: string }

// ---------- small helpers ----------
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const f = (numerator: number, denominator: number): FractionValue => ({ numerator, denominator })
const s = (x: FractionValue) => `${x.numerator}/${x.denominator}`
const lcm = (a: number, b: number) => (a * b) / gcd(a, b)
const toDen = (x: FractionValue, d: number) => f((x.numerator * d) / x.denominator, d)
/** A proper fraction a/d already in lowest terms (no «2/4» in the questions). */
const proper = (d: number, maxN = d - 1) => {
  const options = Array.from({ length: Math.max(1, maxN) }, (_, i) => i + 1).filter((n) => n < d && gcd(n, d) === 1)
  return f(pick(options), d)
}

/** "7/4" → "1 3/4"; whole numbers stay whole. */
export function asMixed(x: FractionValue): string {
  const r = reduceFraction(x)
  const whole = Math.floor(r.numerator / r.denominator)
  const rest = r.numerator % r.denominator
  if (!whole) return s(r)
  return rest ? `${whole} ${rest}/${r.denominator}` : String(whole)
}

const nice = (x: FractionValue) => {
  const r = reduceFraction(x)
  if (r.denominator === 1) return String(r.numerator)
  return r.numerator > r.denominator ? `${formatFraction(r)} = ${asMixed(r)}` : formatFraction(r)
}

// ---------- topic generators ----------
function compare(level: number): TutorTask {
  if (level <= 1) {
    const [a, b] = distinct(2, 10)
    const big = Math.min(a, b)
    return task('compare', level, `cmp1-${a}-${b}`, `Какая дробь больше: 1/${a} или 1/${b}? Напиши её.`, f(1, big), 'any',
      'Обе дроби — по одному куску. Подумай, когда кусок больше: когда пиццу режут на меньше частей или на больше?',
      `1/${a} — пицца на ${a} частей, 1/${b} — на ${b}. Чем меньше частей, тем больше кусок, поэтому больше 1/${big}.`, [`1/${a}`, `1/${b}`],
      [{ value: f(1, Math.max(a, b)), note: `У 1/${Math.max(a, b)} знаменатель больше, но кусок от этого меньше: пиццу режут на большее число частей.` }])
  }
  if (level === 2) {
    const k = rnd(2, 5)
    const [a, b] = distinct(k + 1, 12)
    const big = Math.min(a, b)
    return task('compare', level, `cmp2-${k}-${a}-${b}`, `Какая дробь больше: ${k}/${a} или ${k}/${b}? Напиши её.`, f(k, big), 'any',
      'Числители одинаковые — значит, кусков поровну. Сравни, какого размера каждый кусок.',
      `В обеих дробях по ${k} куска, но куски 1/${big} крупнее, чем 1/${Math.max(a, b)}. Больше ${k}/${big}.`, undefined,
      [{ value: f(k, Math.max(a, b)), note: `Кусков в ${k}/${Math.max(a, b)} столько же, но каждый мельче — пиццу режут на ${Math.max(a, b)} частей.` }])
  }
  const dens = level === 3 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 7, 8, 9, 10, 12]
  const count = level === 4 ? 3 : 2
  const items: FractionValue[] = []
  while (items.length < count) {
    const x = proper(pick(dens))
    if (level >= 4 && x.numerator === 1) continue // unit fractions are level 1 material
    const close = level === 5 ? items.every((y) => Math.abs(x.numerator / x.denominator - y.numerator / y.denominator) < 0.2) : true
    if (close && items.every((y) => compareFractions(x, y) !== 0 && y.denominator !== x.denominator)) items.push(x)
  }
  const best = items.reduce((m, x) => (compareFractions(x, m) > 0 ? x : m))
  const L = items.reduce((m, x) => lcm(m, x.denominator), 1)
  const list = items.map(s)
  const question = count === 3 ? `Какая из дробей самая большая: ${list.join(', ')}? Напиши её.` : `Какая дробь больше: ${list[0]} или ${list[1]}? Напиши её.`
  return task('compare', level, `cmp${level}-${list.join('-')}`, question, best, 'any',
    `Знаменатели разные. Приведи дроби к общему знаменателю ${L} и сравни числители.`,
    `Общий знаменатель ${L}: ${items.map((x) => `${s(x)} = ${s(toDen(x, L))}`).join(', ')}. Больше всех ${s(best)}.`, undefined,
    smaller(items.filter((x) => x !== best)))
}

function equiv(level: number): TutorTask {
  if (level <= 2) {
    const base = level === 1 ? f(1, 2) : pick([f(1, 3), f(2, 3), f(3, 4), f(2, 5), f(3, 5), f(1, 4)])
    const k = level === 1 ? rnd(2, 5) : rnd(2, 4)
    const d = base.denominator * k
    return task('equiv', level, `eq${level}-${s(base)}-${d}`, `Запиши дробь со знаменателем ${d}, равную ${s(base)}.`, base, { denominator: d },
      `Во сколько раз ${d} больше, чем ${base.denominator}? Во столько же раз увеличь числитель.`,
      `${d} : ${base.denominator} = ${k}, поэтому ${s(base)} = ${base.numerator * k}/${d}.`, level === 1 ? [s(base)] : undefined)
  }
  if (level <= 4) {
    const base = pick(level === 3 ? [f(1, 2), f(2, 3), f(3, 4), f(1, 3), f(3, 5)] : [f(5, 6), f(3, 8), f(4, 9), f(5, 12), f(7, 10), f(2, 7)])
    const k = level === 3 ? rnd(2, 4) : rnd(3, 6)
    const big = f(base.numerator * k, base.denominator * k)
    return task('equiv', level, `eq${level}-${s(big)}`, `Сократи дробь ${s(big)} до конца.`, base, 'lowest',
      `Найди самое большое число, на которое делятся и ${big.numerator}, и ${big.denominator}.`,
      `${big.numerator} и ${big.denominator} делятся на ${k}: ${s(big)} = ${s(base)}.`)
  }
  const base = pick([f(2, 3), f(3, 4), f(3, 5), f(4, 7), f(5, 6)])
  const k = rnd(3, 6)
  const n = base.numerator * k
  return task('equiv', level, `eq5-${s(base)}-${n}`, `Запиши дробь с числителем ${n}, равную ${s(base)}.`, base, { numerator: n },
    `Во сколько раз ${n} больше, чем ${base.numerator}? Во столько же раз увеличь знаменатель.`,
    `${n} : ${base.numerator} = ${k}, поэтому ${s(base)} = ${n}/${base.denominator * k}.`)
}

function add(level: number): TutorTask {
  let a: FractionValue
  let b: FractionValue
  let minus = false
  let c: FractionValue | null = null
  if (level <= 1) {
    const d = pick([5, 6, 7, 8, 9, 10])
    const x = rnd(1, d - 2)
    a = f(x, d); b = f(rnd(1, d - x - 1), d)
  } else if (level === 2) {
    const d = pick([2, 3, 4, 5]); const k = pick([2, 3])
    a = proper(d); b = proper(d * k)
  } else if (level === 3) {
    const [d1, d2] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]])
    a = proper(d1); b = proper(d2)
  } else if (level === 4) {
    minus = true
    const [d1, d2] = pick([[3, 4], [2, 5], [4, 6], [3, 8], [5, 6], [4, 10]])
    a = proper(d1); b = proper(d2)
    if (compareFractions(a, b) < 0) [a, b] = [b, a]
    if (compareFractions(a, b) === 0) return add(level)
  } else {
    const [d1, d2, d3] = pick([[2, 3, 4], [2, 3, 6], [3, 4, 6], [2, 4, 8], [2, 5, 10], [3, 4, 12], [4, 6, 8]])
    a = proper(d1); b = proper(d2); c = proper(d3)
  }
  const parts = c ? [a, b, c] : [a, b]
  const sign = minus ? ' − ' : ' + '
  const answer = minus ? addFractions([a, f(-b.numerator, b.denominator)]) : addFractions(parts)
  if (answer.denominator === 1 && level > 1) return add(level)
  const L = parts.reduce((m, x) => lcm(m, x.denominator), 1)
  const expr = parts.map(s).join(sign)
  const converted = parts.map((x) => s(toDen(x, L))).join(sign)
  const sameDen = parts.every((x) => x.denominator === parts[0].denominator)
  return task('add', level, `add${level}-${expr}`, `Вычисли: ${expr} = ?`, answer, 'any',
    sameDen ? 'Знаменатели одинаковые: размер кусков не меняется, считай только числители.' : `Сначала сделай куски одного размера: приведи дроби к общему знаменателю ${L}.`,
    sameDen ? `${expr} = ${nice(answer)}: складываем числители, знаменатель остаётся.` : `Общий знаменатель ${L}: ${converted} = ${nice(answer)}.`,
    level === 1 ? parts.map(s) : undefined,
    minus || c ? undefined : [{ value: f(a.numerator + b.numerator, a.denominator + b.denominator), note: 'Похоже, тут сложены и числители, и знаменатели. Знаменатель — это размер куска, его не складывают.' }])
}

function mixed(level: number): TutorTask {
  const d = pick([2, 3, 4, 5, 6, 8])
  const w = rnd(1, 3)
  const r = rnd(1, d - 1)
  const m = reduceFraction(f(w * d + r, d))
  const mText = asMixed(m)
  if (level <= 1) {
    return task('mixed', level, `mx1-${mText}`, `Запиши ${mText} неправильной дробью.`, m, 'improper',
      `Сколько ${pluralParts(m.denominator)} в ${Math.floor(m.numerator / m.denominator)} целых пиццах? Прибавь оставшиеся куски.`,
      `${mText} = ${Math.floor(m.numerator / m.denominator)}·${m.denominator}/${m.denominator} + ${m.numerator % m.denominator}/${m.denominator} = ${s(m)}.`)
  }
  if (level === 2) {
    return task('mixed', level, `mx2-${s(m)}`, `Запиши ${s(m)} смешанным числом.`, m, 'mixed',
      `Сколько целых пицц получится из ${m.numerator} кусков по 1/${m.denominator}? Остаток — дробная часть.`,
      `${m.numerator} : ${m.denominator} = ${Math.floor(m.numerator / m.denominator)} (остаток ${m.numerator % m.denominator}), поэтому ${s(m)} = ${asMixed(m)}.`)
  }
  let other: FractionValue
  let minus = level !== 4
  if (level === 3) other = proper(pick([d, 2 * d > 12 ? d : 2 * d]))
  else if (level === 4) other = proper(pick([3, 4, 5].filter((x) => x !== d)))
  else {
    const d2 = pick([2, 3, 4, 6].filter((x) => x !== d))
    other = addFractions([f(1, 1), proper(d2)]) // 1 and a bit, with a different denominator
    minus = true
  }
  if (minus && compareFractions(other, m) >= 0) return mixed(level)
  const answer = minus ? addFractions([m, f(-other.numerator, other.denominator)]) : addFractions([m, other])
  if (answer.denominator === 1) return mixed(level) // a whole-number answer makes the task trivial
  const L = lcm(m.denominator, other.denominator)
  const sign = minus ? ' − ' : ' + '
  const otherText = asMixed(other)
  return task('mixed', level, `mx${level}-${mText}${sign}${otherText}`, `Вычисли: ${mText}${sign}${otherText} = ?`, answer, 'any',
    `Переведи смешанные числа в неправильные дроби и приведи к общему знаменателю ${L}.`,
    `${mText} = ${s(toDen(m, L))}, ${otherText} = ${s(toDen(other, L))}. ${s(toDen(m, L))}${sign}${s(toDen(other, L))} = ${nice(answer)}.`)
}

// ---------- public API ----------
const GENERATORS: Record<TopicId, (level: number) => TutorTask> = { compare, equiv, add, mixed }

/** A fresh task for the topic and level, never one whose key is in `asked`. */
export function generateTask(topic: TopicId, level: number, asked: Set<string>): TutorTask {
  for (let tries = 0; tries < 40; tries++) {
    const next = GENERATORS[topic](Math.max(1, Math.min(MAX_LEVEL, level)))
    if (!asked.has(next.key)) return next
  }
  return GENERATORS[topic](Math.min(MAX_LEVEL, level + 1))
}

function task(topic: TopicId, level: number, key: string, text: string, answer: FractionValue, form: AnswerForm, hint: string, solution: string, visual?: string[], traps?: Trap[]): TutorTask {
  return { topic, level, key, text, answer: reduceFraction(answer), form, hint, solution, visual, traps }
}

const smaller = (others: FractionValue[]): Trap[] => others.map((x) => ({ value: x, note: `${s(x)} — как раз меньшая дробь.` }))

function distinct(min: number, max: number): [number, number] {
  const a = rnd(min, max)
  let b = rnd(min, max)
  while (b === a) b = rnd(min, max)
  return [a, b]
}

function pluralParts(d: number) {
  return ({ 2: 'половинок', 3: 'третей', 4: 'четвертей', 5: 'пятых', 6: 'шестых', 8: 'восьмых' } as Record<number, string>)[d] ?? `долей по 1/${d}`
}
