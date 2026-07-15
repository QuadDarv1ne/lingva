import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Per-user rate limiting for friend requests
const friendRequestLimits = new Map<string, { count: number; windowStart: number }>()
const MAX_FRIEND_REQUESTS_PER_HOUR = 20
const RATE_WINDOW_MS = 60 * 60 * 1000
let lastCleanup = 0
const CLEANUP_INTERVAL_MS = 5 * 60_000

function cleanupFriendLimits() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of friendRequestLimits) {
    if (now - entry.windowStart > RATE_WINDOW_MS) friendRequestLimits.delete(key)
  }
}

function checkFriendRequestRateLimit(userId: string): boolean {
  cleanupFriendLimits()
  const now = Date.now()
  const entry = friendRequestLimits.get(userId)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    friendRequestLimits.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_FRIEND_REQUESTS_PER_HOUR) return false
  entry.count++
  return true
}

// POST - send friend request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (!checkFriendRequestRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { receiverId } = body

    if (!receiverId || typeof receiverId !== 'string' || receiverId === user.id) {
      return NextResponse.json({ error: 'Неверный ID пользователя' }, { status: 400 })
    }

    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isPublic: true },
    })
    if (!receiver) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Check existing friendship
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId },
          { senderId: receiverId, receiverId: user.id },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Уже в друзьях' }, { status: 400 })
      }
      if (existing.status === 'pending') {
        // If the other person sent us a request, auto-accept
        if (existing.senderId === receiverId) {
          await db.friendship.update({
            where: { id: existing.id },
            data: { status: 'accepted' },
          })
          // Create notification for the original sender
          await db.notification.create({
            data: {
              userId: receiverId,
              type: 'friend_accepted',
              title: 'Заявка в друзья принята',
              message: `${user.name || user.email} принял(а) вашу заявку в друзья`,
              data: JSON.stringify({ senderId: user.id }),
            },
          })
          return NextResponse.json({ success: true, autoAccepted: true })
        }
        return NextResponse.json({ error: 'Заявка уже отправлена' }, { status: 400 })
      }
      if (existing.status === 'declined') {
        // Delete the old declined request and create a fresh one
        await db.friendship.delete({ where: { id: existing.id } })
        await db.friendship.create({
          data: { senderId: user.id, receiverId, status: 'pending' },
        })
      }
    } else {
      // Create new friendship
      await db.friendship.create({
        data: {
          senderId: user.id,
          receiverId,
          status: 'pending',
        },
      })
    }

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: receiverId,
        type: 'friend_request',
        title: 'Новая заявка в друзья',
        message: `${user.name || user.email} хочет добавить вас в друзья`,
        data: JSON.stringify({ senderId: user.id }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add friend error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
