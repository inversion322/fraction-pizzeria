import { useEffect, useMemo, useState } from 'react'
import { tasks } from './data/tasks'
import type { Level, StoredProgress, TaskResult } from './types'
import { clearProgress, loadProgress, saveProgress } from './lib/storage'
import { Landing } from './screens/Landing'
import { LevelMap } from './screens/LevelMap'
import { LevelComplete } from './screens/LevelComplete'
import { FinalReport } from './screens/FinalReport'
import { TaskScreen } from './screens/TaskScreen'
import { Icon } from './components/Icon'

type Screen = 'landing' | 'levels' | 'task' | 'levelComplete' | 'report'

const allTaskIds = tasks.map((task) => task.id)

function getSaved(): StoredProgress | null {
  if (typeof window === 'undefined') return null
  return loadProgress()
}

export default function App() {
  const saved = useMemo(getSaved, [])
  const [screen, setScreen] = useState<Screen>(saved?.started ? 'levels' : 'landing')
  const [results, setResults] = useState<TaskResult[]>(saved?.results ?? [])
  const [coins, setCoins] = useState(saved?.coins ?? 0)
  const [queueIds, setQueueIds] = useState<string[]>(saved?.queueIds?.length ? saved.queueIds : allTaskIds)
  const [currentTaskId, setCurrentTaskId] = useState(saved?.currentTaskId || allTaskIds[0])
  const [completedLevel, setCompletedLevel] = useState<Level>(1)
  const [levelCoins, setLevelCoins] = useState(0)
  const [isRetryRun, setIsRetryRun] = useState(false)

  useEffect(() => {
    if (screen === 'landing' && !results.length) return
    saveProgress({ started: true, currentTaskId, queueIds, coins, results })
  }, [screen, currentTaskId, queueIds, coins, results])

  const currentTask = tasks.find((task) => task.id === currentTaskId) ?? tasks[0]
  const taskNumber = Math.max(1, queueIds.indexOf(currentTask.id) + 1)

  const startShift = () => setScreen('levels')
  const startOver = () => { clearProgress(); setResults([]); setCoins(0); setQueueIds(allTaskIds); setCurrentTaskId(allTaskIds[0]); setIsRetryRun(false); setScreen('landing') }
  const openLevel = (level: Level) => {
    const levelTaskIds = tasks.filter((task) => task.level === level).map((task) => task.id)
    const remaining = levelTaskIds.filter((id) => !results.some((result) => result.taskId === id))
    setQueueIds(remaining.length ? remaining : levelTaskIds)
    setCurrentTaskId(remaining[0] ?? levelTaskIds[0])
    setIsRetryRun(false)
    setScreen('task')
  }
  const handleFinished = (result: TaskResult, earnedCoins: number) => {
    setResults((previous) => [...previous.filter((item) => item.taskId !== result.taskId), result].sort((a, b) => allTaskIds.indexOf(a.taskId) - allTaskIds.indexOf(b.taskId)))
    setCoins((value) => value + earnedCoins)
    setLevelCoins((value) => value + earnedCoins)
  }
  const handleNext = () => {
    const queueIndex = queueIds.indexOf(currentTaskId)
    const nextId = queueIds[queueIndex + 1]
    if (nextId) { setCurrentTaskId(nextId); return }
    if (isRetryRun) { setScreen('report'); return }
    setCompletedLevel(currentTask.level)
    setScreen('levelComplete')
  }
  const handleNextLevel = () => {
    if (completedLevel === 3) { setScreen('report'); return }
    const nextLevel = (completedLevel + 1) as Level
    openLevel(nextLevel)
    setLevelCoins(0)
  }
  const retryMistakes = () => {
    const mistakeIds = tasks.filter((task) => !results.find((result) => result.taskId === task.id)?.correctFirstTry).map((task) => task.id)
    if (!mistakeIds.length) { setScreen('report'); return }
    setQueueIds(mistakeIds); setCurrentTaskId(mistakeIds[0]); setLevelCoins(0); setIsRetryRun(true); setScreen('task')
  }
  const playAgain = () => { clearProgress(); setResults([]); setCoins(0); setQueueIds(allTaskIds); setCurrentTaskId(allTaskIds[0]); setLevelCoins(0); setIsRetryRun(false); setScreen('levels') }

  return <div className="min-h-screen bg-[#FFF8EC] text-[#3D2A20]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-12"><button type="button" onClick={() => setScreen(results.length ? 'levels' : 'landing')} className="flex items-center gap-3 rounded-xl text-left" aria-label="Пиццерия Дробь, на главную"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D94F3D] text-[#FFF8EC] shadow-[0_3px_0_#AC382B]"><Icon name="pizza" size={22} /></span><span className="hidden sm:block"><span className="block text-[10px] font-black uppercase tracking-[.16em] text-[#D94F3D]">пиццерия</span><span className="block text-lg font-black leading-none">«Дробь»</span></span></button><div className="flex items-center gap-3"><span className="hidden text-xs font-bold text-[#8C776B] sm:inline">шеф Тоша на связи</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FCE5D9] text-lg" aria-hidden="true">👨‍🍳</span></div></header>
    {screen === 'landing' && <Landing onStart={startShift} hasProgress={Boolean(saved?.started && results.length)} />}
    {screen === 'levels' && <LevelMap results={results} coins={coins} onSelectLevel={openLevel} onRestart={startOver} />}
    {screen === 'task' && <TaskScreen task={currentTask} taskNumber={taskNumber} totalTasks={queueIds.length === allTaskIds.length ? tasks.length : queueIds.length} coins={coins} onFinished={handleFinished} onNext={handleNext} onBack={() => setScreen('levels')} />}
    {screen === 'levelComplete' && <LevelComplete level={completedLevel} stars={Math.max(1, Math.min(3, (results.filter((result) => result.level === completedLevel && result.correctFirstTry).length >= 4 ? 3 : results.filter((result) => result.level === completedLevel && result.correctFirstTry).length >= 3 ? 2 : 1)))} coins={levelCoins} isFinal={completedLevel === 3} onNext={handleNextLevel} onMap={() => setScreen('levels')} />}
    {screen === 'report' && <FinalReport results={results} coins={coins} onPlayAgain={playAgain} onRetryMistakes={retryMistakes} />}
    <footer className="mx-auto max-w-7xl px-4 pb-6 pt-4 text-center text-xs font-bold text-[#b5a093] sm:px-8 lg:px-12">Пиццерия «Дробь» · учимся видеть размер кусочка</footer>
  </div>
}
