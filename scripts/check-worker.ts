/**
 * Checks the Cloudflare Worker proxy against a mocked DeepSeek API (no key or network needed).
 * Run: npm run check:worker
 */
import { handle, type Env } from '../worker/src/index'

const SITE = 'https://inversion322.github.io'
const env: Env = { DEEPSEEK_API_KEY: 'test-key', ALLOWED_ORIGINS: `${SITE},http://localhost:5173` }

let failures = 0
function expect(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` → ${JSON.stringify(detail)}`}`)
  if (!ok) failures++
}

/** A fake DeepSeek: returns the queued contents one by one and records requests. */
function fakeDeepSeek(contents: Array<string | { status: number }>) {
  const calls: any[] = []
  const upstream = (async (_url: unknown, init?: { body?: string; headers?: Record<string, string> }) => {
    calls.push({ body: JSON.parse(init?.body ?? '{}'), headers: init?.headers })
    const next = contents.shift() ?? ''
    if (typeof next !== 'string') return new Response('{}', { status: next.status })
    return new Response(JSON.stringify({ choices: [{ message: { content: next }, finish_reason: 'stop' }] }), { status: 200 })
  }) as unknown as typeof fetch
  return { upstream, calls }
}

const post = (path: string, body: unknown, origin = SITE, ip = '1.1.1.1') =>
  new Request(`https://proxy.example${path}`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) })

const chatBody = (event: string) => ({
  event,
  fallback: 'Пока не сходится. Подсказка: приведи дроби к общему знаменателю 6.',
  task: { text: 'Вычисли: 1/2 + 1/3 = ?', topic: 'Сложение', level: 3, answer: '5/6', hint: 'Общий знаменатель 6.', solution: '3/6 + 2/6 = 5/6.' },
  shift: { firstTry: 8, total: 12, weakTopics: ['Сложение и вычитание'], misconceptions: ['Складываю числители и знаменатели'] },
  history: [{ role: 'chef', text: 'Привет!' }],
  studentMessage: '2/5',
})

async function main() {
  // CORS
  let r = await handle(new Request('https://proxy.example/chat', { method: 'OPTIONS', headers: { Origin: SITE } }), env)
  expect('preflight from the site is allowed', r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === SITE, r.status)
  r = await handle(post('/chat', chatBody('wrong'), 'https://evil.example'), env, fakeDeepSeek([]).upstream)
  expect('other origins are rejected', r.status === 403, r.status)

  // Routing and validation
  r = await handle(post('/nope', {}), env, fakeDeepSeek([]).upstream)
  expect('unknown route → 404', r.status === 404, r.status)
  r = await handle(post('/chat', { event: 'hack' }), env, fakeDeepSeek([]).upstream)
  expect('invalid chat body → 400', r.status === 400, r.status)
  r = await handle(post('/chat', { event: 'start', fallback: 'x'.repeat(20_000) }), env, fakeDeepSeek([]).upstream)
  expect('oversized body → 413', r.status === 413, r.status)
  r = await handle(post('/chat', chatBody('start')), { ...env, DEEPSEEK_API_KEY: '' }, fakeDeepSeek([]).upstream)
  expect('missing key → 503 (site falls back)', r.status === 503, r.status)

  // Chat: request shape and a normal reply
  let fake = fakeDeepSeek([JSON.stringify({ reply: 'Почти! Знаменатели не складывают — сначала сделай куски одного размера.' })])
  r = await handle(post('/chat', chatBody('wrong')), env, fake.upstream)
  const sent = fake.calls[0]?.body
  expect('chat reply passes through', r.status === 200 && (await r.json() as any).reply.startsWith('Почти'), r.status)
  expect('uses deepseek-flash, JSON mode, thinking off', sent?.model === 'deepseek-flash' && sent?.response_format?.type === 'json_object' && sent?.thinking?.type === 'disabled', sent)
  expect('prompt mentions json (required by JSON mode)', /json/i.test(sent?.messages?.[0]?.content ?? ''), null)
  expect('key sent only as a Bearer header', fake.calls[0]?.headers?.Authorization === 'Bearer test-key' && !JSON.stringify(sent).includes('test-key'), null)

  // Chat: the answer must not leak while the student is solving
  fake = fakeDeepSeek([JSON.stringify({ reply: 'Правильно будет 5/6, потому что…' })])
  r = await handle(post('/chat', chatBody('wrong')), env, fake.upstream)
  expect('leaked answer is replaced by the fallback', (await r.json() as any).reply === chatBody('wrong').fallback, null)
  fake = fakeDeepSeek([JSON.stringify({ reply: 'Решаем: 3/6 + 2/6 = 5/6. Ответ 5/6.' })])
  r = await handle(post('/chat', chatBody('reveal')), env, fake.upstream)
  expect('reveal may name the answer', (await r.json() as any).reply.includes('5/6'), null)

  // Robustness: blank JSON-mode content is retried; upstream errors become 502
  fake = fakeDeepSeek(['   ', JSON.stringify({ reply: 'Со второго раза.' })])
  r = await handle(post('/chat', chatBody('correct')), env, fake.upstream)
  expect('blank content is retried once', r.status === 200 && fake.calls.length === 2, { status: r.status, calls: fake.calls.length })
  r = await handle(post('/chat', chatBody('correct')), env, fakeDeepSeek([{ status: 402 }]).upstream)
  expect('402 insufficient balance → 502', r.status === 502, r.status)
  r = await handle(post('/chat', chatBody('correct')), env, fakeDeepSeek(['not json', 'still not json']).upstream)
  expect('non-JSON output → 502', r.status === 502, r.status)

  // Puzzle and report shapes
  fake = fakeDeepSeek([JSON.stringify({ feedback: 'Была заминка с 1/4 и 1/8.', misconception: 'DENOM_BIGGER' })])
  r = await handle(post('/puzzle', { taskId: 'task-4', puzzle: 'order', task: 'Выдай куски', mistakes: 1, moves: ['ошибка: 1/4 выдан раньше, чем 1/8'], misconceptions: ['DENOM_BIGGER'] }), env, fake.upstream)
  const puzzle = await r.json() as any
  expect('puzzle review shape', r.status === 200 && puzzle.feedback && puzzle.misconception === 'DENOM_BIGGER', puzzle)
  fake = fakeDeepSeek([JSON.stringify({ summary: 'Итог.', strengths: ['a'], focus: ['b'], nextSteps: ['c'], extra: 'dropped' })])
  r = await handle(post('/report', [{ taskId: 'task-1', topic: 'сравнение', correctFirstTry: true, attempts: 1, usedHint: false, misconceptions: [] }]), env, fake.upstream)
  const report = await r.json() as any
  expect('report shape (extra fields dropped)', r.status === 200 && report.summary && report.strengths.length === 1 && !('extra' in report), report)

  // Rate limit
  let limited = 0
  for (let i = 0; i < 45; i++) {
    const res = await handle(post('/chat', { event: 'hack' }, SITE, '9.9.9.9'), env, fakeDeepSeek([]).upstream)
    if (res.status === 429) limited++
  }
  expect('rate limit kicks in after 40 requests a minute', limited === 5, limited)

  console.log(failures ? `${failures} check(s) failed` : 'all proxy checks passed')
  if (failures) throw new Error('proxy checks failed')
}

void main()
