import { motion, useReducedMotion } from 'framer-motion'
import type { KeyboardEvent } from 'react'

/** Illustration palette for the pizza itself (UI colours live in tokens). */
const ART = {
  crust: '#D48A48',
  crustEdge: '#B0662C',
  cheese: '#F6C85A',
  cheeseHi: '#FFE9A8',
  cheeseSel: '#FFD567',
  pepperoni: '#C2412D',
  pepperoniDot: '#9C2F1F',
  basil: '#3E8A5C',
  basilVein: '#2C6A45',
  mushroom: '#EFE1C4',
  mushroomEdge: '#C9B48C',
  plate: '#FFFDF8',
  plateRim: '#EADBC6',
}

const C = 150
const R_CRUST = 124
const R_CHEESE = 109

export type PizzaTone = 'neutral' | 'correct' | 'wrong'

interface PizzaProps {
  cuts: number
  selected?: number[]
  onToggle?: (index: number) => void
  size?: number
  disabled?: boolean
  toppings?: boolean
  /** Draw only the first N slices; the rest are dashed outlines (progress pies). */
  filled?: number
  tone?: PizzaTone
  plate?: boolean
  label?: string
  className?: string
  /** Diagram mode: unselected slices go pale and nothing lifts, so the fraction reads at a glance. */
  muted?: boolean
}

function polar(radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: C + radius * Math.cos(rad), y: C + radius * Math.sin(rad) }
}

function sector(index: number, count: number, radius: number) {
  if (count <= 1) return `M${C - radius} ${C}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`
  const span = 360 / count
  const a = polar(radius, index * span)
  const b = polar(radius, (index + 1) * span)
  return `M${C} ${C}L${a.x.toFixed(2)} ${a.y.toFixed(2)}A${radius} ${radius} 0 ${span > 180 ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}Z`
}

/** Topping layout per slice as [fraction of the slice's angle, radius]. */
function toppingLayout(count: number): Array<[number, number]> {
  if (count <= 1) return [[0.05, 30], [0.4, 32], [0.75, 34], [0.15, 72], [0.32, 78], [0.5, 70], [0.66, 80], [0.85, 74], [0.98, 90]]
  if (count === 2) return [[0.5, 34], [0.25, 72], [0.75, 72], [0.4, 95], [0.62, 96]]
  if (count <= 4) return [[0.5, 46], [0.28, 84], [0.72, 86]]
  if (count <= 6) return [[0.5, 52], [0.48, 89]]
  return [[0.5, 60], [0.5, 93]]
}

function Topping({ kind, x, y, angle }: { kind: number; x: number; y: number; angle: number }) {
  if (kind === 0) {
    return <g><circle cx={x} cy={y} r="10.5" fill={ART.pepperoni} /><circle cx={x - 3} cy={y - 2} r="1.6" fill={ART.pepperoniDot} /><circle cx={x + 3.5} cy={y + 2.5} r="1.4" fill={ART.pepperoniDot} /></g>
  }
  if (kind === 1) {
    return <g transform={`translate(${x} ${y}) rotate(${angle + 40})`}><path d="M-10 0C-5-7 5-7 10 0C5 7-5 7-10 0Z" fill={ART.basil} /><path d="M-8 0H8" stroke={ART.basilVein} strokeWidth="1.3" strokeLinecap="round" /></g>
  }
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}><path d="M-8 1a8 7 0 0 1 16 0Z" fill={ART.mushroom} stroke={ART.mushroomEdge} strokeWidth="1.4" /><rect x="-2.5" y="1" width="5" height="6" rx="2" fill={ART.mushroom} stroke={ART.mushroomEdge} strokeWidth="1.4" /></g>
}

export function Pizza({ cuts, selected = [], onToggle, size = 280, disabled = false, toppings = true, filled, tone = 'neutral', plate = false, label, className = '', muted = false }: PizzaProps) {
  const reduce = useReducedMotion()
  const count = Math.max(1, Math.round(cuts))
  const span = 360 / count
  const interactive = Boolean(onToggle) && !disabled
  const selectedSet = new Set(selected)
  const present = filled ?? count
  const layout = toppingLayout(count)
  const ring = tone === 'correct' ? 'rgb(var(--basil))' : tone === 'wrong' ? 'rgb(var(--tomato-ink))' : 'rgb(var(--tomato))'

  const onKey = (event: KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle?.(index)
    }
  }

  return (
    <div className={`relative mx-auto aspect-square ${className}`} style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 300 300" className="h-full w-full overflow-visible" role={interactive ? 'group' : 'img'} aria-label={label ?? `Пицца из ${count} равных частей${selected.length ? `, выбрано ${selected.length}` : ''}`}>
        {plate && <><circle cx={C} cy={C + 4} r="146" fill="rgb(var(--ink) / 0.08)" /><circle cx={C} cy={C} r="146" fill={ART.plate} stroke={ART.plateRim} strokeWidth="2" /><circle cx={C} cy={C} r="132" fill="none" stroke={ART.plateRim} strokeWidth="1.5" /></>}

        {/* Ghost outlines for missing slices (progress pies). */}
        {Array.from({ length: count }, (_, index) => index).filter((index) => index >= present).map((index) => (
          <path key={`ghost-${index}`} d={sector(index, count, R_CRUST - 2)} fill="rgb(var(--surface))" stroke="rgb(var(--ink-3) / 0.45)" strokeWidth="3" strokeDasharray="8 7" />
        ))}

        <motion.g key={`slices-${count}`} initial={reduce ? false : { scale: 0.94, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ originX: '50%', originY: '50%' }}>
          {Array.from({ length: Math.min(present, count) }, (_, index) => {
            const isSelected = selectedSet.has(index)
            const mid = (index + 0.5) * span
            const lift = count > 1 && isSelected && !muted ? polar(15, mid) : { x: C, y: C }
            const pale = muted && !isSelected
            return (
              <motion.g
                key={index}
                className="slice"
                data-interactive={interactive}
                initial={{ x: 0, y: 0 }}
                animate={{ x: lift.x - C, y: lift.y - C, filter: isSelected && !muted ? 'drop-shadow(0px 7px 6px rgba(42,27,20,0.28))' : 'drop-shadow(0px 0px 0px rgba(42,27,20,0))' }}
                transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                cursor={interactive ? 'pointer' : undefined}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-pressed={interactive ? isSelected : undefined}
                aria-label={interactive ? `Кусок ${index + 1} из ${count}` : undefined}
                onClick={interactive ? () => onToggle?.(index) : undefined}
                onKeyDown={interactive ? (event) => onKey(event, index) : undefined}
              >
                <path className="slice-crust" d={sector(index, count, R_CRUST)} fill={pale ? '#E6D3B8' : ART.crust} stroke={pale ? '#CDB595' : ART.crustEdge} strokeWidth={1.5} strokeLinejoin="round" />
                <path className="slice-cheese" d={sector(index, count, R_CHEESE)} fill={pale ? '#F8EEDB' : isSelected ? ART.cheeseSel : ART.cheese} stroke={pale ? '#FFFFFF' : ART.cheeseHi} strokeWidth="2.5" strokeLinejoin="round" />
                {toppings && layout.map(([fraction, radius], k) => {
                  const angle = (index + fraction) * span
                  const point = polar(radius, angle)
                  return <Topping key={k} kind={(index * 2 + k) % 3} x={point.x} y={point.y} angle={angle} />
                })}
              </motion.g>
            )
          })}
          {/* Selection rings above every slice, so neighbours never cover them. */}
          {!muted && count > 1 && selected.filter((index) => index < Math.min(present, count)).map((index) => {
            const lift = polar(15, (index + 0.5) * span)
            return (
              <motion.path key={`ring-${index}`} d={sector(index, count, R_CRUST)} fill="none" stroke={ring} strokeWidth="4.5" strokeLinejoin="round" pointerEvents="none"
                initial={{ x: 0, y: 0 }} animate={{ x: lift.x - C, y: lift.y - C }} transition={{ type: 'spring', stiffness: 520, damping: 30 }} />
            )
          })}
        </motion.g>

        {/* Knife pass: cut lines draw outward whenever the number of slices changes. */}
        {count > 1 && !reduce && (
          <g key={`knife-${count}`} pointerEvents="none">
            {Array.from({ length: count }, (_, index) => {
              const end = polar(R_CRUST + 6, index * span)
              return (
                <motion.line key={index} x1={C} y1={C} x2={end.x} y2={end.y} stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0 }}
                  transition={{ pathLength: { duration: 0.28, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.35, delay: 0.3 + index * 0.05 } }} />
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}
