import { motion } from 'framer-motion'
import type { Level, TaskResult } from '../types'
import { levelInfo } from '../data/tasks'
import { Icon } from '../components/Icon'
import { Pizza } from '../components/Pizza'

const PER_LEVEL = 4

export function LevelMap({ results, onSelectLevel, onRestart, onReport }: { results: TaskResult[]; onSelectLevel: (level: Level) => void; onRestart: () => void; onReport: () => void }) {
  const done = (level: Level) => results.filter((result) => result.level === level).length
  const unlocked = (level: Level) => level === 1 || done((level - 1) as Level) >= PER_LEVEL
  const allDone = ([1, 2, 3] as Level[]).every((level) => done(level) >= PER_LEVEL)
  const total = results.length

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-4 sm:px-8 sm:pt-8">
      <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-5xl">Твоя смена</h1>
      <p className="mt-3 max-w-xl text-pretty text-lg font-semibold leading-relaxed text-ink-2">
        {total === 0 ? 'Три уровня по четыре заказа. Начни с первого, следующие откроются по очереди.'
          : allDone ? 'Все заказы выполнены. Шеф уже подготовил разбор смены.'
            : `Выполнено ${total} из 12 заказов. Продолжай с того же места.`}
      </p>

      <ol className="mt-8 space-y-4">
        {([1, 2, 3] as Level[]).map((level, index) => {
          const info = levelInfo[level]
          const count = done(level)
          const open = unlocked(level)
          const complete = count >= PER_LEVEL
          const coins = results.filter((result) => result.level === level).reduce((sum, result) => sum + result.earnedCoins, 0)
          const action = complete ? 'Пройти ещё раз' : count > 0 ? 'Продолжить' : 'Начать'
          return (
            <motion.li key={level} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <button type="button" disabled={!open} onClick={() => onSelectLevel(level)}
                className={`group flex w-full items-center gap-4 rounded-[26px] p-4 text-left transition-[box-shadow,background-color] duration-200 ease-out sm:gap-6 sm:p-5 ${open ? 'bg-surface shadow-md ring-1 ring-ink/5 hover:shadow-lg' : 'bg-sunk/70'}`}>
                <div className={`shrink-0 transition-transform duration-300 ease-out ${open ? 'group-hover:rotate-[-8deg]' : 'opacity-60 grayscale'}`}>
                  <Pizza cuts={PER_LEVEL} filled={count} toppings={count > 0} size={84} disabled label={`Выполнено ${count} из ${PER_LEVEL} заказов`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink-3">Уровень {level} · <span className="tabular">{count}/{PER_LEVEL}</span></p>
                  <h2 className={`mt-0.5 font-display text-xl font-bold leading-tight sm:text-2xl ${open ? 'text-ink' : 'text-ink-3'}`}>{info.name}</h2>
                  <p className="mt-1 text-pretty text-[15px] font-semibold leading-snug text-ink-2">{info.description}</p>
                  {coins > 0 && <p className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-cheese-ink"><Icon name="coin" size={16} /> <span className="tabular">{coins}</span> монет</p>}
                </div>
                <span className={`hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 font-display text-sm font-semibold sm:inline-flex ${open ? complete ? 'bg-basil-soft text-basil-ink' : 'bg-tomato text-white' : 'text-ink-3'}`}>
                  {open ? <>{action} <Icon name="arrow" size={16} /></> : <><Icon name="lock" size={16} /> Закрыт</>}
                </span>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:hidden ${open ? complete ? 'bg-basil-soft text-basil-ink' : 'bg-tomato text-white' : 'text-ink-3'}`} aria-hidden="true">
                  <Icon name={open ? (complete ? 'check' : 'arrow') : 'lock'} size={20} />
                </span>
              </button>
              {!open && <p className="mt-2 px-4 text-sm font-bold text-ink-3">Откроется после уровня {level - 1}</p>}
            </motion.li>
          )
        })}
      </ol>

      {allDone && (
        <button type="button" onClick={onReport} className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 font-display font-semibold text-surface transition-colors hover:bg-ink/90 sm:w-auto">
          Открыть разбор смены <Icon name="arrow" size={18} />
        </button>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm font-bold text-ink-3">Прогресс сохраняется на этом устройстве.</p>
        <button type="button" onClick={onRestart} className="-mr-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-tomato-ink transition-colors hover:bg-tomato-soft">
          <Icon name="refresh" size={17} /> Начать заново
        </button>
      </div>
    </main>
  )
}
