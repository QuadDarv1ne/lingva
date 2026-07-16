// Helper functions for tournament management
import { db } from '@/lib/db'

const TOURNAMENT_TYPES = {
  weekly_xp: {
    title: 'Недельный XP-забег',
    description: 'Зарабатывай больше всех XP за неделю!',
    prize: '🏆 Золотой бейдж + 500 бонусных XP',
  },
  weekly_streak: {
    title: 'Стрик-чемпион',
    description: 'Поддержи стрик все 7 дней недели',
    prize: '🔥 Особый бейдж стрика',
  },
  language_challenge: {
    title: 'Полиглот недели',
    description: 'Изучи больше всего новых букв и слов',
    prize: '🌍 Бейдж Полиглот',
  },
}

/**
 * Get or create the current weekly tournament
 * Each week starts on Monday
 */
export async function getCurrentWeeklyTournament() {
  const now = new Date()

  // Find start of current week (Monday)
  const dayOfWeek = now.getDay() // 0 = Sunday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + daysToMonday)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  // Check if tournament exists for this week
  const existing = await db.tournament.findFirst({
    where: {
      startDate: { gte: weekStart, lt: weekEnd },
      type: 'weekly_xp',
    },
  })

  if (existing) return existing

  // Create new weekly tournament (handle race condition with upsert)
  const weekNum = getWeekNumber(now)
  const config = TOURNAMENT_TYPES.weekly_xp
  return db.tournament.upsert({
    where: {
      startDate_type: {
        startDate: weekStart,
        type: 'weekly_xp',
      },
    },
    create: {
      title: `${config.title} #${weekNum}`,
      description: config.description,
      type: 'weekly_xp',
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true,
      prize: config.prize,
    },
    update: {},
  })
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
