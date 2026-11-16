import { useCallback, useEffect, useRef, useState } from 'react'
import { getMisconception } from '../../data/misconceptions'
import { tutorTurn, type TutorEvent } from '../ai'
import { asMixed, TOPICS, type TopicId, type TutorTask } from './generator'
import {
  ALL_DONE, checkAnswer, correctReply, greeting, newTutorState, nextTask, parseAnswer, questionReply, revealReply, settleTask, wrongReply,
  type ShiftSnapshot, type TutorState,
} from './engine'
import { messageId, type ChatMessage, type TutorStore } from './storage'

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
const answerText = (task: TutorTask) => (task.answer.numerator >= task.answer.denominator ? asMixed(task.answer) : `${task.answer.numerator}/${task.answer.denominator}`)

/**
 * The chef chat as a small state machine: the generator makes the tasks and checks answers
 * exactly; the AI (when connected) only phrases the chef's replies. Everything is persisted.
 */
export function useTutorChat(store: TutorStore, setStore: (update: (store: TutorStore) => TutorStore) => void) {
  const shift = store.shifts[store.shifts.length - 1] as ShiftSnapshot | undefined
  const previous = store.shifts[store.shifts.length - 2] as ShiftSnapshot | undefined
  const [typing, setTyping] = useState(false)
  // Latest chat in a ref: replies arrive asynchronously and must append to the newest list.
  const chatRef = useRef(store.chat)
  chatRef.current = store.chat
  const started = useRef<string | null>(null)

  const commit = useCallback((state: TutorState, add: ChatMessage[] = []) => {
    const messages = [...(chatRef.current?.messages ?? []), ...add]
    chatRef.current = { state, messages }
    setStore((s) => ({ ...s, chat: { state, messages } }))
  }, [setStore])

  const summary = useCallback(() => {
    const state = chatRef.current?.state
    return {
      firstTry: shift?.firstTry ?? 0,
      total: shift?.total ?? 12,
      weakTopics: (state?.topics ?? []).filter((t) => t.mistakes > 0).map((t) => TOPICS[t.id].name),
      misconceptions: [...new Set((shift?.results ?? []).flatMap((r) => r.misconceptions).filter((c) => c !== 'GENERIC'))].map((c) => getMisconception(c).name),
      previousFirstTry: previous?.firstTry,
    }
  }, [shift, previous])

  /** Ask the chef (AI or local words) and append the reply. */
  const say = useCallback(async (event: TutorEvent, fallback: string, task: TutorTask | null, studentMessage?: string) => {
    setTyping(true)
    const history = (chatRef.current?.messages ?? []).slice(-8).map((m) => m.kind === 'task'
      ? { role: 'chef' as const, text: `Задача: ${m.task.text}` }
      : { role: m.kind === 'student' ? 'student' as const : 'chef' as const, text: m.text })
    const [result] = await Promise.all([
      tutorTurn({
        event, fallback, studentMessage, history, shift: summary(),
        task: task ? { text: task.text, topic: TOPICS[task.topic].name, level: task.level, answer: answerText(task), hint: task.hint, solution: task.solution } : undefined,
      }),
      sleep(500),
    ])
    setTyping(false)
    const state = chatRef.current?.state
    if (state) commit(state, [{ id: messageId(), kind: 'chef', text: result.reply }])
  }, [commit, summary])

  const giveTask = useCallback(async (sameTopic?: TopicId) => {
    const state = chatRef.current?.state
    if (!state) return
    const next = nextTask(state, sameTopic)
    if (!next.current) { commit(next); await say('next', ALL_DONE, null); return }
    await sleep(250)
    commit(next, [{ id: messageId(), kind: 'task', task: next.current, number: next.taskCount }])
  }, [commit, say])

  // A new finished shift starts a new conversation.
  useEffect(() => {
    if (!shift || store.chat?.state.shiftId === shift.id || started.current === shift.id) return
    started.current = shift.id
    const state = newTutorState(shift)
    chatRef.current = { state, messages: [] }
    setStore((s) => ({ ...s, chat: { state, messages: [] } }))
    void (async () => {
      await say('start', greeting(shift, previous, state.topics), null)
      await giveTask()
    })()
  }, [shift, previous, store.chat?.state.shiftId, setStore, say, giveTask])

  const busy = typing
  const current = store.chat?.state.current ?? null

  const reveal = useCallback(async () => {
    const state = chatRef.current?.state
    const task = state?.current
    if (!state || !task) return
    const settled = settleTask(state, false)
    commit({ ...settled.state, current: null })
    await say('reveal', revealReply(task), task)
    await giveTask(task.topic)
  }, [commit, say, giveTask])

  const send = useCallback(async (raw: string) => {
    const text = raw.trim()
    const state = chatRef.current?.state
    if (!text || !state || busy) return
    const task = state.current
    const parsed = parseAnswer(text)
    if (!task || !parsed) {
      commit(state, [{ id: messageId(), kind: 'student', text }])
      if (!task && /дальше|ещё|еще|давай|задач/i.test(text)) { await giveTask(); return }
      await say('question', questionReply(task), task, text)
      return
    }
    const verdict = checkAnswer(task, parsed)
    commit(state, [{ id: messageId(), kind: 'student', text, verdict: verdict.kind }])
    if (verdict.kind === 'correct') {
      const settled = settleTask(state, true)
      commit({ ...settled.state, current: null })
      await say('correct', correctReply(verdict, task.topic, settled.levelUp, settled.mastered), task, text)
      await giveTask()
      return
    }
    if (verdict.kind === 'almost') { await say('almost', wrongReply(task, verdict), task, text); return }
    const attempts = state.attempts + 1
    commit({ ...state, attempts })
    if (attempts >= 2) { await reveal(); return }
    await say('wrong', wrongReply(task, verdict), task, text)
  }, [busy, commit, say, giveTask, reveal])

  const hint = useCallback(async () => {
    const state = chatRef.current?.state
    if (!state?.current || busy) return
    commit(state, [{ id: messageId(), kind: 'student', text: 'Дай подсказку' }])
    await say('question', `Подсказка: ${state.current.hint}`, state.current, 'Дай подсказку')
  }, [busy, commit, say])

  const showSolution = useCallback(async () => {
    const state = chatRef.current?.state
    if (!state?.current || busy) return
    commit(state, [{ id: messageId(), kind: 'student', text: 'Покажи решение' }])
    await reveal()
  }, [busy, commit, reveal])

  const skip = useCallback(async () => {
    const state = chatRef.current?.state
    if (!state?.current || busy) return
    commit({ ...state, current: null }, [{ id: messageId(), kind: 'student', text: 'Дай другую задачу' }])
    await giveTask(state.current.topic)
  }, [busy, commit, giveTask])

  return { shift, previous, chat: store.chat, current, typing, busy, send, hint, showSolution, skip }
}
