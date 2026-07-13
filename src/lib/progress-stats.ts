import { getLevelFromXP } from './level'
import type { LanguageProgressData } from './types'

export interface ProgressStats {
  xp: number
  level: number
  streak: number
  achievementsCount: number
  languagesCount: number
  lessonsCount: number
}

export function parseProgressStats(progressData: string | null): ProgressStats {
  const stats: ProgressStats = {
    xp: 0,
    level: 1,
    streak: 0,
    achievementsCount: 0,
    languagesCount: 0,
    lessonsCount: 0,
  }

  if (!progressData) return stats

  try {
    const data = JSON.parse(progressData)
    stats.xp = data.xp || 0
    stats.level = getLevelFromXP(stats.xp).level
    stats.streak = data.streak?.current || 0
    stats.achievementsCount = data.achievements?.length || 0

    const progress: { [key: string]: LanguageProgressData } = data.progress || {}
    stats.languagesCount = Object.keys(progress).length
    stats.lessonsCount = Object.values(progress).reduce(
      (sum: number, p: LanguageProgressData) => sum + (p.visitedLessons?.length || 0),
      0
    )
  } catch {
    // ignore parse errors
  }

  return stats
}

export function parseXP(progressData: string | null): { xp: number; level: number } {
  if (!progressData) return { xp: 0, level: 1 }
  try {
    const data = JSON.parse(progressData)
    const xp = data.xp || 0
    return { xp, level: getLevelFromXP(xp).level }
  } catch {
    return { xp: 0, level: 1 }
  }
}
