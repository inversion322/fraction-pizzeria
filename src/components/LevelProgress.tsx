import { motion } from 'framer-motion'
import { Icon } from './Icon'

export type SegmentState = 'clean' | 'slip' | 'current' | 'todo'

const FILL: Record<SegmentState, string> = {
  clean: 'bg-basil',   // done on the first try
  slip: 'bg-cheese',   // done after a slip or a hint
  current: 'bg-tomato',
  todo: 'bg-transparent',
}

/**
 * Quiet, sticky progress for the current level: one segment per order.
 * Done segments keep their colour (first try / with a slip), the current one is half filled.
 */
export function LevelProgress({ title, segments, position, onBack }: { title: string; segments: SegmentState[]; position: number; onBack: () => void }) {
  const total = segments.length
  const left = total - position
  const caption = left === 0 ? 'последний заказ' : `ещё ${left} до конца`
  return (
    <div className="sticky top-16 z-20 -mx-4 mb-4 bg-bg/85 px-4 pb-3 pt-1 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="-ml-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-[15px] font-extrabold text-ink-2 transition-colors hover:bg-sunk hover:text-ink">
          <Icon name="back" size={20} /> Карта
        </button>
        <p className="truncate text-sm font-extrabold text-ink-3">
          <span className="hidden sm:inline">{title} · </span>
          <span className="tabular text-ink">{position} из {total}</span> · {caption}
        </p>
      </div>
      <div className="mt-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={position - 1} aria-label={`${title}: заказ ${position} из ${total}`}>
        {segments.map((state, index) => (
          <span key={index} className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <motion.span className={`block h-full rounded-full ${FILL[state]}`} initial={false}
              animate={{ width: state === 'todo' ? '0%' : state === 'current' ? '45%' : '100%' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
          </span>
        ))}
      </div>
    </div>
  )
}
