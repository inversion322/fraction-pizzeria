import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { MisconceptionCode, OrderPuzzle as OrderPuzzleData } from '../../types'
import { Frac } from '../Frac'
import { Icon } from '../Icon'
import { plural } from '../../lib/plural'
import { buzz, FractionTile, PuzzleTip, SliceShape, valueOf } from './shared'

export interface PuzzleEvents {
  onMove: (move: string) => void
  onMistake: (code: MisconceptionCode, move: string) => void
  onComplete: () => void
}

/** Level 1 closer: hand out the slices from the smallest to the largest. */
export function OrderPuzzle({ puzzle, locked, onMove, onMistake, onComplete }: { puzzle: OrderPuzzleData; locked: boolean } & PuzzleEvents) {
  const sorted = useMemo(() => [...puzzle.pieces].sort((a, b) => valueOf(a.value) - valueOf(b.value)), [puzzle.pieces])
  const [placed, setPlaced] = useState<string[]>([])
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [tip, setTip] = useState<string | null>(null)

  const tryPlace = (id: string) => {
    if (locked || placed.includes(id)) return
    const piece = puzzle.pieces.find((p) => p.id === id)!
    const expected = sorted[placed.length]
    if (valueOf(piece.value) === valueOf(expected.value)) {
      buzz()
      const next = [...placed, id]
      setPlaced(next); setWrongId(null); setTip(null)
      onMove(`выдан ${piece.value} (верно)`)
      if (next.length === sorted.length) window.setTimeout(onComplete, 450)
      return
    }
    const d = piece.value.split('/')[1]
    setWrongId(id)
    window.setTimeout(() => setWrongId((current) => (current === id ? null : current)), 450)
    setTip(`Есть кусок поменьше, чем ${piece.value}. Это пицца на ${d} ${plural(Number(d), 'часть', 'части', 'частей')} — ищи ту, что разрезана на большее число частей.`)
    onMistake('DENOM_BIGGER', `ошибка: ${piece.value} выдан раньше, чем ${expected.value}`)
  }

  const tray = puzzle.pieces.filter((piece) => !placed.includes(piece.id))

  return (
    <div className="flex flex-col gap-5">
      {/* The queue: slots fill left to right, each placed slice drawn to scale. */}
      <div data-drop="queue" className="rounded-3xl bg-sunk/70 p-3 sm:p-4">
        <ol className="grid grid-cols-5 gap-1.5 sm:gap-3" aria-label="Очередь от меньшего к большему">
          {sorted.map((_, index) => {
            const piece = puzzle.pieces.find((p) => p.id === placed[index])
            return (
              <li key={index} className={`flex aspect-[3/4] flex-col items-center justify-center rounded-2xl ${piece ? 'bg-surface shadow-sm' : 'border-2 border-dashed border-ink/15'}`}>
                  {piece ? (
                    <motion.div layoutId={`order-${piece.id}`} className="flex flex-col items-center gap-1" transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
                      <SliceShape value={valueOf(piece.value)} size={40} />
                      <Frac n={piece.value.split('/')[0]} d={piece.value.split('/')[1]} className="font-display text-lg font-bold text-ink" />
                    </motion.div>
                  ) : <span className="font-display text-sm font-bold text-ink/25 tabular">{index + 1}</span>}
              </li>
            )
          })}
        </ol>
        <div className="mt-2 flex items-center justify-between px-1 text-sm font-extrabold text-ink-3" aria-hidden="true">
          <span>меньше</span>
          <span className="h-px flex-1 mx-3 bg-ink/15" />
          <span className="inline-flex items-center gap-1">больше <Icon name="arrow" size={15} /></span>
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-bold text-ink-3">{tray.length ? 'Выбери кусок, который выдать следующим' : 'Все гости получили свои куски!'}</p>
        <div className="flex min-h-[76px] flex-wrap gap-2.5">
          {tray.map((piece) => (
            <FractionTile key={piece.id} layoutId={`order-${piece.id}`} value={piece.value} wrong={wrongId === piece.id} disabled={locked}
              label={`Кусок ${piece.value}`} onTap={() => tryPlace(piece.id)} onDrop={(target) => target === 'queue' && tryPlace(piece.id)} />
          ))}
        </div>
      </div>
      <PuzzleTip text={tip} />
    </div>
  )
}
