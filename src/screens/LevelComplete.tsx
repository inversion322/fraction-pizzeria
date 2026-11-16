import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { Fireworks } from '../components/Fireworks'
import { Icon } from '../components/Icon'
import { Pizza } from '../components/Pizza'
import { levelInfo } from '../data/tasks'
import type { Level } from '../types'

const STAR_TEXT: Record<number, string> = {
  3: 'Все четыре заказа — с первой попытки. Чистая работа.',
  2: 'Почти без ошибок: всего один заказ со второй попытки.',
  1: 'Заказы выполнены. Разборы ошибок помогут в следующий раз.',
}

export function LevelComplete({ level, stars, coins, isFinal, onNext, onMap }: { level: Level; stars: number; coins: number; isFinal: boolean; onNext: () => void; onMap: () => void }) {
  const reduce = useReducedMotion()
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 pb-14 pt-6 text-center sm:px-8 sm:pt-12">
      <Fireworks volley={isFinal ? 10 : 7} />
      <motion.div initial={{ scale: 0.6, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
        <Pizza cuts={4} size={208} plate label="Целая пицца: все четыре заказа уровня выполнены" />
      </motion.div>

      <div className="mt-6 flex gap-2" role="img" aria-label={`${stars} из 3 звёзд`}>
        {[1, 2, 3].map((star) => (
          <motion.span key={star} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.35 + star * 0.12 }}
            className={star <= stars ? 'text-cheese' : 'text-line'}>
            <Icon name="star" size={42} fill="currentColor" strokeWidth={1.4} />
          </motion.span>
        ))}
      </div>

      <p className="mt-6 text-base font-extrabold text-ink-3">Уровень {level} пройден</p>
      <h1 className="mt-1 text-balance font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[2.6rem]">
        {isFinal ? 'Все 12 заказов выполнены!' : levelInfo[level].name}
      </h1>
      <p className="mt-3 max-w-md text-pretty text-lg font-semibold leading-relaxed text-ink-2">{STAR_TEXT[stars]}</p>
      <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-cheese-soft px-4 py-2 font-extrabold text-cheese-ink">
        <Icon name="coin" size={18} /> <span className="tabular">+{coins}</span> монет за уровень
      </p>

      {!reduce && <p className="mt-4 text-sm font-bold text-ink-3">Нажми в любом месте экрана, чтобы запустить ещё салют</p>}

      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button type="button" onClick={onNext} className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-tomato px-7 font-display font-semibold text-white shadow-cta transition-[background-color,transform] duration-150 hover:bg-tomato-ink active:scale-[0.98]">
          {isFinal ? 'Открыть разбор смены' : 'Следующий уровень'} <Icon name="arrow" size={18} />
        </button>
        <button type="button" onClick={onMap} className="inline-flex min-h-[54px] items-center justify-center rounded-2xl px-6 font-display font-semibold text-ink-2 ring-2 ring-inset ring-line transition-colors hover:bg-sunk hover:text-ink">
          К карте смены
        </button>
      </div>
    </main>
  )
}
