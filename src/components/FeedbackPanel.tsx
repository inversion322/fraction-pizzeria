import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { ChefTosha } from './ChefTosha'
import { Icon, type IconName } from './Icon'
import { MathText } from './Frac'

export type FeedbackKind = 'correct' | 'almost' | 'solution' | 'ai'

const LOOK: Record<FeedbackKind, { band: string; badge: string; icon: IconName; mood: 'happy' | 'calm' | 'thinking' }> = {
  correct: { band: 'bg-basil-soft', badge: 'bg-basil text-white', icon: 'check', mood: 'happy' },
  almost: { band: 'bg-tomato-soft', badge: 'bg-tomato text-white', icon: 'bulb', mood: 'calm' },
  solution: { band: 'bg-cheese-soft', badge: 'bg-cheese text-ink', icon: 'book', mood: 'calm' },
  ai: { band: 'bg-sunk', badge: 'bg-ink text-white', icon: 'message', mood: 'thinking' },
}

/** Bottom sheet with Chef Tosha's verdict. Stays in view on phones, never covers the top bar. */
export function FeedbackPanel({ kind, title, text, detail, actionLabel, onAction, coinGain, loading = false }: {
  kind: FeedbackKind
  title: string
  text: string
  detail?: string
  actionLabel: string
  onAction: () => void
  coinGain?: number
  loading?: boolean
}) {
  const look = LOOK[kind]
  const actionRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!loading) actionRef.current?.focus({ preventScroll: true }) }, [loading, kind])

  return (
    <motion.section
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl px-0 sm:bottom-4 sm:px-4"
      role="status"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-t-[28px] bg-surface shadow-lg ring-1 ring-ink/5 sm:rounded-[28px]">
        <div className={`flex items-center gap-3 px-5 py-3.5 sm:px-6 ${look.band}`}>
          <ChefTosha size={44} mood={look.mood} />
          <h3 className="flex-1 font-display text-lg font-bold leading-tight text-ink sm:text-xl">{title}</h3>
          {coinGain ? (
            <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.15 }}
              className="inline-flex items-center gap-1 rounded-full bg-cheese px-3 py-1 font-display text-sm font-semibold tabular text-ink">
              +{coinGain} <Icon name="coin" size={16} />
            </motion.span>
          ) : <span className={`flex h-9 w-9 items-center justify-center rounded-full ${look.badge}`} aria-hidden="true"><Icon name={look.icon} size={19} strokeWidth={2.3} /></span>}
        </div>
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
          {loading ? (
            <div className="space-y-2.5 py-1" aria-label="Шеф читает ответ">
              <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-sunk" />
              <div className="h-3.5 w-7/12 animate-pulse rounded-full bg-sunk" />
            </div>
          ) : (
            <>
              <p className="text-pretty text-[1.05rem] font-semibold leading-relaxed text-ink-2"><MathText>{text}</MathText></p>
              {detail && <p className="mt-3 rounded-2xl bg-sunk/70 px-4 py-3 text-pretty text-base font-bold leading-relaxed text-ink"><MathText>{detail}</MathText></p>}
            </>
          )}
          <button ref={actionRef} type="button" disabled={loading} onClick={onAction}
            className="mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 font-display text-base font-semibold text-surface transition-[background-color,transform] duration-150 ease-out hover:bg-ink/90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 sm:w-auto">
            {actionLabel} <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </motion.section>
  )
}
