// Mesure du coût processeur des animations (moyenne glissante, en ms par image) — visible avec F3.
const parts: Record<string, number> = {}
export function timed(name: string, fn: () => void) {
  const t0 = performance.now()
  fn()
  parts[name] = (parts[name] ?? 0) + (performance.now() - t0 - (parts[name] ?? 0)) * 0.05
}
export const lifeMs = () => Object.values(parts).reduce((a, b) => a + b, 0)
