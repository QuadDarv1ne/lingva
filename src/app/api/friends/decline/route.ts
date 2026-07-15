import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST - decline friend request or cancel sent request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { friendshipId } = body

    if (!friendshipId || typeof friendshipId !== 'string') {
      return NextResponse.json({ error: 'friendshipId обязателен' }, { status: 400 })
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    })
    if (!friendship) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    // Only sender or receiver can decline/cancel
    if (friendship.senderId !== user.id && friendship.receiverId !== user.id) {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 })
    }

    if (friendship.senderId === user.id) {
      // Cancel: delete the request
      await db.friendship.delete({ where: { id: friendshipId } })
    } else {
      // Decline: mark as declined
      await db.friendship.update({
        where: { id: friendshipId },
        data: { status: 'declined' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Decline friend error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
