import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChefTosha } from '../components/ChefTosha'
import { MathText } from '../components/Frac'
import { Icon, type IconName } from '../components/Icon'
import { Pizza } from '../components/Pizza'
import { MAX_LEVEL, TOPICS } from '../lib/tutor/generator'
import type { ChatMessage, TutorStore } from '../lib/tutor/storage'
import { useTutorChat } from '../lib/tutor/useTutorChat'

interface Props {
  store: TutorStore
  setStore: (update: (store: TutorStore) => TutorStore) => void
  remaining: number          // orders left in the current shift (for the locked state)
  onRetake: () => void
  onGoTest: () => void
}

export function TutorChat({ store, setStore, remaining, onRetake, onGoTest }: Props) {
  if (!store.shifts.length) return <LockedChat remaining={remaining} onGoTest={onGoTest} />
  return <OpenChat store={store} setStore={setStore} onRetake={onRetake} />
}

function LockedChat({ remaining, onGoTest }: { remaining: number; onGoTest: () => void }) {
  const done = 12 - remaining
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 pb-16 pt-10 text-center">
      <div className="relative">
        <Pizza cuts={12} filled={done} toppings={done > 0} size={150} disabled label={`Выполнено ${done} из 12 заказов`} />
        <span className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface shadow-md"><Icon name="lock" size={20} /></span>
      </div>
      <h1 className="mt-7 font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink">Чат с шефом откроется после смены</h1>
      <p className="mt-3 text-pretty text-lg font-semibold leading-relaxed text-ink-2">
        Шеф Тоша посмотрит на твои ошибки и подберёт задачи именно на них. {remaining > 0 ? `Осталось заказов: ${remaining} из 12.` : ''}
      </p>
      <button type="button" onClick={onGoTest} className="mt-7 inline-flex min-h-[54px] items-center gap-2 rounded-2xl bg-tomato px-7 font-display font-semibold text-white shadow-cta transition-[background-color,transform] duration-150 hover:bg-tomato-ink active:scale-[0.98]">
        {remaining === 12 ? 'Начать смену' : 'Продолжить смену'} <Icon name="arrow" size={18} />
      </button>
    </main>
  )
}

function OpenChat({ store, setStore, onRetake }: Omit<Props, 'remaining' | 'onGoTest'>) {
  const { shift, chat, current, typing, busy, send, hint, showSolution, skip } = useTutorChat(store, setStore)
  const [draft, setDraft] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const messages = chat?.messages ?? []
  const topics = chat?.state.topics ?? []
  const allDone = topics.length > 0 && topics.every((t) => t.mastered)

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' }) }, [messages.length, typing, reduce])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || busy) return
    void send(draft)
    setDraft('')
  }

  const date = shift ? new Date(shift.finishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 sm:px-8">
      <header className="pt-4 sm:pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">Тренировка с шефом</h1>
            <p className="mt-1 text-[15px] font-bold text-ink-3">По итогам смены {date}: с первой попытки {shift?.firstTry} из {shift?.total}</p>
          </div>
          <button type="button" onClick={onRetake} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-tomato-ink ring-2 ring-inset ring-tomato/25 transition-colors hover:bg-tomato-soft">
            <Icon name="refresh" size={17} /> Пройти смену заново
          </button>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Темы тренировки">
          {topics.map((t) => (
            <li key={t.id} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold ${t.mastered ? 'bg-basil-soft text-basil-ink' : t.mistakes ? 'bg-tomato-soft text-tomato-ink' : 'bg-sunk text-ink-2'}`}>
              {t.mastered && <Icon name="check" size={15} strokeWidth={2.6} />}
              {TOPICS[t.id].short}
              <LevelDots level={t.mastered ? MAX_LEVEL : t.level} label={`уровень ${t.level} из ${MAX_LEVEL}`} />
            </li>
          ))}
        </ul>
      </header>

      <ol className="mt-6 flex flex-1 flex-col gap-3 pb-4" role="log" aria-live="polite" aria-label="Переписка с шефом">
        {messages.map((m) => <Message key={m.id} message={m} />)}
        {typing && (
          <li className="flex items-end gap-2">
            <ChefTosha size={36} mood="thinking" />
            <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface px-4 py-3.5 shadow-sm" aria-label="Шеф печатает">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-2 w-2 rounded-full bg-ink-3" animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </span>
          </li>
        )}
      </ol>
      <div ref={bottom} />

      <form onSubmit={submit} className="sticky bottom-0 -mx-4 border-t border-line bg-bg/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        {allDone ? (
          <button type="button" onClick={onRetake} className="mb-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-tomato font-display font-semibold text-white shadow-cta">
            <Icon name="refresh" size={18} /> Пройти смену заново
          </button>
        ) : (
          <div className="mb-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            <Chip icon="bulb" label="Подсказка" onClick={() => void hint()} disabled={busy || !current} />
            <Chip icon="book" label="Решение" onClick={() => void showSolution()} disabled={busy || !current} />
            <Chip icon="refresh" label="Другая задача" onClick={() => void skip()} disabled={busy || !current} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">Ответ или вопрос шефу</label>
          <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200} autoComplete="off" enterKeyHint="send"
            placeholder={current ? 'Ответ дробью, например 3/4, или вопрос' : 'Напиши шефу'}
            className="min-h-[52px] min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-[17px] font-semibold text-ink outline-none transition-colors placeholder:font-medium placeholder:text-ink-3 focus-visible:border-tomato" />
          <button type="submit" disabled={busy || !draft.trim()} aria-label="Отправить"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-tomato text-white shadow-cta transition-[background-color,transform] duration-150 hover:bg-tomato-ink active:scale-95 disabled:bg-ink/15 disabled:text-ink-3 disabled:shadow-none">
            <Icon name="arrow" size={22} strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </main>
  )
}

function Message({ message }: { message: ChatMessage }) {
  const enter = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
  if (message.kind === 'student') {
    const mark = message.verdict === 'correct' ? { icon: 'check' as const, tone: 'bg-basil text-white', label: 'верно' }
      : message.verdict === 'wrong' ? { icon: 'x' as const, tone: 'bg-tomato text-white', label: 'неверно' }
        : message.verdict === 'almost' ? { icon: 'bulb' as const, tone: 'bg-cheese text-ink', label: 'почти' } : null
    return (
      <motion.li {...enter} className="flex items-center justify-end gap-2">
        {mark && <span className={`flex h-6 w-6 items-center justify-center rounded-full ${mark.tone}`} aria-label={mark.label}><Icon name={mark.icon} size={14} strokeWidth={2.8} /></span>}
        <span className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[17px] font-bold leading-snug text-surface"><MathText>{message.text}</MathText></span>
      </motion.li>
    )
  }
  if (message.kind === 'task') {
    const { task, number } = message
    return (
      <motion.li {...enter} className="my-1 rounded-[22px] bg-surface p-4 shadow-md ring-1 ring-ink/5 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-line pb-2.5 text-sm font-extrabold text-ink-3">
          <span>Задача {number} · {TOPICS[task.topic].short}</span>
          <LevelDots level={task.level} label={`сложность ${task.level} из ${MAX_LEVEL}`} />
        </div>
        <p className="mt-3 text-pretty text-[1.3rem] font-extrabold leading-[1.5] text-ink"><MathText>{task.text}</MathText></p>
        {task.visual && (
          <div className="mt-3 flex gap-4">
            {task.visual.map((v) => {
              const [n, d] = v.split('/').map(Number)
              return <Pizza key={v} cuts={d} selected={Array.from({ length: n }, (_, i) => i)} size={64} toppings={false} muted disabled label={`${n} из ${d} частей`} />
            })}
          </div>
        )}
      </motion.li>
    )
  }
  return (
    <motion.li {...enter} className="flex items-end gap-2">
      <ChefTosha size={36} />
      <span className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-pretty text-[17px] font-semibold leading-relaxed text-ink-2 shadow-sm"><MathText>{message.text}</MathText></span>
    </motion.li>
  )
}

function LevelDots({ level, label }: { level: number; label: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < level ? 'bg-current' : 'bg-current opacity-25'}`} />)}
    </span>
  )
}

function Chip({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-extrabold sm:px-3.5 sm:text-sm text-ink-2 ring-1 ring-ink/10 transition-colors hover:bg-sunk hover:text-ink disabled:opacity-45">
      <Icon name={icon} size={16} /> {label}
    </button>
  )
}
