import { motion } from 'framer-motion'
import { Frac } from './Frac'
import { Pizza, type PizzaTone } from './Pizza'

const CUT_OPTIONS = [2, 3, 4, 6, 8]

/** Cut the pizza into equal slices (unless it comes pre-cut), then tap the slices to hand out. */
export function SliceWork({ cuts, cutsFixed, selected, locked, tone, onCut, onToggle }: {
  cuts: number
  cutsFixed?: number
  selected: number[]
  locked: boolean
  tone: PizzaTone
  onCut: (count: number) => void
  onToggle: (index: number) => void
}) {
  return (
    <div className="flex flex-col items-center">
      {!cutsFixed && (
        <div className="mb-5 w-full">
          <p id="cuts-label" className="mb-2 text-center text-sm font-bold text-ink-3">На сколько равных частей режем?</p>
          <div className="mx-auto grid max-w-sm grid-cols-5 gap-1.5 rounded-2xl bg-sunk p-1.5" role="radiogroup" aria-labelledby="cuts-label">
            {CUT_OPTIONS.map((count) => (
              <button key={count} type="button" role="radio" aria-checked={cuts === count} disabled={locked} onClick={() => onCut(count)}
                className={`relative min-h-[48px] rounded-xl font-display text-lg font-semibold tabular transition-colors duration-200 ${cuts === count ? 'text-surface' : 'text-ink-2 hover:text-ink'}`}>
                {cuts === count && <motion.span layoutId="cut-pill" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <span className="relative">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Pizza cuts={cuts || 1} selected={selected} onToggle={cuts ? onToggle : undefined} disabled={locked} tone={tone} size={300} plate />
      <p className="mt-4 flex min-h-[48px] items-center gap-2 font-display text-xl font-semibold text-ink" aria-live="polite">
        {cuts > 0
          ? <>Выбрано: <Frac n={selected.length} d={cuts} className="text-2xl text-tomato" /></>
          : <span className="text-base font-bold text-ink-3">Пицца пока целая</span>}
      </p>
    </div>
  )
}
