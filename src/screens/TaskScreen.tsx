import { useEffect, useMemo, useState } from 'react'
import type { ExplainResult } from '../types'
import type { Task, TaskResult } from '../types'
import { checkTask } from '../lib/checker'
import { evaluateExplanation } from '../lib/ai'
import { ChoiceList } from '../components/ChoiceList'
import { FractionInput } from '../components/FractionInput'
import { FeedbackPanel } from '../components/FeedbackPanel'
import { Icon } from '../components/Icon'
import { OrderTicket } from '../components/OrderTicket'
import { Pizza } from '../components/Pizza'

interface TaskScreenProps {
  task: Task
  taskNumber: number
  totalTasks: number
  coins: number
  onFinished: (result: TaskResult, earnedCoins: number) => void
  onNext: () => void
  onBack: () => void
}

type Feedback = { kind: 'correct' | 'almost' | 'solution' | 'ai'; title: string; text: string; detail?: string; actionLabel: string; coinGain?: number; loading?: boolean }

export function TaskScreen({ task, taskNumber, totalTasks, coins, onFinished, onNext, onBack }: TaskScreenProps) {
  const [choice, setChoice] = useState('')
  const [cuts, setCuts] = useState(task.cutsFixed ?? 0)
  const [selectedSlices, setSelectedSlices] = useState<number[]>([])
  const [numerator, setNumerator] = useState('')
  const [denominator, setDenominator] = useState(task.fractionFixedDenominator ? String(task.fractionFixedDenominator) : '')
  const [explanation, setExplanation] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setChoice(''); setCuts(task.cutsFixed ?? 0); setSelectedSlices([]); setNumerator(''); setDenominator(task.fractionFixedDenominator ? String(task.fractionFixedDenominator) : ''); setExplanation(''); setAttempts(0); setUsedHint(false); setHintOpen(false); setFeedback(null); setChecking(false)
  }, [task.id, task.cutsFixed, task.fractionFixedDenominator])

  const progress = Math.round(taskNumber / totalTasks * 100)
  const currentAnswer = useMemo(() => {
    if (task.type === 'choice') return choice
    if (task.type === 'slice') return { cuts, selected: selectedSlices }
    if (task.type === 'fraction') return { numerator: Number(numerator), denominator: Number(denominator) }
    return explanation
  }, [choice, cuts, selectedSlices, numerator, denominator, explanation, task.type])

  const canCheck = task.type === 'choice' ? Boolean(choice) : task.type === 'slice' ? cuts > 0 && selectedSlices.length > 0 : task.type === 'fraction' ? Boolean(numerator) && Boolean(denominator) && Number(denominator) !== 0 : explanation.trim().length >= 15

  const earnedCoins = (correctFirstTry: boolean) => Math.max(1, (correctFirstTry ? 10 : 5) - (usedHint ? 3 : 0))
  const recordResult = (correctFirstTry: boolean, answeredCorrectly: boolean, explanationText?: string, misconception?: TaskResult['misconceptions'][number]) => {
    const gained = answeredCorrectly ? earnedCoins(correctFirstTry) : 0
    const result: TaskResult = { taskId: task.id, level: task.level, topic: task.topic, correctFirstTry, attempts: attempts + 1, usedHint, earnedCoins: gained, misconceptions: misconception ? [misconception] : [], explanation: explanationText }
    onFinished(result, gained)
    return gained
  }

  const submitExplanation = async () => {
    if (!canCheck || checking) return
    setChecking(true)
    setFeedback({ kind: 'ai', title: 'Шеф Тоша читает твой ответ…', text: '', actionLabel: 'Подожди секунду', loading: true })
    const response: ExplainResult = await evaluateExplanation({ taskId: task.id, question: task.order, referenceIdea: task.referenceIdea ?? '', studentAnswer: explanation })
    setChecking(false)
    if (response.verdict === 'correct') {
      const gain = recordResult(attempts === 0, true, explanation, response.misconception)
      setFeedback({ kind: 'correct', title: attempts === 0 ? 'Отличное объяснение!' : 'Теперь понятно!', text: response.feedback, detail: task.explain, actionLabel: taskNumber === totalTasks ? 'К итогам смены' : 'Следующий заказ', coinGain: gain })
      return
    }
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    if (nextAttempts >= 2) {
      recordResult(false, false, explanation, response.misconception)
      setFeedback({ kind: 'solution', title: 'Разберём по шагам', text: 'Вторая попытка — отличный повод посмотреть на решение шефа.', detail: task.solution, actionLabel: taskNumber === totalTasks ? 'К итогам смены' : 'Дальше' })
    } else {
      setFeedback({ kind: 'almost', title: response.verdict === 'partial' ? 'Почти, добавь один шаг' : 'Попробуй ещё', text: response.feedback, actionLabel: 'Попробовать ещё' })
    }
  }

  const submit = async () => {
    if (!canCheck || checking) return
    if (task.type === 'explain') { await submitExplanation(); return }
    const answer = currentAnswer as string | { cuts: number; selected: number[] } | { numerator: number; denominator: number }
    const result = checkTask(task, answer)
    if (result.correct) {
      const gain = recordResult(attempts === 0, true, undefined, undefined)
      const reducedHint = task.type === 'fraction' && task.fractionAnswer && Number(numerator) !== task.fractionAnswer.numerator
      setFeedback({ kind: 'correct', title: attempts === 0 ? 'Заказ принят!' : 'Вот теперь верно!', text: reducedHint ? `Верно! А можно сократить до ${task.answer}` : task.explain, detail: reducedHint ? task.explain : undefined, actionLabel: taskNumber === totalTasks ? 'К итогам смены' : 'Следующий заказ', coinGain: gain })
      return
    }
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    if (nextAttempts >= 2) {
      recordResult(false, false, undefined, result.misconception)
      setFeedback({ kind: 'solution', title: 'Разберём по шагам', text: 'Вторая попытка — отличный повод посмотреть на решение шефа.', detail: task.solution, actionLabel: taskNumber === totalTasks ? 'К итогам смены' : 'Дальше' })
    } else {
      setFeedback({ kind: 'almost', title: 'Почти!', text: result.feedback ?? task.hint, actionLabel: 'Попробовать ещё' })
    }
  }

  const toggleSlice = (index: number) => setSelectedSlices((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-8 sm:pt-7 lg:px-12">
      <div className="mb-5 flex items-center justify-between gap-4"><button type="button" onClick={onBack} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-[#8C776B] transition hover:bg-[#FFF0EB] hover:text-[#D94F3D]"><span className="text-xl">‹</span> Карта смены</button><div className="flex items-center gap-3"><div className="hidden w-40 rounded-full bg-[#F0E2D3] p-1 sm:block"><div className="h-2 rounded-full bg-[#D94F3D] transition-all" style={{ width: `${progress}%` }} /></div><span className="text-sm font-black text-[#6d5546]">Заказ {taskNumber} из {totalTasks}</span><span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D7] px-3 py-2 text-sm font-black text-[#8A6419]"><span>●</span>{coins}</span></div></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start"><OrderTicket customer={task.customer} order={task.order} level={task.level} orderNumber={taskNumber} /><section className="paper-card p-5 sm:p-7" aria-label="Рабочая зона"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">рабочая зона</p><h2 className="mt-1 text-2xl font-black text-[#3D2A20]">Собери ответ</h2></div><span className="rounded-full bg-[#EAF6ED] px-3 py-1.5 text-xs font-black text-[#356B4D]">{task.topic}</span></div><div className="mt-6">
        {task.type === 'choice' && task.options ? <ChoiceList options={task.options} value={choice} onChange={setChoice} /> : null}
        {task.type === 'slice' && <div>{!cuts ? <div><p className="mb-4 text-center text-sm font-extrabold text-[#6d5546]">На сколько равных частей нарезать пиццу?</p><div className="grid grid-cols-5 gap-2">{[2, 3, 4, 6, 8].map((count) => <button key={count} type="button" onClick={() => { setCuts(count); setSelectedSlices([]) }} className="min-h-[52px] rounded-xl border-2 border-[#eadac8] bg-[#fffdf8] text-lg font-black text-[#3D2A20] transition hover:-translate-y-0.5 hover:border-[#D94F3D]">{count}</button>)}</div><div className="mx-auto mt-7 max-w-[210px] opacity-80"><Pizza cuts={3} size={200} showLabels={false} disabled /></div></div> : <div><Pizza cuts={cuts} selected={selectedSlices} onToggle={toggleSlice} size={270} /><p className="mt-3 text-center text-lg font-black text-[#3D2A20]">Выбрано: <span className="text-[#D94F3D]">{selectedSlices.length}/{cuts}</span></p></div>}</div>}
        {task.type === 'fraction' && <FractionInput numerator={numerator} denominator={denominator} fixedDenominator={task.fractionFixedDenominator} onChange={({ numerator: nextNumerator, denominator: nextDenominator }) => { setNumerator(nextNumerator); setDenominator(task.fractionFixedDenominator ? String(task.fractionFixedDenominator) : nextDenominator) }} />}
        {task.type === 'explain' && <div><label htmlFor="explanation" className="mb-3 block text-base font-black text-[#3D2A20]">Объясни своими словами</label><textarea id="explanation" value={explanation} onChange={(event) => setExplanation(event.target.value)} rows={6} placeholder="Напиши, как ты рассуждаешь…" className="w-full resize-none rounded-2xl border-2 border-[#eadac8] bg-[#fffdf8] p-4 text-base leading-7 text-[#3D2A20] placeholder:text-[#b5a093]" /><div className="mt-2 flex items-center justify-between text-xs font-bold text-[#8C776B]"><span>Минимум 15 символов</span><span className={explanation.trim().length >= 15 ? 'text-[#4D8B68]' : ''}>{explanation.length}/15</span></div></div>}
      </div><div className="mt-6 flex flex-col gap-3 border-t border-[#f0e2d3] pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setHintOpen(true); setUsedHint(true) }} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-black text-[#8A6419] transition hover:bg-[#FFF7D7]"><Icon name="bulb" size={18} /> Подсказка</button><button type="button" onClick={submit} disabled={!canCheck || checking} className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#D94F3D] px-5 py-3 text-base font-black text-white shadow-[0_4px_0_#AC382B] transition hover:-translate-y-0.5 hover:bg-[#c94535] disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-[260px]">{checking ? 'Шеф читает…' : 'Проверить'} <Icon name="check" size={18} /></button></div>{hintOpen && <div className="mt-4 flex gap-3 rounded-2xl bg-[#FFF7D7] p-4 text-sm font-bold leading-6 text-[#6d5546]" role="status"><span className="text-[#D3A321]"><Icon name="bulb" size={18} /></span><p>{task.hint}</p></div>}</section></div>
      {feedback && <div className="mx-auto mt-5 max-w-4xl"><FeedbackPanel {...feedback} onAction={feedback.kind === 'almost' ? () => setFeedback(null) : onNext} /></div>}
    </main>
  )
}
