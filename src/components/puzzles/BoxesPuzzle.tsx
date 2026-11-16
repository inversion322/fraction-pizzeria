import { motion } from 'framer-motion'
import { useState } from 'react'
import type { BoxesPuzzle as BoxesPuzzleData } from '../../types'
import { parseMixed } from '../../lib/fractions'
import { MathText } from '../Frac'
import { Icon } from '../Icon'
import type { PuzzleEvents } from './OrderPuzzle'
import { buzz, FractionTile, PuzzleTip, valueOf } from './shared'

/** Level 3 closer: every order goes into the box with the equal fraction on its lid. */
export function BoxesPuzzle({ puzzle, locked, onMove, onMistake, onComplete }: { puzzle: BoxesPuzzleData; locked: boolean } & PuzzleEvents) {
  const [selected, setSelected] = useState<string | null>(null)
  const [boxed, setBoxed] = useState<Record<string, string>>({}) // box value -> item id
  const [wrong, setWrong] = useState<{ item: string; box: string } | null>(null)
  const [tip, setTip] = useState<string | null>(null)

  const place = (itemId: string, box: string) => {
    if (locked || boxed[box]) return
    const item = puzzle.items.find((i) => i.id === itemId)!
    if (valueOf(item.value) === valueOf(box)) {
      buzz()
      const next = { ...boxed, [box]: itemId }
      setBoxed(next); setSelected(null); setWrong(null); setTip(null)
      onMove(`${item.value} → коробка ${box} (верно)`)
      if (Object.keys(next).length === puzzle.items.length) window.setTimeout(onComplete, 450)
      return
    }
    setWrong({ item: itemId, box })
    window.setTimeout(() => setWrong(null), 450)
    if (item.value.includes(' ')) {
      const [whole, frac] = item.value.split(' ')
      setTip(`${item.value} — это ${whole} целая пицца и ещё ${frac}. Сколько это половинок вместе?`)
      onMistake('WHOLE_PART', `ошибка: ${item.value} положен в коробку ${box}`)
    } else {
      const f = parseMixed(item.value)
      setTip(`${item.value} не равно ${box}. Попробуй сократить: на какое число делятся и ${f.numerator}, и ${f.denominator}?`)
      onMistake('EQUIV', `ошибка: ${item.value} положен в коробку ${box}`)
    }
  }

  const onBoxTap = (box: string) => {
    if (!selected) { setTip('Сначала выбери заказ сверху, потом — коробку.'); return }
    place(selected, box)
  }

  const tray = puzzle.items.filter((item) => !Object.values(boxed).includes(item.id))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2.5 text-sm font-bold text-ink-3">{tray.length ? 'Выбери заказ, потом — коробку с равной дробью' : 'Все заказы упакованы!'}</p>
        <div className="flex min-h-[76px] flex-wrap gap-2.5">
          {tray.map((item) => (
            <FractionTile key={item.id} layoutId={`box-${item.id}`} value={item.value} selected={selected === item.id} wrong={wrong?.item === item.id} disabled={locked}
              label={`Заказ ${item.value}`} onTap={() => setSelected((current) => (current === item.id ? null : item.id))}
              onDrop={(target) => place(item.id, target)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {puzzle.boxes.map((box) => {
          const itemId = boxed[box]
          const item = puzzle.items.find((i) => i.id === itemId)
          const isWrong = wrong?.box === box
          return (
            <motion.button key={box} type="button" data-drop={box} disabled={locked || Boolean(item)} onClick={() => onBoxTap(box)}
              aria-label={item ? `Коробка ${box}: внутри ${item.value}` : `Коробка ${box}`}
              animate={isWrong ? { x: [0, -6, 5, -3, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
              className={`group relative flex aspect-square flex-col overflow-hidden rounded-2xl text-left transition-[box-shadow,transform] duration-200 ease-out disabled:cursor-default ${
                item ? 'bg-basil-soft ring-2 ring-basil' : isWrong ? 'bg-tomato-soft ring-2 ring-tomato-ink' : selected ? 'bg-kraft shadow-md ring-2 ring-tomato/60 hover:-translate-y-0.5' : 'bg-kraft shadow-sm'
              }`}>
              {/* lid */}
              <span className={`flex h-[46%] items-center justify-center border-b-2 border-dashed ${item ? 'border-basil/40' : 'border-kraft-edge'}`}>
                <MathText className="font-display text-2xl font-bold text-ink [&_[role=math]]:text-[1.3em]">{box}</MathText>
              </span>
              <span className="flex flex-1 items-center justify-center">
                {item ? (
                  <motion.span layoutId={`box-${item.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-1.5 font-display text-lg font-bold text-ink shadow-sm">
                    <MathText>{item.value}</MathText> <Icon name="check" size={16} strokeWidth={2.6} className="text-basil" />
                  </motion.span>
                ) : <span className="text-sm font-extrabold text-kraft-ink">пусто</span>}
              </span>
            </motion.button>
          )
        })}
      </div>
      <PuzzleTip text={tip} />
    </div>
  )
}
