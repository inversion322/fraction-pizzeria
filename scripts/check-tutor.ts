/**
 * Sanity check for the tutor's task generator: every generated task must have a valid answer,
 * the correct answer written in the requested form must be accepted, and no "trap" may equal the answer.
 * Run: npm run check:tutor
 */
import { generateTask, type TopicId } from '../src/lib/tutor/generator'
import { checkAnswer, parseAnswer } from '../src/lib/tutor/engine'
import { compareFractions } from '../src/lib/fractions'

let bad = 0
let total = 0
for (const topic of ['compare', 'equiv', 'add', 'mixed'] as TopicId[]) {
  for (let level = 1; level <= 5; level++) {
    const keys = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const t = generateTask(topic, level, new Set())
      total++
      keys.add(t.key)
      const a = t.answer
      if (!(a.denominator > 0) || a.numerator <= 0) { bad++; console.log('BAD ANSWER', t.text, a) }
      const form = t.form
      let typed = `${a.numerator}/${a.denominator}`
      if (form === 'mixed') {
        const w = Math.floor(a.numerator / a.denominator)
        const r = a.numerator % a.denominator
        typed = r ? `${w} ${r}/${a.denominator}` : String(w)
      }
      if (typeof form === 'object' && 'denominator' in form) typed = `${(a.numerator * form.denominator) / a.denominator}/${form.denominator}`
      if (typeof form === 'object' && 'numerator' in form) typed = `${form.numerator}/${(a.denominator * form.numerator) / a.numerator}`
      const parsed = parseAnswer(typed)
      const verdict = parsed ? checkAnswer(t, parsed) : null
      if (verdict?.kind !== 'correct') { bad++; if (bad < 10) console.log('REJECTED', typed, '|', t.text, verdict) }
      for (const trap of t.traps ?? []) if (compareFractions(trap.value, a) === 0) { bad++; console.log('TRAP EQUALS ANSWER', t.text) }
    }
    console.log(`${topic} L${level}: ${keys.size} different tasks, e.g. «${generateTask(topic, level, new Set()).text}»`)
  }
}
const samples = ['3/4', '1 1/2', ' 3 / 4 ', '1 целая 1/2', '2', 'как это?', '3:4']
console.log('parse:', samples.map((x) => `${JSON.stringify(x)} → ${JSON.stringify(parseAnswer(x)?.value ?? null)}`).join(', '))
console.log(`checked ${total} tasks, problems: ${bad}`)
// Fail the npm script when anything is wrong (no @types/node needed).
if (bad) throw new Error(`${bad} problems in generated tasks`)
