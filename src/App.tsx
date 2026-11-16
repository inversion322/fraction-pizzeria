import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { tasks } from './data/tasks'
import type { Level, StoredProgress, TaskResult } from './types'
import { clearProgress, loadProgress, saveProgress } from './lib/storage'
import { Landing } from './screens/Landing'
import { LevelMap } from './screens/LevelMap'
import { LevelComplete } from './screens/LevelComplete'
import { FinalReport } from './screens/FinalReport'
import { TaskScreen } from './screens/TaskScreen'
import { TutorChat } from './screens/TutorChat'
import { loadTutor, recordShift, saveTutor, type TutorStore } from './lib/tutor/storage'
import { Icon } from './components/Icon'
import type { SegmentState } from './components/LevelProgress'
import { levelInfo } from './data/tasks'

type Screen = 'landing' | 'levels' | 'task' | 'levelComplete' | 'report' | 'chat'

const allTaskIds = tasks.map((task) => task.id)

function getSaved(): StoredProgress | null {
  if (typeof window === 'undefined') return null
  return loadProgress()
}

function starsFor(results: TaskResult[], level: Level) {
  const firstTry = results.filter((result) => result.level === level && result.correctFirstTry).length
  return firstTry >= 4 ? 3 : firstTry >= 3 ? 2 : 1
}

export default function App() {
  const saved = useMemo(getSaved, [])
  const [screen, setScreen] = useState<Screen>(saved?.started ? 'levels' : 'landing')
  const [results, setResults] = useState<TaskResult[]>(saved?.results ?? [])
  const [coins, setCoins] = useState(saved?.coins ?? 0)
  const [queueIds, setQueueIds] = useState<string[]>(saved?.queueIds?.length ? saved.queueIds : allTaskIds)
  const [currentTaskId, setCurrentTaskId] = useState(saved?.currentTaskId || allTaskIds[0])
  const [completedLevel, setCompletedLevel] = useState<Level>(1)
  const [isRetryRun, setIsRetryRun] = useState(false)
  // A shift counts for the chef chat only when it was played from the start (not a «retry mistakes» run).
  const [fresh, setFresh] = useState(saved?.fresh ?? true)
  const [tutor, setTutorState] = useState<TutorStore>(loadTutor)
  const setTutor = useCallback((update: (store: TutorStore) => TutorStore) => setTutorState(update), [])
  useEffect(() => { saveTutor(tutor) }, [tutor])

  // A fully finished shift becomes the chef chat's new context.
  useEffect(() => {
    if (results.length !== tasks.length) return
    if (fresh || !tutor.shifts.length) {
      setTutor((store) => recordShift(store, results, coins))
      setFresh(false)
    }
  }, [results, coins, fresh, tutor.shifts.length, setTutor])

  useEffect(() => {
    if (screen === 'landing' && !results.length) return
    saveProgress({ started: true, currentTaskId, queueIds, coins, results, fresh })
  }, [screen, currentTaskId, queueIds, coins, results, fresh])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [screen])

  const currentTask = tasks.find((task) => task.id === currentTaskId) ?? tasks[0]
  // Number orders within the level (a resumed level still says «3 из 4»); a retry run counts its own queue.
  const levelIds = tasks.filter((task) => task.level === currentTask.level).map((task) => task.id)
  const taskNumber = isRetryRun ? queueIds.indexOf(currentTask.id) + 1 : levelIds.indexOf(currentTask.id) + 1
  const taskTotal = isRetryRun ? queueIds.length : levelIds.length
  const isLastInQueue = queueIds.indexOf(currentTaskId) === queueIds.length - 1
  const segmentIds = isRetryRun ? queueIds : levelIds
  const segments: SegmentState[] = segmentIds.map((id) => {
    if (id === currentTaskId) return 'current'
    const result = results.find((r) => r.taskId === id)
    if (!result || (isRetryRun && segmentIds.indexOf(id) > segmentIds.indexOf(currentTaskId))) return 'todo'
    return result.correctFirstTry && !result.usedHint ? 'clean' : 'slip'
  })
  const progressTitle = isRetryRun ? 'Работа над ошибками' : `Уровень ${currentTask.level} · ${levelInfo[currentTask.level].name}`

  const reset = () => { clearProgress(); setResults([]); setCoins(0); setQueueIds(allTaskIds); setCurrentTaskId(allTaskIds[0]); setIsRetryRun(false); setFresh(true) }
  const startOver = () => { reset(); setScreen('landing') }
  const playAgain = () => { reset(); setScreen('levels') }

  const openLevel = (level: Level) => {
    const levelTaskIds = tasks.filter((task) => task.level === level).map((task) => task.id)
    const remaining = levelTaskIds.filter((id) => !results.some((result) => result.taskId === id))
    const queue = remaining.length ? remaining : levelTaskIds
    setQueueIds(queue)
    setCurrentTaskId(queue[0])
    setIsRetryRun(false)
    setScreen('task')
  }
  const handleFinished = (result: TaskResult, earnedCoins: number) => {
    setResults((previous) => [...previous.filter((item) => item.taskId !== result.taskId), result].sort((a, b) => allTaskIds.indexOf(a.taskId) - allTaskIds.indexOf(b.taskId)))
    setCoins((value) => value + earnedCoins)
  }
  const handleNext = () => {
    const nextId = queueIds[queueIds.indexOf(currentTaskId) + 1]
    if (nextId) { setCurrentTaskId(nextId); return }
    if (isRetryRun) { setScreen('report'); return }
    setCompletedLevel(currentTask.level)
    setScreen('levelComplete')
  }
  const handleNextLevel = () => {
    if (completedLevel === 3) { setScreen('report'); return }
    openLevel((completedLevel + 1) as Level)
  }
  const retryMistakes = () => {
    const mistakeIds = tasks.filter((task) => !results.find((result) => result.taskId === task.id)?.correctFirstTry).map((task) => task.id)
    if (!mistakeIds.length) { setScreen('report'); return }
    setQueueIds(mistakeIds); setCurrentTaskId(mistakeIds[0]); setIsRetryRun(true); setScreen('task')
  }

  const inGame = screen !== 'landing' && screen !== 'chat'
  const tab = screen === 'chat' ? 'chat' : screen === 'landing' ? null : 'test'
  const chatOpen = tutor.shifts.length > 0

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-transparent bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8 lg:px-10">
          <button type="button" onClick={() => setScreen('landing')} className="-ml-1 flex shrink-0 items-center gap-2.5 rounded-xl p-1" aria-label="Пиццерия «Дробь», на главную">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={36} height={36} className="h-9 w-9" />
            <span className="hidden font-display text-[17px] font-semibold tracking-[-0.01em] text-ink md:inline">«Дробь»</span>
          </button>
          <nav aria-label="Разделы" className="mx-2 flex items-center gap-1 rounded-2xl bg-sunk p-1">
            <TabButton active={tab === 'test'} icon="pizza" onClick={() => setScreen('levels')}>Смена</TabButton>
            <TabButton active={tab === 'chat'} icon={chatOpen ? 'message' : 'lock'} onClick={() => setScreen('chat')}>
              Чат<span className="hidden sm:inline">&nbsp;с шефом</span>
            </TabButton>
          </nav>
          {inGame ? (
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-surface py-1.5 pl-2 pr-3.5 shadow-sm ring-1 ring-ink/5" aria-label={`Монет: ${coins}`}>
              <span className="text-cheese-ink"><Icon name="coin" size={22} /></span>
              <motion.span key={coins} initial={{ y: -8, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="min-w-[1.5ch] font-display text-base font-semibold tabular text-ink">{coins}</motion.span>
            </div>
          ) : <span className="w-9 md:w-24" aria-hidden="true" />}
        </div>
      </header>

      {/* Enter-only transition: an exit animation could stall on nested shared-layout elements. */}
        <motion.div key={screen === 'task' ? 'task' : screen} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          {screen === 'landing' && <Landing onStart={() => setScreen('levels')} hasProgress={results.length > 0} />}
          {screen === 'levels' && <LevelMap results={results} onSelectLevel={openLevel} onRestart={startOver} onReport={() => setScreen('report')} />}
          {screen === 'task' && <TaskScreen task={currentTask} taskNumber={taskNumber} totalTasks={taskTotal} isLast={isLastInQueue} isRetry={isRetryRun} progressTitle={progressTitle} segments={segments} onFinished={handleFinished} onNext={handleNext} onBack={() => setScreen('levels')} />}
          {screen === 'levelComplete' && <LevelComplete level={completedLevel} stars={starsFor(results, completedLevel)} coins={results.filter((result) => result.level === completedLevel).reduce((sum, result) => sum + result.earnedCoins, 0)} isFinal={completedLevel === 3} onNext={handleNextLevel} onMap={() => setScreen('levels')} />}
          {screen === 'report' && <FinalReport results={results} coins={coins} onPlayAgain={playAgain} onRetryMistakes={retryMistakes} onTrain={() => setScreen('chat')} />}
          {screen === 'chat' && <TutorChat store={tutor} setStore={setTutor} remaining={tasks.length - results.length} onRetake={playAgain} onGoTest={() => setScreen('levels')} />}
        </motion.div>

      {screen === 'landing' && (
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-sm font-bold text-ink-3 sm:px-8 lg:px-10">
          Учебный демо-проект · тренажёр по дробям для 5–6 класса
        </footer>
      )}
    </div>
  )
}

function TabButton({ active, icon, onClick, children }: { active: boolean; icon: 'pizza' | 'message' | 'lock'; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`relative inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-[15px] font-extrabold transition-colors duration-200 ${active ? 'text-surface' : 'text-ink-2 hover:text-ink'}`}>
      {active && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
      <span className="relative inline-flex items-center gap-1.5"><Icon name={icon} size={17} />{children}</span>
    </button>
  )
}
