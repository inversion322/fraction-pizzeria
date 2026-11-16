import { motion } from 'framer-motion'
import type { ChoiceOption } from '../types'
import { Pizza } from './Pizza'
import { Icon } from './Icon'
import { MathText } from './Frac'

type Status = 'idle' | 'wrong' | 'correct'

function miniPizza(label: string) {
  const match = label.match(/^(\d+)\/(\d+)$/)
  if (!match) return null
  const n = Number(match[1])
  const d = Number(match[2])
  if (!d || n > d || d > 12) return null
  return <Pizza cuts={d} selected={Array.from({ length: n }, (_, i) => i)} size={52} toppings={false} muted disabled label={`${n} из ${d} частей`} />
}

export function ChoiceList({ options, value, onChange, status = 'idle', revealId, locked = false }: {
  options: ChoiceOption[]
  value: string
  onChange: (id: string) => void
  status?: Status
  revealId?: string
  locked?: boolean
}) {
  return (
    <div className="grid gap-2.5 sm:gap-3" role="radiogroup" aria-label="Варианты ответа">
      {options.map((option) => {
        const selected = value === option.id
        const revealed = revealId === option.id
        const state = revealed || (selected && status === 'correct') ? 'correct' : selected && status === 'wrong' ? 'wrong' : selected ? 'selected' : 'idle'
        const styles = {
          idle: 'border-line bg-surface hover:border-ink-3/50',
          selected: 'border-tomato bg-tomato-soft/60',
          wrong: 'border-tomato-ink bg-tomato-soft',
          correct: 'border-basil bg-basil-soft',
        }[state]
        const mark = {
          idle: 'border-line bg-surface',
          selected: 'border-tomato bg-tomato text-white',
          wrong: 'border-tomato-ink bg-tomato-ink text-white',
          correct: 'border-basil bg-basil text-white',
        }[state]
        return (
          <motion.button
            key={option.id}
            animate={state === 'wrong' ? { x: [0, -7, 6, -4, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
            whileTap={locked ? undefined : { scale: 0.985 }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onChange(option.id)}
            className={`group flex min-h-[68px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-2.5 text-left transition-[border-color,background-color] duration-200 ease-out disabled:cursor-default sm:gap-4 ${styles}`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${mark}`}>
              {state === 'wrong' ? <Icon name="x" size={15} strokeWidth={2.6} /> : state !== 'idle' ? <Icon name="check" size={15} strokeWidth={2.6} /> : null}
            </span>
            <span className="flex-1 font-display text-xl font-bold leading-tight text-ink sm:text-2xl [&_[role=math]]:text-[1.5em]">
              <MathText>{option.label}</MathText>
            </span>
            {miniPizza(option.label)}
          </motion.button>
        )
      })}
    </div>
  )
}
