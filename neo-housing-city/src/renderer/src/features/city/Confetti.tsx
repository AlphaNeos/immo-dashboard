import { useEffect, useRef } from 'react'

// Célébration : pluie de confettis + pièces dorées, dessinée sur un calque transparent (aucune image).
interface P { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; c: string; life: number; coin: boolean }
const parts: P[] = []
let kick: (() => void) | null = null
const COLORS = ['#3de0ff', '#f7c948', '#ff6b8b', '#35d07f', '#b388ff', '#ffffff']

export function fireConfetti(x = window.innerWidth / 2, y = window.innerHeight / 3, n = 140) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 4 + Math.random() * 9
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[i % COLORS.length], life: 1, coin: i % 7 === 0
    })
  }
  kick?.()
}

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    let raf = 0
    const resize = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio }
    resize()
    window.addEventListener('resize', resize)
    const tick = () => {
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.009
        if (p.life <= 0 || p.y > innerHeight + 40) { parts.splice(i, 1); continue }
        ctx.globalAlpha = Math.min(1, p.life * 2)
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        if (p.coin) {
          ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.3, p.r * 1.3 * Math.abs(Math.cos(p.rot * 2)), 0, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#c98a00'; ctx.lineWidth = 1.5; ctx.stroke()
        } else {
          ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2)
        }
        ctx.restore()
      }
      raf = parts.length ? requestAnimationFrame(tick) : 0
    }
    kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
    return () => { cancelAnimationFrame(raf); kick = null; window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="confetti" aria-hidden />
}
