import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrthographicCamera } from 'three'
import { ELEVATION, cameraStore as store } from './cameraStore'

const DIST = 90

// Caméra isométrique : déplacement (glisser / WASD / flèches), zoom (molette / pincement / +-),
// rotation (Q/E par quarts de tour, boutons, ou clic droit / Maj + glisser en continu).
export function CameraRig() {
  const { camera, gl, invalidate } = useThree()

  useEffect(() => {
    store.wake = invalidate
    ;(window as unknown as { __neoCamera?: typeof store }).__neoCamera = store // pour les tests
    const el = gl.domElement
    let mode: 'pan' | 'rotate' | null = null
    let lx = 0
    let ly = 0

    const down = (e: PointerEvent) => {
      mode = e.button === 2 || e.button === 1 || e.shiftKey ? 'rotate' : e.button === 0 ? 'pan' : null
      if (!mode) return
      lx = e.clientX
      ly = e.clientY
      el.setPointerCapture(e.pointerId)
      el.style.cursor = mode === 'pan' ? 'grabbing' : 'ew-resize'
    }
    const move = (e: PointerEvent) => {
      if (!mode) return
      const dx = e.clientX - lx
      const dy = e.clientY - ly
      lx = e.clientX
      ly = e.clientY
      if (mode === 'rotate') {
        store.rotateFree(-dx * 0.006)
      } else {
        const { yaw, zoom } = store.goal
        const c = Math.cos(yaw)
        const s = Math.sin(yaw)
        // droite écran = (cos, 0, -sin) ; « devant » (vers le fond) = (-sin, 0, -cos)
        const right = dx / zoom
        const fwd = dy / (zoom * Math.sin(ELEVATION))
        store.panBy(-right * c - fwd * s, right * s - fwd * c)
      }
    }
    const up = (e: PointerEvent) => {
      mode = null
      el.style.cursor = 'grab'
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : 1
      const k = e.ctrlKey ? 0.01 : 0.0018 // ctrlKey = pincement sur trackpad Mac
      store.zoomBy(Math.exp(-e.deltaY * unit * k))
    }
    const menu = (e: Event) => e.preventDefault()

    const keyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'q') store.rotateStep(-1)
      else if (k === 'e') store.rotateStep(1)
      else if (k === 'r') store.reset()
      else if (k === '+' || k === '=') store.zoomBy(1.25)
      else if (k === '-' || k === '_') store.zoomBy(1 / 1.25)
      else if ('wasd'.includes(k) && k.length === 1 || k.startsWith('arrow')) {
        store.keys.add(k)
        e.preventDefault()
        invalidate()
      }
    }
    const keyUp = (e: KeyboardEvent) => store.keys.delete(e.key.toLowerCase())
    const blur = () => store.keys.clear()

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('contextmenu', menu)
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', blur)
    return () => {
      store.wake = () => {}
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('contextmenu', menu)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', blur)
    }
  }, [gl, invalidate])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { goal, cur, keys } = store

    if (keys.size) {
      const speed = (650 * dt) / goal.zoom // vitesse constante à l'écran
      const c = Math.cos(goal.yaw)
      const s = Math.sin(goal.yaw)
      const ax = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0)
      const az = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0)
      store.panBy((ax * c - az * s) * speed, (-ax * s - az * c) * speed)
    }

    const k = 1 - Math.exp(-dt * 12)
    cur.x += (goal.x - cur.x) * k
    cur.z += (goal.z - cur.z) * k
    cur.yaw += (goal.yaw - cur.yaw) * k
    cur.zoom += (goal.zoom - cur.zoom) * k

    const settled =
      Math.abs(goal.x - cur.x) < 1e-3 && Math.abs(goal.z - cur.z) < 1e-3 &&
      Math.abs(goal.yaw - cur.yaw) < 1e-4 && Math.abs(goal.zoom - cur.zoom) < 1e-2
    if (settled) Object.assign(cur, goal)

    const ce = Math.cos(ELEVATION)
    camera.position.set(cur.x + DIST * ce * Math.sin(cur.yaw), DIST * Math.sin(ELEVATION), cur.z + DIST * ce * Math.cos(cur.yaw))
    camera.lookAt(cur.x, 0, cur.z)
    const cam = camera as OrthographicCamera
    if (cam.zoom !== cur.zoom) {
      cam.zoom = cur.zoom
      cam.updateProjectionMatrix()
    }
    if (!settled || keys.size) invalidate() // on ne redessine que quand quelque chose bouge
  })

  return null
}
