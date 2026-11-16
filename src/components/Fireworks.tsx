import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const COLORS = ['#CF402A', '#F2B431', '#2C744E', '#E8743B', '#B83A8F', '#3B7DD8', '#FFD567']

interface Rocket { x: number; y: number; vx: number; vy: number; targetY: number; color: string }
interface Spark { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

/**
 * Full-screen celebration. A volley launches on mount; afterwards every tap or click
 * anywhere on the screen sends another rocket to that spot. The loop sleeps when idle,
 * and nothing renders for people who prefer reduced motion.
 */
export function Fireworks({ volley = 7 }: { volley?: number }) {
  const reduce = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduce) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rockets: Rocket[] = []
    const sparks: Spark[] = []
    let frame = 0
    let running = false
    let last = 0
    const timers: number[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)]

    const launch = (x: number, y: number) => {
      const startX = x + (Math.random() - 0.5) * 120
      const startY = window.innerHeight + 10
      const frames = 38 + Math.random() * 10
      rockets.push({ x: startX, y: startY, vx: (x - startX) / frames, vy: (y - startY) / frames, targetY: y, color: pick() })
      if (!running) { running = true; last = performance.now(); frame = requestAnimationFrame(tick) }
    }

    const explode = (r: Rocket) => {
      const count = 46 + Math.floor(Math.random() * 20)
      const second = Math.random() < 0.5 ? pick() : r.color
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2
        const speed = 2.2 + Math.random() * 3.4
        const max = 55 + Math.random() * 30
        sparks.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: max, max, color: i % 3 ? r.color : second, size: 2.2 + Math.random() * 2 })
      }
    }

    // Physics runs on real time (dt = 1 at 60 fps), so 120 Hz screens and slow phones look the same.
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.lineCap = 'round'

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        const px = r.x; const py = r.y
        r.x += r.vx * dt; r.y += r.vy * dt
        ctx.strokeStyle = r.color
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(px - r.vx * 3, py - r.vy * 3); ctx.lineTo(r.x, r.y); ctx.stroke()
        if (r.y <= r.targetY) { explode(r); rockets.splice(i, 1) }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.px = s.x; s.py = s.y
        const drag = Math.pow(0.975, dt)
        s.vx *= drag; s.vy = s.vy * drag + 0.055 * dt
        s.x += s.vx * dt; s.y += s.vy * dt
        s.life -= dt
        const alpha = Math.max(0, s.life / s.max)
        ctx.globalAlpha = alpha
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.size
        ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke()
        if (s.life <= 0) sparks.splice(i, 1)
      }
      ctx.globalAlpha = 1

      if (rockets.length || sparks.length) frame = requestAnimationFrame(tick)
      else { running = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight) }
    }

    // Opening volley across the screen.
    for (let i = 0; i < volley; i++) {
      timers.push(window.setTimeout(() => {
        launch(window.innerWidth * (0.15 + Math.random() * 0.7), window.innerHeight * (0.15 + Math.random() * 0.35))
      }, 150 + i * 260))
    }

    const onPointer = (event: PointerEvent) => launch(event.clientX, event.clientY)
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('resize', resize)
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('resize', resize)
    }
  }, [reduce, volley])

  if (reduce) return null
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden="true" />
}
