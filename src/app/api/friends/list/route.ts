import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getLevelFromXP } from '@/lib/level'

// GET - list user's friends (accepted) and pending requests
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Accepted friends (both directions)
    const sentAccepted = await db.friendship.findMany({
      where: { senderId: user.id, status: 'accepted' },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
            isPublic: true,
          },
        },
      },
    })

    const receivedAccepted = await db.friendship.findMany({
      where: { receiverId: user.id, status: 'accepted' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
            isPublic: true,
          },
        },
      },
    })

    const friends = [
      ...sentAccepted.map((f) => ({ ...f.receiver, friendshipId: f.id })),
      ...receivedAccepted.map((f) => ({ ...f.sender, friendshipId: f.id })),
    ]

    // Fetch progressData separately to compute stats (not exposed to client)
    const friendIds = friends.map((f) => f.id)
    const friendProgress = await db.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, progressData: true },
    })
    const progressMap = new Map(friendProgress.map((u) => [u.id, u.progressData]))

    // Pending requests received
    const pendingReceived = await db.friendship.findMany({
      where: { receiverId: user.id, status: 'pending' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Pending requests sent
    const pendingSent = await db.friendship.findMany({
      where: { senderId: user.id, status: 'pending' },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      friends: friends.map((f) => {
        const stats = computeStats(progressMap.get(f.id) ?? null)
        return { ...f, stats }
      }),
      pendingReceived: pendingReceived.map((f) => ({
        friendshipId: f.id,
        createdAt: f.createdAt,
        user: f.sender,
      })),
      pendingSent: pendingSent.map((f) => ({
        friendshipId: f.id,
        createdAt: f.createdAt,
        user: f.receiver,
      })),
    })
  } catch (error) {
    console.error('Get friends error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

function computeStats(progressData: string | null) {
  let xp = 0
  let level = 1
  let streak = 0
  let achievementsCount = 0
  let languagesCount = 0

  if (progressData) {
    try {
      const data = JSON.parse(progressData)
      xp = data.xp || 0
      level = getLevelFromXP(xp).level
      streak = data.streak?.current || 0
      achievementsCount = data.achievements?.length || 0
      languagesCount = Object.keys(data.progress || {}).length
    } catch {
      // ignore
    }
  }

  return { xp, level, streak, achievementsCount, languagesCount }
}
