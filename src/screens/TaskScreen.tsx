import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MisconceptionCode, Task, TaskResult } from '../types'
import { checkTask } from '../lib/checker'
import { addFractions, formatFraction, parseMixed } from '../lib/fractions'
import { reviewPuzzle } from '../lib/ai'
import { ChoiceList } from '../components/ChoiceList'
import { FractionInput } from '../components/FractionInput'
import { FeedbackPanel, type FeedbackKind } from '../components/FeedbackPanel'
import { Icon } from '../components/Icon'
import { MathText } from '../components/Frac'
import { LevelProgress, type SegmentState } from '../components/LevelProgress'
import { OrderTicket } from '../components/OrderTicket'
import { SliceWork } from '../components/SliceWork'
import { OrderPuzzle } from '../components/puzzles/OrderPuzzle'
import { WholePuzzle } from '../components/puzzles/WholePuzzle'
import { BoxesPuzzle } from '../components/puzzles/BoxesPuzzle'

interface TaskScreenProps {
  task: Task
  taskNumber: number
  totalTasks: number
  progressTitle: string
  segments: SegmentState[]
  isLast: boolean
  isRetry: boolean
  onFinished: (result: TaskResult, earnedCoins: number) => void
  onNext: () => void
  onBack: () => void
}

type Feedback = { kind: FeedbackKind; title: string; text: string; detail?: string; actionLabel: string; coinGain?: number; loading?: boolean }
type Status = 'idle' | 'wrong' | 'correct' | 'revealed'

const INSTRUCTION: Record<string, string> = {
  choice: 'Выбери ответ',
  fraction: 'Запиши ответ дробью',
  order: 'Пазл: выдай куски по очереди',
  whole: 'Пазл: собери целую пиццу',
  boxes: 'Пазл: разложи заказы по коробкам',
}

function mostCommon(codes: MisconceptionCode[]): MisconceptionCode | undefined {
  const counts = new Map<MisconceptionCode, number>()
  codes.forEach((code) => counts.set(code, (counts.get(code) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function TaskScreen({ task, taskNumber, totalTasks, progressTitle, segments, isLast, isRetry, onFinished, onNext, onBack }: TaskScreenProps) {
  const [choice, setChoice] = useState('')
  const [cuts, setCuts] = useState(task.cutsFixed ?? 0)
  const [selectedSlices, setSelectedSlices] = useState<number[]>([])
  const [numerator, setNumerator] = useState('')
  const [denominator, setDenominator] = useState(task.fractionFixedDenominator ? String(task.fractionFixedDenominator) : '')
  const [wholeSelected, setWholeSelected] = useState<string[]>([])
  const [, setMoves] = useState<string[]>([])
  const [slips, setSlips] = useState<MisconceptionCode[]>([])
  const [attempts, setAttempts] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  // Puzzle log mirrored in a ref: puzzles report completion from a timer, after the last state update.
  const log = useRef<{ moves: string[]; slips: MisconceptionCode[] }>({ moves: [], slips: [] })
  const addMove = (move: string) => { log.current.moves = [...log.current.moves, move]; setMoves(log.current.moves) }
  const addSlip = (code: MisconceptionCode, move: string) => { addMove(move); log.current.slips = [...log.current.slips, code]; setSlips(log.current.slips) }

  useEffect(() => {
    setChoice(''); setCuts(task.cutsFixed ?? 0); setSelectedSlices([]); setNumerator('')
    setDenominator(task.fractionFixedDenominator ? String(task.fractionFixedDenominator) : '')
    setWholeSelected([]); setMoves([]); setSlips([]); log.current = { moves: [], slips: [] }
    setAttempts(0); setUsedHint(false); setHintOpen(false); setFeedback(null); setStatus('idle')
    window.scrollTo({ top: 0 })
  }, [task.id, task.cutsFixed, task.fractionFixedDenominator])

  const puzzle = task.type === 'puzzle' ? task.puzzle : undefined
  const autoPuzzle = puzzle?.kind === 'order' || puzzle?.kind === 'boxes' // these finish themselves
  const locked = status === 'correct' || status === 'revealed'
  const finishLabel = isRetry ? 'К разбору смены' : 'Завершить уровень'
  const nextLabel = isLast ? finishLabel : 'Следующий заказ'

  const answer = useMemo(() => {
    if (task.type === 'choice') return choice
    if (task.type === 'slice') return { cuts, selected: selectedSlices }
    return { numerator: Number(numerator), denominator: Number(denominator) }
  }, [choice, cuts, selectedSlices, numerator, denominator, task.type])

  const canCheck = !locked && (
    task.type === 'choice' ? Boolean(choice)
      : task.type === 'slice' ? cuts > 0 && selectedSlices.length > 0
        : task.type === 'fraction' ? Boolean(numerator) && Boolean(denominator) && Number(denominator) !== 0
          : puzzle?.kind === 'whole' && wholeSelected.length > 0)

  const record = (opts: { firstTry: boolean; solved: boolean; coins: number; misconception?: MisconceptionCode; moves?: string[] }) => {
    const gained = opts.solved ? Math.max(1, opts.coins - (usedHint ? 3 : 0)) : 0
    onFinished({ taskId: task.id, level: task.level, topic: task.topic, correctFirstTry: opts.firstTry, attempts: attempts + 1, usedHint, earnedCoins: gained, misconceptions: opts.misconception ? [opts.misconception] : [], moves: opts.moves }, gained)
    return gained
  }

  /** Second miss: the correct answer is put on the board so the student sees it, not just reads it. */
  const reveal = () => {
    if (task.type === 'slice' && task.sliceAnswer) { setCuts(task.sliceAnswer.cuts); setSelectedSlices(Array.from({ length: task.sliceAnswer.selected }, (_, i) => i)) }
    if (task.type === 'fraction' && task.fractionAnswer) { setNumerator(String(task.fractionAnswer.numerator)); setDenominator(String(task.fractionAnswer.denominator)) }
    if (puzzle?.kind === 'whole') setWholeSelected(puzzle.solution)
    setStatus('revealed')
  }

  const miss = (text: string, misconception?: MisconceptionCode) => {
    const next = attempts + 1
    setAttempts(next)
    if (next >= 2) {
      record({ firstTry: false, solved: false, coins: 0, misconception, moves: log.current.moves.length ? log.current.moves : undefined })
      reveal()
      setFeedback({ kind: 'solution', title: 'Разберём по шагам', text: 'Смотри, как решает шеф. Правильный ответ уже на доске.', detail: task.solution, actionLabel: isLast ? finishLabel : 'Дальше' })
    } else {
      setStatus('wrong')
      setFeedback({ kind: 'almost', title: 'Почти!', text, actionLabel: 'Попробовать ещё' })
    }
  }

  /** A puzzle is done: record it, then let the AI chef review how it was solved. */
  const finishPuzzle = async (mistakes: number, allMoves: string[], codes: MisconceptionCode[]) => {
    if (!puzzle) return
    const misconception = mostCommon(codes)
    const coins = mistakes === 0 ? 10 : mistakes <= 2 ? 5 : 3
    const gain = record({ firstTry: mistakes === 0, solved: true, coins, misconception, moves: allMoves })
    setStatus('correct')
    setFeedback({ kind: 'ai', title: 'Шеф смотрит на твою сборку…', text: '', actionLabel: 'Подожди секунду', loading: true })
    const review = await reviewPuzzle({ taskId: task.id, puzzle: puzzle.kind, task: task.order, mistakes, moves: allMoves, misconceptions: codes })
    setFeedback({ kind: 'correct', title: mistakes === 0 ? 'Пазл собран без ошибок!' : 'Пазл собран!', text: review.feedback, detail: task.explain, actionLabel: nextLabel, coinGain: gain })
  }

  const submit = () => {
    if (!canCheck) return
    if (puzzle?.kind === 'whole') {
      const picked = wholeSelected.map((id) => puzzle.pieces.find((p) => p.id === id)!.value)
      const sum = addFractions(picked.map(parseMixed))
      const move = `${attempts ? 'вторая попытка' : 'первая попытка'}: ${picked.join(' + ')} = ${formatFraction(sum)}`
      if (sum.numerator === sum.denominator) {
        addMove(`${move} (верно)`)
        void finishPuzzle(attempts, log.current.moves, log.current.slips)
        return
      }
      const gap = addFractions([sum, { numerator: -1, denominator: 1 }])
      const text = gap.numerator < 0
        ? `Получилось ${formatFraction(sum)} — до целой пиццы не хватает ${formatFraction({ numerator: -gap.numerator, denominator: gap.denominator })}.`
        : `Получилось ${formatFraction(sum)} — это больше целой пиццы на ${formatFraction(gap)}.`
      addSlip('NO_COMMON_DENOM', `ошибка: ${move}`)
      miss(`${text} ${task.hint}`, 'NO_COMMON_DENOM')
      return
    }
    const result = checkTask(task, answer as Parameters<typeof checkTask>[1])
    if (result.correct) {
      const gain = record({ firstTry: attempts === 0, solved: true, coins: attempts === 0 ? 10 : 5 })
      const unreduced = task.type === 'fraction' && task.fractionAnswer && Number(numerator) !== task.fractionAnswer.numerator
      setStatus('correct')
      setFeedback({ kind: 'correct', title: attempts === 0 ? 'Заказ принят!' : 'Вот теперь верно!', text: unreduced ? `Верно! А можно сократить до ${task.answer}.` : task.explain, detail: unreduced ? task.explain : undefined, actionLabel: nextLabel, coinGain: gain })
      return
    }
    miss(result.feedback ?? task.hint, result.misconception)
  }

  const onFeedbackAction = () => {
    if (feedback?.kind === 'almost') { setFeedback(null); setStatus('idle'); return }
    onNext()
  }
  const clearWrong = () => { if (status === 'wrong') setStatus('idle') }
  const tone = status === 'wrong' ? 'wrong' : locked ? 'correct' : 'neutral'
  const instruction = task.type === 'slice'
    ? (task.cutsFixed ? 'Нажми на куски, которые отдашь клиенту' : cuts ? 'Теперь нажми на нужные куски' : 'Сначала нарежь пиццу на равные части')
    : INSTRUCTION[puzzle?.kind ?? task.type]

  return (
    <main className={`mx-auto max-w-6xl px-4 sm:px-8 lg:px-10 ${feedback ? 'pb-[56vh] sm:pb-80' : 'pb-6'}`}>
      <LevelProgress title={progressTitle} segments={segments} position={taskNumber} onBack={onBack} />
      <span className="sr-only">Заказ {taskNumber} из {totalTasks}</span>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-36">
          <OrderTicket ticketKey={task.id} customer={task.customer} order={task.order} orderNumber={taskNumber} total={totalTasks} />
          <AnimatePresence initial={false}>
            {hintOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="mt-4 flex gap-3 rounded-2xl bg-cheese-soft px-4 py-3.5 text-[15px] font-bold leading-relaxed text-ink" role="note">
                  <span className="mt-0.5 text-cheese-ink"><Icon name="bulb" size={20} /></span>
                  <p><MathText>{task.hint}</MathText></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section className="rounded-[28px] bg-surface p-5 shadow-md ring-1 ring-ink/5 sm:p-7" aria-labelledby="instruction">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="instruction" className="font-display text-lg font-bold text-ink sm:text-xl">{instruction}</h2>
            <span className="text-sm font-bold text-ink-3">{task.topic}</span>
          </div>

          <div className="mt-5">
            {task.type === 'choice' && task.options && (
              <ChoiceList options={task.options} value={choice} locked={locked} onChange={(id) => { setChoice(id); clearWrong() }}
                status={status === 'wrong' ? 'wrong' : status === 'correct' ? 'correct' : 'idle'}
                revealId={status === 'revealed' ? task.options.find((o) => o.correct)?.id : undefined} />
            )}
            {task.type === 'slice' && (
              <SliceWork cuts={cuts} cutsFixed={task.cutsFixed} selected={selectedSlices} locked={locked} tone={tone}
                onCut={(count) => { if (locked) return; setCuts(count); setSelectedSlices([]); clearWrong() }}
                onToggle={(index) => { if (locked) return; clearWrong(); setSelectedSlices((cur) => cur.includes(index) ? cur.filter((v) => v !== index) : [...cur, index]) }} />
            )}
            {task.type === 'fraction' && (
              <FractionInput numerator={numerator} denominator={denominator} fixedDenominator={task.fractionFixedDenominator} locked={locked} invalid={status === 'wrong'}
                onChange={({ numerator: n, denominator: d }) => { setNumerator(n); setDenominator(task.fractionFixedDenominator ? String(task.fractionFixedDenominator) : d); clearWrong() }} />
            )}
            {puzzle?.kind === 'order' && (
              <OrderPuzzle key={task.id} puzzle={puzzle} locked={locked}
                onMove={addMove} onMistake={addSlip}
                onComplete={() => void finishPuzzle(log.current.slips.length, log.current.moves, log.current.slips)} />
            )}
            {puzzle?.kind === 'boxes' && (
              <BoxesPuzzle key={task.id} puzzle={puzzle} locked={locked}
                onMove={addMove} onMistake={addSlip}
                onComplete={() => void finishPuzzle(log.current.slips.length, log.current.moves, log.current.slips)} />
            )}
            {puzzle?.kind === 'whole' && (
              <WholePuzzle puzzle={puzzle} selected={wholeSelected} locked={locked} tone={tone}
                onToggle={(id) => { clearWrong(); setWholeSelected((cur) => cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]) }} />
            )}
          </div>

          {/* Actions: sticky on phones so the main button is always reachable. */}
          {!feedback && (
            <div className={`-mx-5 mt-6 flex items-center gap-3 rounded-b-[28px] border-t border-line px-5 pt-4 sm:static sm:mx-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none ${autoPuzzle ? 'pb-1' : 'sticky bottom-0 bg-surface/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur'}`}>
              <button type="button" onClick={() => { setHintOpen((open) => !open); setUsedHint(true) }} aria-expanded={hintOpen}
                className="inline-flex min-h-[54px] shrink-0 items-center justify-center gap-1.5 rounded-2xl px-3 text-[15px] font-extrabold text-cheese-ink transition-colors hover:bg-cheese-soft sm:px-4 sm:text-base">
                <Icon name="bulb" size={20} /> <span>Подсказка</span>
              </button>
              {autoPuzzle ? (
                <p className="ml-auto text-sm font-extrabold text-ink-3" aria-live="polite">
                  {slips.length ? <>Ошибок: <span className="tabular text-tomato-ink">{slips.length}</span></> : 'Пока без ошибок'}
                </p>
              ) : (
                <button type="button" onClick={submit} disabled={!canCheck}
                  className="inline-flex min-h-[54px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-tomato px-4 font-display text-[15px] font-semibold text-white shadow-cta transition-[background-color,transform,opacity,box-shadow] duration-150 ease-out hover:bg-tomato-ink active:scale-[0.98] disabled:bg-ink/15 disabled:text-ink-3 disabled:shadow-none sm:ml-auto sm:max-w-[280px] sm:px-6 sm:text-base">
                  {puzzle?.kind === 'whole' ? 'Отдать пиццу' : 'Проверить'} <Icon name="check" size={19} strokeWidth={2.4} />
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {feedback && <FeedbackPanel key="feedback" {...feedback} onAction={onFeedbackAction} />}
      </AnimatePresence>
    </main>
  )
}
