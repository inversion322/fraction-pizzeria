/**
 * Cloudflare Worker: a thin proxy between the trainer (GitHub Pages) and the DeepSeek API.
 * - The API key lives only here, as a Worker secret (DEEPSEEK_API_KEY).
 * - Only the site's origins may call it (CORS allow-list), with a per-IP rate limit and size limits.
 * - Inputs are validated, model outputs are parsed and shape-checked; on any failure the worker
 *   answers with an error and the site falls back to its local texts.
 * Routes: POST /chat, POST /puzzle, POST /report.
 */
import { CHAT_TASK, PERSONA, PUZZLE_TASK, REPORT_TASK } from './prompts'

export interface Env {
  DEEPSEEK_API_KEY?: string
  ALLOWED_ORIGINS?: string // comma-separated, e.g. "https://user.github.io,http://localhost:5173"
  DEEPSEEK_MODEL?: string
}

type Fetch = typeof fetch
type Json = Record<string, unknown>

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_MODEL = 'deepseek-flash'
const MAX_BODY_BYTES = 16_000
const RATE_LIMIT = 40 // requests per IP per minute (best effort, per Worker instance)
const CODE_NAMES: Record<string, string> = {
  DENOM_BIGGER: '«Больше знаменатель — больше кусок»',
  ADD_ACROSS: '«Складываю числители и знаменатели»',
  NO_COMMON_DENOM: '«Забываю общий знаменатель»',
  EQUIV: '«Не вижу равные дроби»',
  WHOLE_PART: '«Путаюсь с целой частью»',
}
const CODES = Object.keys(CODE_NAMES)
/** Children must never see internal codes like ADD_ACROSS: send names to the model, scrub codes from its output. */
const named = (codes: string[]) => codes.map((c) => CODE_NAMES[c] ?? c)
const humanize = (text: string) => text.replace(/\b(DENOM_BIGGER|ADD_ACROSS|NO_COMMON_DENOM|EQUIV|WHOLE_PART|GENERIC)\b/g, (code) => CODE_NAMES[code] ?? 'ошибка')
const EVENTS = ['start', 'correct', 'almost', 'wrong', 'reveal', 'question', 'next']

// ---------- small validation helpers ----------
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const strList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, maxItems).map((x) => x.slice(0, maxLen)) : undefined
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

// ---------- routes ----------
interface Route {
  validate: (body: unknown) => Json | null
  task: string
  maxTokens: number
  shape: (output: Json, input: Json) => Json | null
}

const ROUTES: Record<string, Route> = {
  '/chat': {
    task: CHAT_TASK,
    maxTokens: 450,
    validate: (b) => {
      if (!isObj(b) || !EVENTS.includes(String(b.event))) return null
      const fallback = str(b.fallback, 1200)
      if (!fallback) return null
      const task = isObj(b.task)
        ? { text: str(b.task.text, 300), topic: str(b.task.topic, 80), level: num(b.task.level), answer: str(b.task.answer, 30), hint: str(b.task.hint, 400), solution: str(b.task.solution, 500) }
        : undefined
      const shift = isObj(b.shift)
        ? { firstTry: num(b.shift.firstTry), total: num(b.shift.total), weakTopics: strList(b.shift.weakTopics, 4, 80), misconceptions: strList(b.shift.misconceptions, 5, 80), previousFirstTry: num(b.shift.previousFirstTry) }
        : undefined
      const history = Array.isArray(b.history)
        ? b.history.filter(isObj).slice(-8).map((m) => ({ role: m.role === 'student' ? 'student' : 'chef', text: str(m.text, 400) ?? '' }))
        : []
      return { event: b.event, fallback, task, shift, history, studentMessage: str(b.studentMessage, 300) }
    },
    shape: (out, input) => {
      const reply = humanize(str(out.reply, 900)?.trim() ?? '')
      if (!reply) return null
      // Safety net: while the student is still solving, the reply must not give the answer away.
      const task = input.task as { text?: string; answer?: string } | undefined
      const solving = ['almost', 'wrong', 'question'].includes(String(input.event))
      if (solving && task?.answer && !task.text?.includes(task.answer) && mentions(reply, task.answer)) return { reply: input.fallback }
      return { reply }
    },
  },
  '/puzzle': {
    task: PUZZLE_TASK,
    maxTokens: 350,
    validate: (b) => {
      if (!isObj(b) || !['order', 'whole', 'boxes'].includes(String(b.puzzle))) return null
      const codes = (strList(b.misconceptions, 20, 20) ?? []).filter((c) => CODES.includes(c))
      return { puzzle: b.puzzle, task: str(b.task, 300), mistakes: Math.max(0, Math.min(50, num(b.mistakes) ?? 0)), moves: strList(b.moves, 30, 160) ?? [], misconceptions: codes, misconceptionNames: named(codes) }
    },
    shape: (out) => {
      const feedback = humanize(str(out.feedback, 700)?.trim() ?? '')
      if (!feedback) return null
      const code = typeof out.misconception === 'string' && CODES.includes(out.misconception) ? out.misconception : undefined
      return code ? { feedback, misconception: code } : { feedback }
    },
  },
  '/report': {
    task: REPORT_TASK,
    maxTokens: 600,
    validate: (b) => {
      if (!Array.isArray(b) || !b.length) return null
      const results = b.filter(isObj).slice(0, 20).map((r) => ({
        topic: str(r.topic, 80), correctFirstTry: r.correctFirstTry === true, attempts: num(r.attempts), usedHint: r.usedHint === true,
        mistakes: named((strList(r.misconceptions, 5, 20) ?? []).filter((c) => CODES.includes(c))), moves: strList(r.moves, 12, 120),
      }))
      return { total: results.length, firstTry: results.filter((r) => r.correctFirstTry).length, results }
    },
    shape: (out) => {
      const summary = humanize(str(out.summary, 600)?.trim() ?? '')
      const list = (v: unknown) => (strList(v, 4, 200) ?? []).map((x) => humanize(x.trim())).filter(Boolean)
      const strengths = list(out.strengths)
      const focus = list(out.focus)
      const nextSteps = list(out.nextSteps)
      if (!summary || !strengths.length || !focus.length || !nextSteps.length) return null
      return { summary, strengths, focus, nextSteps }
    },
  },
}

/** "5/6" or "1 1/2" appearing as a standalone fraction in the text. */
function mentions(text: string, answer: string): boolean {
  const escaped = answer.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+').replace(/\//g, '\\s*/\\s*')
  return new RegExp(`(^|[^\\d/])${escaped}(?![\\d/])`).test(text)
}

// ---------- DeepSeek ----------
async function askDeepSeek(env: Env, route: Route, input: Json, upstream: Fetch): Promise<Json | null> {
  const messages = [
    { role: 'system', content: `${PERSONA}\n\n${route.task}` },
    { role: 'user', content: `Данные (json):\n${JSON.stringify(input)}` },
  ]
  // JSON mode may return blank content now and then (per DeepSeek docs) — retry once.
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await upstream(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL || DEFAULT_MODEL,
        messages,
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' }, // short, fast replies; thinking is on by default
        temperature: 0.7,
        max_tokens: route.maxTokens,
        stream: false,
      }),
    })
    if (!response.ok) {
      console.warn('deepseek_error', response.status) // 402 balance, 429 rate limit, 5xx overload
      if (response.status >= 500 && attempt === 0) continue
      return null
    }
    const data = await response.json() as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }> }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content || data.choices?.[0]?.finish_reason === 'length') continue
    try {
      const parsed = JSON.parse(content)
      if (isObj(parsed)) return parsed
    } catch { /* retry */ }
  }
  return null
}

// ---------- rate limit (best effort: per Worker instance, resets every minute) ----------
const hits = new Map<string, { count: number; reset: number }>()
function allow(ip: string, now = Date.now()): boolean {
  const entry = hits.get(ip)
  if (!entry || entry.reset < now) { hits.set(ip, { count: 1, reset: now + 60_000 }); return true }
  entry.count++
  if (hits.size > 5000) hits.clear()
  return entry.count <= RATE_LIMIT
}

// ---------- HTTP ----------
function reply(body: Json, status: number, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors } })
}

export async function handle(request: Request, env: Env, upstream: Fetch = fetch): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
  const cors: Record<string, string> | null = allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : null

  if (request.method === 'OPTIONS') {
    if (!cors) return new Response(null, { status: 403 })
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } })
  }
  if (!cors) return reply({ error: 'origin_not_allowed' }, 403)
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405, cors)

  const route = ROUTES[new URL(request.url).pathname.replace(/\/+$/, '')]
  if (!route) return reply({ error: 'not_found' }, 404, cors)
  if (!allow(request.headers.get('CF-Connecting-IP') ?? 'unknown')) return reply({ error: 'rate_limited' }, 429, cors)

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return reply({ error: 'too_large' }, 413, cors)
  let body: unknown
  try { body = JSON.parse(raw) } catch { return reply({ error: 'bad_json' }, 400, cors) }
  const input = route.validate(body)
  if (!input) return reply({ error: 'bad_request' }, 400, cors)
  if (!env.DEEPSEEK_API_KEY) return reply({ error: 'not_configured' }, 503, cors)

  try {
    const output = await askDeepSeek(env, route, input, upstream)
    const shaped = output && route.shape(output, input)
    return shaped ? reply(shaped, 200, cors) : reply({ error: 'ai_unavailable' }, 502, cors)
  } catch (error) {
    console.warn('proxy_failure', error instanceof Error ? error.message : 'unknown')
    return reply({ error: 'ai_unavailable' }, 502, cors)
  }
}

export default { fetch: (request: Request, env: Env) => handle(request, env) }
