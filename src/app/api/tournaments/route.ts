import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentWeeklyTournament } from '@/lib/tournaments'

// GET - list active tournaments + user's participations
export async function GET() {
  try {
    const user = await getCurrentUser()

    // Ensure current weekly tournament exists
    await getCurrentWeeklyTournament()

    // Get active tournaments
    const active = await db.tournament.findMany({
      where: {
        isActive: true,
        endDate: { gt: new Date() },
      },
      orderBy: { endDate: 'asc' },
      include: {
        participants: {
          select: {
            userId: true,
            score: true,
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { score: 'desc' },
          take: 10, // top 10
        },
      },
    })

    const tournaments = active.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      startDate: t.startDate,
      endDate: t.endDate,
      prize: t.prize,
      participantsCount: t.participants.length,
      topUsers: t.participants.map((p, i) => ({
        rank: i + 1,
        userId: p.userId,
        name: p.user.name,
        avatar: p.user.avatar,
        score: p.score,
        isMe: user?.id === p.userId,
      })),
      daysLeft: Math.ceil((new Date(t.endDate).getTime() - Date.now()) / 86400000),
    }))

    // Get user's participations if logged in
    let myParticipations: {
      tournamentId: string
      score: number
      xpSnapshot: number
      joinedAt: Date
      tournament: {
        id: string
        title: string
        type: string
        endDate: Date
        isActive: boolean
      }
    }[] = []
    if (user) {
      const parts = await db.tournamentParticipant.findMany({
        where: { userId: user.id },
        include: { tournament: true },
      })
      myParticipations = parts.map((p) => ({
        tournamentId: p.tournamentId,
        score: p.score,
        xpSnapshot: p.xpSnapshot,
        joinedAt: p.joinedAt,
        tournament: {
          id: p.tournament.id,
          title: p.tournament.title,
          type: p.tournament.type,
          endDate: p.tournament.endDate,
          isActive: p.tournament.isActive,
        },
      }))
    }

    return NextResponse.json({
      tournaments,
      myParticipations,
    })
  } catch (error) {
    console.error('Get tournaments error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST - join a tournament
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { tournamentId } = body

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId обязателен' }, { status: 400 })
    }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
    })
    if (!tournament) {
      return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 })
    }
    if (!tournament.isActive || new Date(tournament.endDate) < new Date()) {
      return NextResponse.json({ error: 'Турнир завершён' }, { status: 400 })
    }

    // Check if already participating
    const existing = await db.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'Вы уже участвуете' }, { status: 400 })
    }

    // Get user's current XP from progressData
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { progressData: true },
    })
    let xpSnapshot = 0
    if (fullUser?.progressData) {
      try {
        const data = JSON.parse(fullUser.progressData)
        xpSnapshot = data.xp || 0
      } catch {
        // ignore
      }
    }

    await db.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: user.id,
        xpSnapshot,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Join tournament error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// PATCH - update participant's score (called periodically)
// Rate-limited: max once per hour per user per tournament
const lastScoreUpdate = new Map<string, number>()
const SCORE_UPDATE_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour
let lastScoreCleanup = 0
const SCORE_CLEANUP_INTERVAL_MS = 5 * 60_000

function cleanupScoreLimits() {
  const now = Date.now()
  if (now - lastScoreCleanup < SCORE_CLEANUP_INTERVAL_MS) return
  lastScoreCleanup = now
  for (const [key, ts] of lastScoreUpdate) {
    if (now - ts > SCORE_UPDATE_COOLDOWN_MS) lastScoreUpdate.delete(key)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    cleanupScoreLimits()

    const body = await req.json()
    const { tournamentId } = body

    if (!tournamentId || typeof tournamentId !== 'string') {
      return NextResponse.json({ error: 'tournamentId обязателен' }, { status: 400 })
    }

    // Rate limit: once per hour
    const rateKey = `${user.id}:${tournamentId}`
    const lastUpdate = lastScoreUpdate.get(rateKey)
    if (lastUpdate && Date.now() - lastUpdate < SCORE_UPDATE_COOLDOWN_MS) {
      return NextResponse.json({ error: 'Обновление раз в час' }, { status: 429 })
    }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
    })
    if (!tournament) {
      return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 })
    }
    if (!tournament.isActive || new Date(tournament.endDate) < new Date()) {
      return NextResponse.json({ error: 'Турнир завершён' }, { status: 400 })
    }

    const participation = await db.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    })
    if (!participation) {
      return NextResponse.json({ error: 'Не участвуете' }, { status: 404 })
    }

    // Get current XP and calculate delta from snapshot
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { progressData: true },
    })
    let currentXp = 0
    if (fullUser?.progressData) {
      try {
        const data = JSON.parse(fullUser.progressData)
        currentXp = typeof data.xp === 'number' ? Math.max(0, Math.floor(data.xp)) : 0
      } catch {
        // ignore
      }
    }

    const score = Math.max(0, currentXp - participation.xpSnapshot)

    await db.tournamentParticipant.update({
      where: { id: participation.id },
      data: { score },
    })

    lastScoreUpdate.set(rateKey, Date.now())

    return NextResponse.json({ success: true, score })
  } catch (error) {
    console.error('Update tournament score error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
