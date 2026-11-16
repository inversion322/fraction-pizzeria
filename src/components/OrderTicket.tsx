import { Icon } from './Icon'
import { ChefTosha } from './ChefTosha'

export function OrderTicket({ customer, order, level, orderNumber }: { customer: string; order: string; level: number; orderNumber: number }) {
  return (
    <article className="receipt px-5 py-5 sm:px-7 sm:py-6" aria-label="Заказ клиента">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#D94F3D]"><Icon name="pizza" size={22} /></div>
          <div><p className="eyebrow">Заказ №{orderNumber}</p><p className="text-sm font-extrabold text-[#3D2A20]">Для {customer}</p></div>
        </div>
        <span className="rounded-full bg-[#FFF7D7] px-3 py-1 text-xs font-extrabold text-[#8A6419]">уровень {level}</span>
      </div>
      <div className="dotted-rule my-4" />
      <div className="flex items-start gap-3">
        <span className="mt-1 text-[#D94F3D]">“</span>
        <p className="text-lg font-extrabold leading-7 text-[#3D2A20] sm:text-xl sm:leading-8">{order}</p>
        <span className="self-end text-[#D94F3D]">”</span>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#eadac8] pt-4">
        <ChefTosha compact />
        <span className="text-xs font-bold text-[#8C776B]">шеф уже ждёт</span>
      </div>
    </article>
  )
}
