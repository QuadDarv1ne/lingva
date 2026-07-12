import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getLevelFromXP } from '@/lib/level'

// GET - search users by name or email (for adding friends)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
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

    // Fetch progressData separately for stats computation
    const userIds = users.map((u) => u.id)
    const userProgress = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, progressData: true },
    })
    const progressMap = new Map<string, string | null>(userProgress.map((u) => [u.id, u.progressData as string | null]))

    // Get friendship status for each user
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: { in: users.map((u) => u.id) } },
          { receiverId: user.id, senderId: { in: users.map((u) => u.id) } },
        ],
      },
    })

    const friendshipMap = new Map<string, { status: string; direction: 'sent' | 'received' }>()
    friendships.forEach((f) => {
      if (f.senderId === user.id) {
        friendshipMap.set(f.receiverId, { status: f.status, direction: 'sent' })
      } else {
        friendshipMap.set(f.senderId, { status: f.status, direction: 'received' })
      }
    })

    const result = users.map((u) => {
      let xp = 0
      let level = 1
      const progressData = progressMap.get(u.id)
      if (progressData) {
        try {
          const data = JSON.parse(progressData)
          xp = data.xp || 0
          level = getLevelFromXP(xp).level
        } catch {
          // ignore
        }
      }
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
