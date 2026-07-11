// Shared level calculation (usable on both client and server)
// Levels: each level needs level^2 * 100 XP cumulative

export function getLevelFromXP(xp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 1
  let needed = 100
  let total = 0
  while (xp >= total + needed) {
    total += needed
    level++
    needed = level * 100
  }
  const current = xp - total
  return {
    level,
    current,
    needed,
    pct: Math.round((current / needed) * 100),
  }
}
