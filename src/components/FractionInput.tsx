import { Pizza } from './Pizza'

function Field({ id, label, value, onChange, readOnly, invalid }: { id: string; label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean; invalid?: boolean }) {
  return (
    <input
      id={id}
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      maxLength={2}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value.replace(/\D/g, '').slice(0, 2))}
      className={`h-[72px] w-[88px] rounded-2xl border-2 text-center font-display text-4xl font-semibold tabular text-ink outline-none transition-colors duration-200 focus-visible:border-tomato focus-visible:outline-none ${readOnly ? 'border-transparent bg-sunk' : invalid ? 'border-tomato-ink bg-tomato-soft' : 'border-line bg-surface'}`}
    />
  )
}

export function FractionInput({ numerator, denominator, fixedDenominator, onChange, locked = false, invalid = false }: {
  numerator: string
  denominator: string
  fixedDenominator?: number
  onChange: (next: { numerator: string; denominator: string }) => void
  locked?: boolean
  invalid?: boolean
}) {
  const d = Number(denominator)
  const n = Number(numerator)
  const canPreview = Number.isInteger(d) && d > 0 && d <= 12
  const shown = canPreview && Number.isInteger(n) && n > 0 ? Array.from({ length: Math.min(n, d) }, (_, i) => i) : []
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
      <div className="flex flex-col items-center gap-2" role="group" aria-label="Твой ответ дробью">
        <Field id="numerator" label="Числитель" value={numerator} readOnly={locked} invalid={invalid} onChange={(value) => onChange({ numerator: value, denominator })} />
        <span className="h-1.5 w-[104px] rounded-full bg-ink" aria-hidden="true" />
        <Field id="denominator" label="Знаменатель" value={fixedDenominator ? String(fixedDenominator) : denominator} readOnly={locked || Boolean(fixedDenominator)} invalid={invalid && !fixedDenominator} onChange={(value) => onChange({ numerator, denominator: value })} />
      </div>
      <div className="flex w-[168px] flex-col items-center gap-2">
        {canPreview
          ? <Pizza cuts={d} selected={shown} size={150} toppings={false} muted disabled label={`Твой ответ на пицце: ${shown.length} из ${d} частей`} />
          : <div className="flex aspect-square w-[150px] items-center justify-center rounded-full border-2 border-dashed border-line bg-sunk/60 p-6 text-center text-sm font-bold leading-snug text-ink-3">Впиши знаменатель от 1 до 12</div>}
        <p className="text-sm font-bold text-ink-3">так выглядит ответ</p>
      </div>
    </div>
  )
}
