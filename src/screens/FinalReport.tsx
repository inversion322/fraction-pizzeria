import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { getMisconception } from '../data/misconceptions'
import { getFinalReport } from '../lib/ai'
import type { FinalReport as Report, MisconceptionCode, TaskResult } from '../types'
import { ChefTosha } from '../components/ChefTosha'
import { Icon, type IconName } from '../components/Icon'
import { MathText } from '../components/Frac'

const TOTAL = 12

export function FinalReport({ results, coins, onPlayAgain, onRetryMistakes, onTrain }: { results: TaskResult[]; coins: number; onPlayAgain: () => void; onRetryMistakes: () => void; onTrain: () => void }) {
  const [report, setReport] = useState<Report | null>(null)
  useEffect(() => {
    let active = true
    getFinalReport(results).then((next) => { if (active) setReport(next) })
    return () => { active = false }
  }, [results])

  const firstTry = results.filter((result) => result.correctFirstTry).length
  const rating = firstTry >= 10 ? 3 : firstTry >= 6 ? 2 : 1
  const mistakes = TOTAL - firstTry
  const diagnosis = useMemo(() => {
    const counts = new Map<MisconceptionCode, number>()
    results.flatMap((result) => result.misconceptions).filter((code) => code !== 'GENERIC').forEach((code) => counts.set(code, (counts.get(code) ?? 0) + 1))
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    return top ? { ...getMisconception(top[0]), times: top[1] } : null
  }, [results])

  return (
    <main className="relative mx-auto max-w-4xl px-4 pb-16 pt-4 sm:px-8 sm:pt-8">
      {rating >= 2 && <ToppingRain />}

      <div className="flex items-center gap-4">
        <ChefTosha size={64} mood="happy" />
        <div>
          <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-5xl">Разбор смены</h1>
          <p className="mt-1 text-lg font-semibold text-ink-2">Шеф Тоша посмотрел все твои заказы.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start">
        {/* The shift receipt */}
        <div className="drop-shadow-[0_14px_18px_rgb(42_27_20/0.14)]">
          <div className="ticket-edge rounded-t-[22px] bg-surface px-6 pb-7 pt-6">
            <p className="text-center font-display text-base font-semibold text-ink">Чек смены</p>
            <dl className="mt-4 space-y-3 text-[15px] font-bold text-ink-2">
              <ReceiptLine label="Заказов выполнено" value={`${results.length}`} />
              <ReceiptLine label="С первой попытки" value={`${firstTry} из ${TOTAL}`} />
              <ReceiptLine label="Чаевые" value={`${coins} монет`} />
            </dl>
            <div className="mt-5 border-t-2 border-dashed border-line pt-4 text-center">
              <p className="text-sm font-extrabold text-ink-3">Рейтинг пиццерии</p>
              <div className="mt-1 flex justify-center gap-1" role="img" aria-label={`${rating} из 3 звёзд`}>
                {[1, 2, 3].map((star) => <span key={star} className={star <= rating ? 'text-cheese' : 'text-line'}><Icon name="star" size={30} fill="currentColor" strokeWidth={1.4} /></span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <section className="rounded-[28px] bg-surface p-6 shadow-md ring-1 ring-ink/5 sm:p-7" aria-labelledby="diagnosis">
          <p className="text-sm font-extrabold text-ink-3">{diagnosis ? `Главная ошибка · встретилась ${diagnosis.times} ${diagnosis.times === 1 ? 'раз' : diagnosis.times < 5 ? 'раза' : 'раз'}` : mistakes === 0 ? 'Ни одной ошибки' : 'Повторяющихся ошибок нет'}</p>
          <h2 id="diagnosis" className="mt-1 text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">
            {diagnosis ? `«${diagnosis.name}»` : 'Мастер дробей'}
          </h2>
          <p className="mt-3 text-pretty text-[17px] font-semibold leading-relaxed text-ink-2">
            <MathText>{diagnosis ? diagnosis.explanation : 'Ты уверенно сравниваешь, складываешь и сокращаешь дроби. Так держать!'}</MathText>
          </p>
          {diagnosis && (
            <div className="mt-5 rounded-2xl bg-basil-soft px-4 py-3.5">
              <p className="text-sm font-extrabold text-basil-ink">Как думать правильно</p>
              <p className="mt-1 text-[17px] font-bold leading-relaxed text-ink"><MathText>{diagnosis.example}</MathText></p>
            </div>
          )}
        </section>
      </div>

      {/* Chef's personal note (AI, with local fallback) */}
      <section className="mt-5 rounded-[28px] bg-surface p-6 shadow-md ring-1 ring-ink/5 sm:p-8" aria-labelledby="chef-note" aria-busy={!report}>
        <h2 id="chef-note" className="font-display text-xl font-bold text-ink sm:text-2xl">Заметка шефа</h2>
        {report ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mt-3 max-w-[65ch] text-pretty text-[17px] font-semibold leading-relaxed text-ink-2"><MathText>{report.summary}</MathText></p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <ReportList icon="check" tone="text-basil-ink" title="Получается хорошо" items={report.strengths} />
              <ReportList icon="target" tone="text-tomato-ink" title="Стоит потренировать" items={report.focus} />
              <ReportList icon="route" tone="text-cheese-ink" title="Что сделать дальше" items={report.nextSteps} />
            </div>
          </motion.div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-sunk" />
            <div className="h-4 w-8/12 animate-pulse rounded-full bg-sunk" />
            <p className="pt-2 text-sm font-bold text-ink-3">Шеф Тоша пишет заметку…</p>
          </div>
        )}
      </section>

      {/* Next step: the chef chat trains exactly what went wrong in this shift. */}
      <section className="mt-5 flex flex-col items-start gap-4 rounded-[28px] bg-ink p-6 text-surface sm:flex-row sm:items-center sm:p-7" aria-labelledby="train">
        <ChefTosha size={56} mood="happy" />
        <div className="flex-1">
          <h2 id="train" className="font-display text-xl font-bold">Потренируемся вместе?</h2>
          <p className="mt-1 text-pretty text-[16px] font-semibold leading-relaxed text-surface/80">В чате шеф Тоша даст задачи именно на твои ошибки — каждый раз новые и всё сложнее.</p>
        </div>
        <button type="button" onClick={onTrain} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-tomato px-6 font-display font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-tomato-ink active:scale-[0.98] sm:w-auto">
          Открыть чат с шефом <Icon name="arrow" size={18} />
        </button>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {mistakes > 0 && (
          <button type="button" onClick={onRetryMistakes} className="inline-flex min-h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-tomato px-5 font-display text-[15px] font-semibold text-white sm:px-7 sm:text-base shadow-cta transition-[background-color,transform] duration-150 hover:bg-tomato-ink active:scale-[0.98]">
            <Icon name="target" size={19} /> Повторить только ошибки
          </button>
        )}
        <button type="button" onClick={onPlayAgain} className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl px-6 font-display font-semibold text-ink-2 ring-2 ring-inset ring-line transition-colors hover:bg-sunk hover:text-ink">
          <Icon name="refresh" size={18} /> Пройти заново
        </button>
      </div>
    </main>
  )
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt>{label}</dt>
      <span className="flex-1 translate-y-[-3px] border-b-2 border-dotted border-line" aria-hidden="true" />
      <dd className="tabular font-extrabold text-ink">{value}</dd>
    </div>
  )
}

function ReportList({ icon, tone, title, items }: { icon: IconName; tone: string; title: string; items: string[] }) {
  return (
    <div>
      <h3 className={`flex items-center gap-2 font-extrabold ${tone}`}><Icon name={icon} size={19} strokeWidth={2.2} /> {title}</h3>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => <li key={item} className="text-pretty text-[15px] font-semibold leading-snug text-ink-2"><MathText>{item}</MathText></li>)}
      </ul>
    </div>
  )
}

/** A one-off shower of pepperoni and basil when the shift went well. */
function ToppingRain() {
  const reduce = useReducedMotion()
  const pieces = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 9) * 0.12,
    duration: 2.4 + (i % 5) * 0.35,
    drift: ((i % 7) - 3) * 18,
    spin: 180 + (i % 4) * 120,
    kind: i % 3,
  })), [])
  if (reduce) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="absolute top-0 block"
          style={{ left: `${p.left}%`, animation: `topping-fall ${p.duration}s ${p.delay}s cubic-bezier(.3,.6,.5,1) forwards`, opacity: 0, ['--drift' as string]: `${p.drift}px`, ['--spin' as string]: `${p.spin}deg` }}>
          {p.kind === 0 && <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#C2412D" /><circle cx="8" cy="9" r="1.6" fill="#9C2F1F" /><circle cx="14" cy="13" r="1.4" fill="#9C2F1F" /></svg>}
          {p.kind === 1 && <svg width="24" height="14" viewBox="0 0 24 14"><path d="M1 7C6 0 18 0 23 7C18 14 6 14 1 7Z" fill="#3E8A5C" /></svg>}
          {p.kind === 2 && <svg width="18" height="18" viewBox="0 0 18 18"><path d="M1 9a8 7 0 0 1 16 0Z" fill="#EFE1C4" stroke="#C9B48C" strokeWidth="1.4" /><rect x="6.5" y="9" width="5" height="7" rx="2" fill="#EFE1C4" stroke="#C9B48C" strokeWidth="1.4" /></svg>}
        </span>
      ))}
    </div>
  )
}
