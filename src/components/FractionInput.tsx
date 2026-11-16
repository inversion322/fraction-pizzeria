import { Pizza } from './Pizza'

export function FractionInput({ numerator, denominator, fixedDenominator, onChange }: { numerator: string; denominator: string; fixedDenominator?: number; onChange: (next: { numerator: string; denominator: string }) => void }) {
  const safeDenominator = Number(denominator)
  const safeNumerator = Number(numerator)
  const canPreview = Number.isInteger(safeDenominator) && safeDenominator > 0 && safeDenominator <= 12
  const previewSelected = canPreview && Number.isInteger(safeNumerator) && safeNumerator > 0 ? Array.from({ length: Math.min(safeNumerator, safeDenominator) }, (_, index) => index) : []
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_190px]">
      <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#FFF7D7] p-5 sm:justify-start">
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="numerator" className="text-xs font-extrabold uppercase tracking-[.12em] text-[#8A6419]">числитель</label>
          <input id="numerator" inputMode="numeric" type="number" min="0" max="24" value={numerator} onChange={(event) => onChange({ numerator: event.target.value, denominator })} className="h-16 w-20 rounded-xl border-2 border-[#E2BA43] bg-white text-center text-2xl font-black text-[#3D2A20] shadow-sm" aria-label="Числитель" />
        </div>
        <div className="mt-5 h-1 w-16 rounded-full bg-[#3D2A20]" />
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="denominator" className="text-xs font-extrabold uppercase tracking-[.12em] text-[#8A6419]">знаменатель</label>
          {fixedDenominator ? <div className="flex h-16 w-20 items-center justify-center rounded-xl border-2 border-[#E2BA43] bg-[#fffdf8] text-2xl font-black text-[#3D2A20]" aria-label={`Знаменатель ${fixedDenominator}`}>{fixedDenominator}</div> : <input id="denominator" inputMode="numeric" type="number" min="1" max="24" value={denominator} onChange={(event) => onChange({ numerator, denominator: event.target.value })} className="h-16 w-20 rounded-xl border-2 border-[#E2BA43] bg-white text-center text-2xl font-black text-[#3D2A20] shadow-sm" aria-label="Знаменатель" />}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#eadac8] bg-[#fffdf8] p-3">
        {canPreview ? <Pizza cuts={safeDenominator} selected={previewSelected} size={132} showLabels={false} disabled /> : <div className="flex h-[132px] items-center justify-center text-center text-sm font-bold text-[#8C776B]">Введи знаменатель<br />от 1 до 12</div>}
        <p className="mt-1 text-xs font-bold text-[#8C776B]">так выглядит твой ответ</p>
      </div>
    </div>
  )
}
