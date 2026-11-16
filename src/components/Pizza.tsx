import { useMemo } from 'react'

interface PizzaProps {
  cuts: number
  selected?: number[]
  onToggle?: (index: number) => void
  size?: number
  showLabels?: boolean
  disabled?: boolean
  className?: string
  toppings?: boolean
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle - 90) * Math.PI / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

function sectorPath(index: number, count: number) {
  if (count === 1) return 'M150 150 m-111 0 a111 111 0 1 0 222 0 a111 111 0 1 0 -222 0'
  const start = polar(150, 150, 111, index * 360 / count)
  const end = polar(150, 150, 111, (index + 1) * 360 / count)
  const largeArc = 360 / count > 180 ? 1 : 0
  return `M150 150 L${start.x} ${start.y} A111 111 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

const toppingSpots = [
  [113, 80], [166, 82], [201, 124], [176, 174], [115, 188], [82, 134], [143, 126], [126, 147], [177, 120],
]

export function Pizza({ cuts, selected = [], onToggle, size = 280, showLabels = true, disabled = false, className = '', toppings = true }: PizzaProps) {
  const slices = useMemo(() => Array.from({ length: Math.max(1, cuts) }, (_, index) => index), [cuts])
  const selectedSet = new Set(selected)
  return (
    <div className={`relative mx-auto aspect-square ${className}`} style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 300 300" className="pizza-shadow h-full w-full overflow-visible" role="group" aria-label={`Пицца, ${cuts} равных частей`}>
        <circle cx="150" cy="150" r="116" fill="#C67A3C" opacity=".2" />
        <circle cx="150" cy="150" r="113" fill="#D98042" stroke="#9B542E" strokeWidth="3" />
        <circle cx="150" cy="150" r="106" fill="#F8CB62" stroke="#FFF0B2" strokeWidth="4" />
        {slices.map((index) => {
          const isSelected = selectedSet.has(index)
          return (
            <path
              key={index}
              d={sectorPath(index, Math.max(1, cuts))}
              fill={isSelected ? '#F09A3E' : '#F7C95D'}
              stroke="#FFF1B7"
              strokeWidth="2.5"
              className={`slice-button ${isSelected ? 'selected' : ''} ${disabled ? 'pointer-events-none' : 'cursor-pointer'}`}
              role={onToggle && !disabled ? 'button' : undefined}
              tabIndex={onToggle && !disabled ? 0 : -1}
              aria-label={onToggle && !disabled ? `Кусочек ${index + 1}${isSelected ? ', выбран' : ''}` : undefined}
              aria-pressed={onToggle && !disabled ? isSelected : undefined}
              onClick={() => onToggle?.(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onToggle?.(index)
                }
              }}
            />
          )
        })}
        {toppings && toppingSpots.slice(0, Math.min(9, Math.max(3, cuts + 1))).map(([cx, cy], index) => (
          <g key={index} pointerEvents="none">
            {index % 3 === 0 ? <circle cx={cx} cy={cy} r="9" fill="#C85243" stroke="#A84035" strokeWidth="2" /> : index % 3 === 1 ? <path d={`M${cx - 9} ${cy} q9 -12 18 0 q-9 12 -18 0`} fill="#F1E0B2" stroke="#D1B982" strokeWidth="1.5" /> : <circle cx={cx} cy={cy} r="7" fill="#4D8B68" stroke="#356B4D" strokeWidth="2" />}
          </g>
        ))}
        <circle cx="150" cy="150" r="5" fill="#FFF2B9" />
      </svg>
      {showLabels && onToggle && <p className="mt-1 text-center text-sm font-bold text-[#8C776B]">Нажимай на кусочки, чтобы выбрать их</p>}
    </div>
  )
}
