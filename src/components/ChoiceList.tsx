import type { ChoiceOption } from '../types'
import { Pizza } from './Pizza'
import { Icon } from './Icon'

export function ChoiceList({ options, value, onChange }: { options: ChoiceOption[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Варианты ответа">
      {options.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={`flex min-h-[64px] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition hover:-translate-y-0.5 ${selected ? 'border-[#D94F3D] bg-[#FFF0EB] shadow-[0_7px_0_#f7d6c7]' : 'border-[#eadac8] bg-[#fffdf8] hover:border-[#efaa9c]'}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${selected ? 'border-[#D94F3D] bg-[#D94F3D] text-white' : 'border-[#e3cdb8] text-[#8C776B]'}`}>
              {selected ? <Icon name="check" size={17} /> : ''}
            </span>
            {option.miniPizza ? <Pizza cuts={option.miniPizza === '1/3' ? 3 : option.miniPizza === '1/4' ? 4 : 3} selected={option.miniPizza === '1/3' ? [0] : option.miniPizza === '1/4' ? [0] : []} size={46} showLabels={false} disabled toppings={false} /> : null}
            <span className="flex-1 text-base font-extrabold text-[#3D2A20] sm:text-lg">{option.label}</span>
            <span className={`text-xl ${selected ? 'text-[#D94F3D]' : 'text-[#d5c2b2]'}`}>›</span>
          </button>
        )
      })}
    </div>
  )
}
