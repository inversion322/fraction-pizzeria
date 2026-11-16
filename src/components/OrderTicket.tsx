import { motion } from 'framer-motion'
import { MathText } from './Frac'

/** The customer's order as a kitchen ticket clipped to the rail. It drops in for every new order. */
export function OrderTicket({ ticketKey, customer, order, orderNumber, total }: { ticketKey: string; customer: string; order: string; orderNumber: number; total: number }) {
  return (
    <div className="relative pt-3">
      {/* rail + clip */}
      <div className="absolute inset-x-6 top-3 h-1.5 rounded-full bg-ink/15" aria-hidden="true" />
      <motion.article
        key={ticketKey}
        initial={{ y: -28, rotate: -2.5, opacity: 0 }}
        animate={{ y: 0, rotate: -0.6, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={{ originY: 0 }}
        className="relative drop-shadow-[0_14px_18px_rgb(42_27_20/0.16)]"
        aria-label={`Заказ ${orderNumber} из ${total}`}
      >
        <span className="absolute left-1/2 top-0 z-10 h-5 w-12 -translate-x-1/2 -translate-y-2 rounded-md bg-ink/80" aria-hidden="true" />
        <div className="ticket-edge rounded-t-[22px] bg-surface px-5 pb-6 pt-6 sm:px-7 sm:pt-7">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-dashed border-line pb-3 text-sm font-extrabold text-ink-3">
            <span>Заказ <span className="tabular text-ink">№{String(orderNumber).padStart(2, '0')}</span></span>
            <span className="tabular">{orderNumber} из {total}</span>
          </div>
          <p className="mt-4 text-pretty text-[1.35rem] font-extrabold leading-[1.45] text-ink sm:text-2xl sm:leading-[1.45]">
            <MathText>{order}</MathText>
          </p>
          <p className="mt-4 text-right text-base font-bold italic text-ink-2">— {customer}</p>
        </div>
      </motion.article>
    </div>
  )
}
