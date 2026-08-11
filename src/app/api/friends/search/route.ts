import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { parseXP } from '@/lib/progress-stats'

import { createRateLimiter } from '@/lib/rate-limit'

const searchLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000, keyPrefix: 'search' })

// GET - search users by name or email (for adding friends)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (!searchLimiter.check(user.id)) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите минуту.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] })
    }
    if (q.length > 100) {
      return NextResponse.json({ users: [] })
    }

    // Search by name only (email search disabled for privacy)
    const users = await db.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          { isPublic: true },
          { name: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
      },
      take: 20,
    })

    // Fetch progressData and friendships in parallel
    const userIds = users.map((u) => u.id)
    const [userProgress, friendships] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, progressData: true },
      }),
      db.friendship.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: { in: userIds } },
            { receiverId: user.id, senderId: { in: userIds } },
          ],
        },
      }),
    ])

    const progressMap = new Map<string, string | null>(userProgress.map((u) => [u.id, u.progressData]))

    const friendshipMap = new Map<string, { status: string; direction: 'sent' | 'received' }>()
    friendships.forEach((f) => {
      if (f.senderId === user.id) {
        friendshipMap.set(f.receiverId, { status: f.status, direction: 'sent' })
      } else {
        friendshipMap.set(f.senderId, { status: f.status, direction: 'received' })
      }
    })

    const result = users.map((u) => {
      const { xp, level } = parseXP(progressMap.get(u.id) ?? null)
      const friendship = friendshipMap.get(u.id)
      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        bio: u.bio,
        xp,
        level,
        friendship: friendship || null,
      }
    })

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Ошибка поиска' }, { status: 500 })
  }
}
