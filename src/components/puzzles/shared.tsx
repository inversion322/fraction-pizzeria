import { motion, type PanInfo } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { MathText } from '../Frac'
import { parseMixed, toNumber } from '../../lib/fractions'

export const valueOf = (value: string) => toNumber(parseMixed(value))

/** A pizza slice of the given size (≤ 1), drawn from 12 o'clock clockwise. */
export function SliceShape({ value, size = 44, start = 0, className = '' }: { value: number; size?: number; start?: number; className?: string }) {
  const r = 46
  const c = 50
  const point = (turn: number) => {
    const a = turn * Math.PI * 2 - Math.PI / 2
    return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`
  }
  const end = Math.min(start + value, 1)
  const d = value >= 1
    ? `M${c - r} ${c}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`
    : `M${c} ${c}L${point(start)}A${r} ${r} 0 ${end - start > 0.5 ? 1 : 0} 1 ${point(end)}Z`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgb(var(--ink) / 0.12)" strokeWidth="2" strokeDasharray="5 5" />
      <path d={d} fill="#F6C85A" stroke="#D48A48" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  )
}

/** Finds the drop zone (an element with data-drop) under the pointer when a drag ends. */
export function dropTargetAt(info: PanInfo): string | null {
  const x = info.point.x - window.scrollX
  const y = info.point.y - window.scrollY
  const hit = document.elementsFromPoint(x, y).find((node) => (node as HTMLElement).dataset?.drop)
  return hit ? (hit as HTMLElement).dataset.drop ?? null : null
}

export function buzz() {
  try { navigator.vibrate?.(12) } catch { /* not supported */ }
}

/**
 * A fraction tile. Tap (or Enter/Space) selects it; on devices with a mouse it can
 * also be dragged onto a drop zone. Dragging is never the only way (WCAG 2.5.7).
 */
export function FractionTile({ value, onTap, onDrop, selected = false, wrong = false, disabled = false, layoutId, children, label }: {
  value: string
  onTap: () => void
  onDrop?: (target: string) => void
  selected?: boolean
  wrong?: boolean
  disabled?: boolean
  layoutId?: string
  children?: ReactNode
  label?: string
}) {
  const dragged = useRef(false)
  // Drag only with a mouse or pen: on touch screens dragging fights page scrolling, taps do the job.
  const finePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches
  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      drag={Boolean(onDrop) && !disabled && finePointer}
      dragSnapToOrigin
      dragElastic={0.9}
      whileDrag={{ scale: 1.08, zIndex: 50, boxShadow: '0 18px 30px -12px rgb(42 27 20 / 0.45)' }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onDragStart={() => { dragged.current = true }}
      onDragEnd={(_, info) => { const target = dropTargetAt(info); if (target) onDrop?.(target) }}
      onClick={() => { if (dragged.current) { dragged.current = false; return } onTap() }}
      animate={wrong ? { x: [0, -7, 6, -4, 3, 0] } : { x: 0 }}
      transition={{ x: { duration: 0.42 }, layout: { type: 'spring', stiffness: 420, damping: 32 } }}
      className={`relative flex min-h-[76px] min-w-[72px] select-none flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-2 font-display text-2xl font-bold text-ink transition-[border-color,background-color] duration-200 disabled:cursor-default ${finePointer && onDrop ? 'cursor-grab active:cursor-grabbing' : ''} ${
        wrong ? 'border-tomato-ink bg-tomato-soft' : selected ? 'border-tomato bg-tomato-soft/70' : 'border-line bg-surface hover:border-ink-3/50'
      }`}
    >
      {children}
      <MathText className="[&_[role=math]]:text-[1.25em]">{value}</MathText>
    </motion.button>
  )
}

/** A short, polite tip from the chef under the puzzle after a slip. */
export function PuzzleTip({ text, tone = 'tomato' }: { text: string | null; tone?: 'tomato' | 'basil' }) {
  return (
    <p className={`min-h-[3.25rem] text-pretty text-[15px] font-bold leading-snug ${tone === 'basil' ? 'text-basil-ink' : 'text-tomato-ink'}`} aria-live="polite">
      {text ? <MathText>{text}</MathText> : null}
    </p>
  )
}
