import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { parseProgressStats } from '@/lib/progress-stats'

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
    const progressMap = new Map<string, string | null>(friendProgress.map((u) => [u.id, u.progressData]))

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
  return parseProgressStats(progressData)
}
