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
            progressData: true,
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
            progressData: true,
          },
        },
      },
    })

    const friends = [
      ...sentAccepted.map((f) => ({ ...f.receiver, friendshipId: f.id })),
      ...receivedAccepted.map((f) => ({ ...f.sender, friendshipId: f.id })),
    ]

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
      friends: friends.map(parseUserProgress),
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

function parseUserProgress(user: any) {
  let xp = 0
  let level = 1
  let streak = 0
  let achievementsCount = 0
  let languagesCount = 0

  if (user.progressData) {
    try {
      const data = JSON.parse(user.progressData)
      xp = data.xp || 0
      level = getLevelFromXP(xp).level
      streak = data.streak?.current || 0
      achievementsCount = data.achievements?.length || 0
      languagesCount = Object.keys(data.progress || {}).length
    } catch {
      // ignore
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.isPublic ? user.email : null,
    avatar: user.avatar,
    bio: user.bio,
    isPublic: user.isPublic,
    friendshipId: user.friendshipId,
    stats: { xp, level, streak, achievementsCount, languagesCount },
  }
}
