import { motion } from 'framer-motion'
import type { WholePuzzle as WholePuzzleData } from '../../types'
import { Icon } from '../Icon'
import { buzz, FractionTile, SliceShape, valueOf } from './shared'

const C = 150
const R = 120

function arc(from: number, to: number, radius = R) {
  const point = (turn: number) => {
    const a = turn * Math.PI * 2 - Math.PI / 2
    return `${(C + radius * Math.cos(a)).toFixed(2)} ${(C + radius * Math.sin(a)).toFixed(2)}`
  }
  if (to - from >= 0.9999) return `M${C - radius} ${C}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`
  return `M${C} ${C}L${point(from)}A${radius} ${radius} 0 ${to - from > 0.5 ? 1 : 0} 1 ${point(to)}Z`
}

/**
 * Level 2 closer: build exactly one whole pizza from the pieces on the tray.
 * Pieces land on the plate one after another; anything past a whole spills over in red.
 */
export function WholePuzzle({ puzzle, selected, onToggle, locked, tone }: {
  puzzle: WholePuzzleData
  selected: string[]
  onToggle: (id: string) => void
  locked: boolean
  tone: 'neutral' | 'correct' | 'wrong'
}) {
  let cursor = 0
  const placed = selected.map((id) => {
    const piece = puzzle.pieces.find((p) => p.id === id)!
    const size = valueOf(piece.value)
    const from = cursor
    cursor += size
    return { ...piece, from, to: cursor }
  })
  const overflow = cursor > 1.0001
  const plateRing = tone === 'correct' ? 'rgb(var(--basil))' : tone === 'wrong' ? 'rgb(var(--tomato-ink))' : 'rgb(var(--ink) / 0.18)'

  const toggle = (id: string) => { if (locked) return; buzz(); onToggle(id) }

  return (
    <div className="flex flex-col items-center gap-5">
      <div data-drop="plate" className="relative w-[min(78vw,280px)]">
        <svg viewBox="0 0 300 300" className="h-full w-full overflow-visible" role="img"
          aria-label={selected.length ? `На тарелке ${placed.map((p) => p.value).join(' + ')}` : 'Тарелка пока пустая'}>
          <circle cx={C} cy={C + 4} r="146" fill="rgb(var(--ink) / 0.08)" />
          <circle cx={C} cy={C} r="146" fill="#FFFDF8" stroke="#EADBC6" strokeWidth="2" />
          <circle cx={C} cy={C} r={R + 4} fill="none" stroke={plateRing} strokeWidth="3" strokeDasharray={tone === 'neutral' ? '9 8' : undefined} />
          {placed.map((piece, index) => {
            const from = Math.min(piece.from, 1)
            const to = Math.min(piece.to, 1)
            const spill = piece.to > 1.0001 ? { from: Math.max(piece.from, 1) - 1, to: piece.to - 1 } : null
            return (
              <g key={piece.id}>
                {to > from && (
                  <motion.g initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }} style={{ originX: '50%', originY: '50%' }}>
                    <path d={arc(from, to)} fill="#D48A48" stroke="#B0662C" strokeWidth="1.5" />
                    <path d={arc(from, to, R - 14)} fill={index % 2 ? '#F9D27A' : '#F6C85A'} stroke="#FFE9A8" strokeWidth="2.5" />
                  </motion.g>
                )}
                {spill && (
                  <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={arc(spill.from, spill.to, R + 18)} fill="rgb(var(--tomato) / 0.28)" stroke="rgb(var(--tomato-ink))" strokeWidth="2.5" strokeDasharray="6 5" />
                )}
              </g>
            )
          })}
        </svg>
        {!selected.length && <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-14 text-center text-sm font-bold text-ink-3">Положи сюда куски</p>}
      </div>
      <p className="min-h-[1.5rem] text-center text-[15px] font-extrabold" aria-live="polite">
        {overflow
          ? <span className="text-tomato-ink">Не помещается — получилось больше целой пиццы</span>
          : <span className="text-ink-3">{selected.length ? 'Нажми на кусок ещё раз, чтобы убрать его' : ''}</span>}
      </p>

      <div className="w-full">
        <p className="mb-2.5 text-sm font-bold text-ink-3">Поднос с кусками</p>
        <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start">
          {puzzle.pieces.map((piece) => {
            const used = selected.includes(piece.id)
            return (
              <FractionTile key={piece.id} value={piece.value} selected={used} disabled={locked}
                label={`${used ? 'Убрать' : 'Положить'} кусок ${piece.value}`}
                onTap={() => toggle(piece.id)} onDrop={(target) => { if (target === 'plate' && !used) toggle(piece.id) }}>
                {used
                  ? <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-tomato text-white"><Icon name="check" size={13} strokeWidth={3} /></span>
                  : null}
                <SliceShape value={valueOf(piece.value)} size={30} />
              </FractionTile>
            )
          })}
        </div>
      </div>
    </div>
  )
}
