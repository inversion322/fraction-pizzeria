/**
 * Captures the README screenshots from the live site with a headless Chromium browser
 * (Chrome DevTools Protocol, no extra dependencies). Uses a throwaway profile.
 *
 *   npm run screenshots                       # live site
 *   SITE=http://localhost:5173/ npm run screenshots
 *   BROWSER="/path/to/chrome" npm run screenshots
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SITE = process.env.SITE ?? 'https://inversion322.github.io/fraction-pizzeria/'
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname
const BROWSER = process.env.BROWSER ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find((path) => existsSync(path))
const PORT = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- a tiny CDP client ----------
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
      if (res.ok) return (await res.json()).webSocketDebuggerUrl
    } catch { /* browser still starting */ }
    await sleep(200)
  }
  throw new Error('browser did not start')
}

function client(url) {
  const ws = new WebSocket(url)
  let id = 0
  const pending = new Map()
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  }
  const ready = new Promise((resolve) => { ws.onopen = resolve })
  const send = async (method, params = {}) => {
    await ready
    const msgId = ++id
    ws.send(JSON.stringify({ id: msgId, method, params }))
    const msg = await new Promise((resolve) => pending.set(msgId, resolve))
    if (msg.error) throw new Error(`${method}: ${msg.error.message}`)
    return msg.result
  }
  return { send, close: () => ws.close() }
}

// ---------- test data: a finished shift with typical mistakes ----------
const TOPICS = ['сравнение дробей', 'числитель и знаменатель', 'равные дроби', 'сравнение дробей', 'сложение с одинаковыми знаменателями', 'сложение с разными знаменателями', 'сложение с разными знаменателями', 'сложение с разными знаменателями', 'сложение нескольких дробей', 'сокращение дробей', 'смешанные числа', 'сокращение и смешанные числа']
const MISTAKES = { 1: ['DENOM_BIGGER'], 6: ['ADD_ACROSS'], 7: ['ADD_ACROSS'], 11: ['WHOLE_PART'] }
const results = (upTo) => TOPICS.slice(0, upTo).map((topic, i) => ({
  taskId: `task-${i + 1}`, level: i < 4 ? 1 : i < 8 ? 2 : 3, topic, correctFirstTry: !MISTAKES[i + 1], attempts: MISTAKES[i + 1] ? 2 : 1,
  usedHint: false, earnedCoins: MISTAKES[i + 1] ? 5 : 10, misconceptions: MISTAKES[i + 1] ?? [],
}))
const progress = (upTo) => JSON.stringify({ started: true, currentTaskId: 'task-1', queueIds: ['task-1'], coins: results(upTo).reduce((s, r) => s + r.earnedCoins, 0), results: results(upTo), fresh: true })

async function main() {
  mkdirSync(OUT, { recursive: true })
  const profile = mkdtempSync(join(tmpdir(), 'shots-'))
  const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--lang=ru-RU'], { stdio: 'ignore' })
  try {
    const page = client(await connect())
    const { send } = page
    const js = async (expression) => (await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true })).result.value
    const phone = () => send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
    const desktop = () => send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
    const open = async (storage) => {
      await send('Page.navigate', { url: SITE }); await sleep(1500)
      await js(`localStorage.clear(); ${storage ? `localStorage.setItem('drob-pizzeria-progress-v2', ${JSON.stringify(storage)});` : ''}`)
      await send('Page.navigate', { url: SITE }); await sleep(2000)
    }
    const click = (selectorJs) => js(`const el = ${selectorJs}; if (!el) throw new Error('not found'); el.click(); return true`)
    const byText = (text, sel = 'button') => `[...document.querySelectorAll('${sel}')].find((b) => b.textContent.includes(${JSON.stringify(text)}))`
    const shot = async (name) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'))
      console.log('saved', name)
    }
    await send('Page.enable'); await send('Runtime.enable')
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })

    // 1. Landing (desktop + phone)
    await desktop(); await open(null); await sleep(800); await shot('desktop-landing')
    await phone(); await open(null); await sleep(800); await shot('landing')

    // 2. A slice task: cut into 8, hand out 3
    await open(progress(1)); await click(byText('Первые куски')); await sleep(1500)
    await click(`[...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.trim() === '8')`); await sleep(700)
    await js(`const s = document.querySelectorAll('g.slice[role=button]'); [0, 1, 2].forEach((i) => s[i].dispatchEvent(new MouseEvent('click', { bubbles: true }))); return true`); await sleep(900)
    await js(`document.querySelector('section[aria-labelledby=instruction]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -112); return true`); await sleep(500)
    await shot('task-slice')

    // 3. A mistake and the chef's explanation
    await open(progress(5)); await click(byText('Собери заказ')); await sleep(1500)
    await js(`const n = document.querySelector('#numerator'), d = document.querySelector('#denominator'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(n, '2'); n.dispatchEvent(new Event('input', { bubbles: true })); set.call(d, '6'); d.dispatchEvent(new Event('input', { bubbles: true })); return true`); await sleep(300)
    await click(byText('Проверить')); await sleep(1200)
    await js(`window.scrollTo(0, 200); return true`); await sleep(400)
    await shot('feedback')

    // 4. Level 2 puzzle: build a whole pizza
    await open(progress(7)); await click(byText('Собери заказ')); await sleep(1500)
    await js(`for (const v of ['1/2', '1/3']) document.querySelector('button[aria-label="Положить кусок ' + v + '"]').click(); return true`); await sleep(900)
    await js(`document.querySelector('section[aria-labelledby=instruction]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -112); return true`); await sleep(500)
    await shot('puzzle-whole')

    // 5. Chef chat with the live AI
    await open(progress(12)); await click(`document.querySelectorAll('nav button')[1]`); await sleep(9000)
    await js(`const task = [...document.querySelectorAll('ol[role=log] > li')].pop().innerText; const m = task.match(/(\\d+)\\s+(\\d+)\\s+\\+\\s+(\\d+)\\s+(\\d+)/); const input = document.querySelector('#chat-input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(input, m ? (+m[1] + +m[3]) + '/' + (+m[2] + +m[4]) : '1/2'); input.dispatchEvent(new Event('input', { bubbles: true })); input.form.requestSubmit(); return true`)
    await sleep(8000); await js(`window.scrollTo(0, document.body.scrollHeight); return true`); await sleep(600)
    await shot('chat')

    // 6. Shift report with the AI note
    await click(`document.querySelectorAll('nav button')[0]`); await sleep(1200); await click(byText('Открыть разбор смены')); await sleep(9000)
    await js(`document.querySelector('#diagnosis').scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); return true`); await sleep(500)
    await shot('report')

    page.close()
  } finally {
    browser.kill()
    await sleep(500)
    rmSync(profile, { recursive: true, force: true })
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
