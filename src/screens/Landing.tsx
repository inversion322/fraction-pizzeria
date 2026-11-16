import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ChefTosha } from '../components/ChefTosha'
import { Frac, MathText } from '../components/Frac'
import { Icon, type IconName } from '../components/Icon'
import { Pizza } from '../components/Pizza'

/** The hero pizza keeps re-cutting itself: the fraction and the picture are the same thing. */
const DEMO = [
  { cuts: 2, take: 1, words: 'половина' },
  { cuts: 3, take: 1, words: 'одна треть' },
  { cuts: 4, take: 3, words: 'три четверти' },
  { cuts: 8, take: 3, words: 'три восьмых' },
]

const SKILLS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'compare', title: 'Сравнивать дроби', text: 'Почему 1/3 больше 1/4, хотя 4 больше 3.' },
  { icon: 'equal', title: 'Находить равные дроби', text: '1/2, 2/4 и 4/8 — это один и тот же кусок.' },
  { icon: 'plus', title: 'Складывать и вычитать', text: 'Сначала одинаковые куски, потом считаем.' },
  { icon: 'target', title: 'Собирать пазлы из дробей', text: 'Выстроить куски по размеру, собрать целую пиццу, разложить равные дроби по коробкам.' },
]

export function Landing({ onStart, hasProgress }: { onStart: () => void; hasProgress: boolean }) {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(3)
  useEffect(() => {
    if (reduce) return
    const timer = window.setInterval(() => setStep((value) => (value + 1) % DEMO.length), 2600)
    return () => window.clearInterval(timer)
  }, [reduce])
  const demo = DEMO[step]

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 lg:px-10">
      {/* Hero */}
      <section className="grid items-center gap-6 pt-4 sm:pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 lg:pt-12">
        <div className="order-2 lg:order-1">
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.6rem]">
            Пиццерия <span className="text-tomato">«Дробь»</span>
          </h1>
          <p className="mt-4 font-display text-lg font-medium text-ink-2 sm:text-xl">Тренажёр по дробям для 5–6 класса</p>
          <p className="mt-4 max-w-[34rem] text-pretty text-lg font-semibold leading-relaxed text-ink-2">
            Помоги шефу Тоше выполнить заказы: режь пиццу, сравнивай куски и объясняй, как думаешь. На каждую ошибку — разбор, почему так вышло.
          </p>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button type="button" onClick={onStart} className="group inline-flex min-h-[58px] items-center justify-center gap-3 rounded-2xl bg-tomato px-8 font-display text-lg font-bold text-white shadow-cta transition-[background-color,transform] duration-150 ease-out hover:bg-tomato-ink active:scale-[0.98]">
              {hasProgress ? 'Продолжить смену' : 'Начать смену'}
              <span className="transition-transform duration-200 ease-out group-hover:translate-x-1"><Icon name="arrow" size={20} /></span>
            </button>
            <p className="text-center text-[15px] font-bold text-ink-3 sm:text-left">12 заказов · 3 уровня · около 15 минут</p>
          </div>
        </div>

        <div className="order-1 flex items-center justify-center gap-4 lg:order-2 lg:flex-col lg:gap-6">
          <div className="w-[min(62vw,250px)] sm:w-[300px] lg:w-[400px]">
            <Pizza cuts={demo.cuts} selected={Array.from({ length: demo.take }, (_, i) => i)} size={400} plate disabled label="Пицца показывает дробь" />
          </div>
          <div className="relative flex min-h-[124px] min-w-[96px] flex-col items-center justify-center lg:min-h-[96px] lg:flex-row lg:gap-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-1 lg:flex-row lg:gap-4" aria-live="off">
                <Frac n={demo.take} d={demo.cuts} className="font-display text-6xl text-tomato lg:text-7xl" />
                <span className="max-w-[7rem] text-center text-base font-extrabold leading-tight text-ink-2 lg:max-w-none lg:text-left lg:text-lg">{demo.words}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* What you learn */}
      <section className="mt-20 lg:mt-28" aria-labelledby="learn">
        <h2 id="learn" className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink sm:text-4xl">Чему научишься</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {SKILLS.map((skill) => (
            <li key={skill.title} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-tomato shadow-sm ring-1 ring-ink/5"><Icon name={skill.icon} size={22} /></span>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{skill.title}</h3>
                <p className="mt-1 text-pretty text-[17px] font-semibold leading-relaxed text-ink-2"><MathText>{skill.text}</MathText></p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works: show the mechanism, not describe it */}
      <section className="mt-20 grid gap-8 lg:mt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14" aria-labelledby="how">
        <div>
          <h2 id="how" className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink sm:text-4xl">Как это работает</h2>
          <ol className="mt-6 space-y-5">
            {[
              ['Выполняй заказы', 'Режь пиццу, выбирай куски, вписывай дроби. Каждый уровень заканчивается пазлом по своей теме.'],
              ['Разбирай каждую ошибку', 'Тренажёр понимает, какая именно ошибка в ответе, и объясняет её. Со второй попытки шеф показывает решение на пицце.'],
              ['Получи разбор от ИИ-шефа', 'Шеф Тоша смотрит, как ты собираешь пазлы, а в конце смены находит главную ошибку.'],
              ['Тренируйся в чате с шефом', 'После смены открывается чат: шеф даёт задачи на твои слабые места — каждый раз новые и всё сложнее. Потом можно пройти смену заново и сравнить результат.'],
            ].map(([title, text], index) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-surface tabular">{index + 1}</span>
                <div className="pt-1">
                  <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-pretty text-[17px] font-semibold leading-relaxed text-ink-2">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* A real example of the feedback the student gets */}
        <figure className="rounded-[28px] bg-surface p-5 shadow-lg ring-1 ring-ink/5 sm:p-7" aria-label="Пример разбора ошибки">
          <div className="flex items-center gap-3 border-b-2 border-dashed border-line pb-4">
            <p className="flex-1 font-display text-2xl font-bold text-ink sm:text-3xl"><MathText>1/2 + 1/3 = 2/5</MathText></p>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tomato-soft text-tomato-ink"><Icon name="x" size={20} strokeWidth={2.6} /></span>
          </div>
          <div className="mt-4 flex gap-3">
            <ChefTosha size={44} />
            <figcaption className="text-pretty text-[17px] font-semibold leading-relaxed text-ink-2">
              <span className="font-extrabold text-ink">Здесь сложили и числители, и знаменатели.</span>{' '}
              <MathText>Знаменатель — это размер куска, его не складывают. Сначала режем на одинаковые куски: 1/2 = 3/6, 1/3 = 2/6. Вместе — 5/6.</MathText>
            </figcaption>
          </div>
        </figure>
      </section>

      <section className="mt-20 flex flex-col items-center rounded-[32px] bg-ink px-6 py-12 text-center text-surface lg:mt-28">
        <h2 className="text-balance font-display text-2xl font-bold sm:text-3xl">Шеф Тоша уже разогрел печь</h2>
        <button type="button" onClick={onStart} className="mt-6 inline-flex min-h-[58px] items-center gap-3 rounded-2xl bg-tomato px-8 font-display text-lg font-bold text-white transition-[background-color,transform] duration-150 hover:bg-tomato-ink active:scale-[0.98]">
          {hasProgress ? 'Продолжить смену' : 'Начать смену'} <Icon name="arrow" size={20} />
        </button>
      </section>
    </main>
  )
}
